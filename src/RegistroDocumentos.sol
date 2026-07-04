// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RegistroDocumentos
/// @notice Registro inmutable de hashes de certificados académicos.
/// @dev Caso de uso: una institución (ej: Universidad Adolfo Ibáñez) certifica de
///      forma verificable documentos como certificados de alumno regular, diplomas
///      de título o concentraciones de notas. El documento real NO vive on-chain;
///      solo se almacena su huella criptográfica keccak256, calculada off-chain sobre
///      los bytes crudos del archivo (funciona con PDF, DOCX, imágenes, etc.).
contract RegistroDocumentos {
    enum TipoDocumento {
        CertificadoAlumnoRegular,
        DiplomaTitulo,
        ConcentracionNotas,
        CertificadoEgreso,
        Otro
    }

    struct Documento {
        address emisor;       // quien registró
        address titular;      // a quién pertenece
        uint64  timestamp;    // momento del registro (block.timestamp)
        TipoDocumento tipo;   // categoría del documento
        bool    existe;       // flag para distinguir slot vacío
        bool    revocado;     // true si el documento fue invalidado
    }

    address public admin;

    // hash del documento => Documento
    mapping(bytes32 => Documento) private documentos;
    // dirección => puede registrar?
    mapping(address => bool) public emisoresAutorizados;

    // ---------- Eventos ----------
    event EmisorAutorizado(address indexed emisor, address indexed por);
    event EmisorRevocado(address indexed emisor, address indexed por);
    event AdminTransferido(address indexed anterior, address indexed nuevo);

    event DocumentoRegistrado(
        bytes32 indexed hashDoc,
        address indexed emisor,
        address indexed titular,
        TipoDocumento tipo,
        uint64 timestamp
    );

    event DocumentoVerificado(
        bytes32 indexed hashDoc,
        address indexed verificador,
        bool valido
    );

    event DocumentoRevocado(
        bytes32 indexed hashDoc,
        address indexed por
    );

    // ---------- Errores ----------
    error NoAutorizado();
    error SoloAdmin();
    error HashInvalido();
    error DocumentoYaExiste();
    error DocumentoNoExiste();
    error DocumentoYaRevocado();
    error DireccionInvalida();

    // ---------- Modifiers ----------
    // Un modifier es un "guardia" que se ejecuta ANTES del cuerpo de la función.
    // El `_;` marca dónde continúa la función si la condición pasó.

    // soloAdmin: si quien llama (msg.sender) no es el admin, revierte y cancela la tx.
    modifier soloAdmin() {
        if (msg.sender != admin) revert SoloAdmin();
        _;
    }

    // soloEmisor: solo deja pasar a wallets marcadas como autorizadas en el mapping.
    modifier soloEmisor() {
        if (!emisoresAutorizados[msg.sender]) revert NoAutorizado();
        _;
    }

    // El constructor corre UNA sola vez, al desplegar el contrato.
    constructor() {
        admin = msg.sender;                       // quien despliega queda como admin
        emisoresAutorizados[msg.sender] = true;   // y además parte como emisor
        emit EmisorAutorizado(msg.sender, msg.sender);
    }

    // ---------- Gestión de roles ----------

    // Solo el admin puede dar permiso de emisor a una wallet.
    function autorizarEmisor(address emisor) external soloAdmin {
        if (emisor == address(0)) revert DireccionInvalida();  // no autorizar la dirección cero
        emisoresAutorizados[emisor] = true;                    // marca la wallet como emisora
        emit EmisorAutorizado(emisor, msg.sender);             // deja traza de quién autorizó
    }

    // Quita el permiso de emisor (la wallet ya no podrá registrar).
    function revocarEmisor(address emisor) external soloAdmin {
        emisoresAutorizados[emisor] = false;
        emit EmisorRevocado(emisor, msg.sender);
    }

    /// @notice Transfiere el rol de admin a otra dirección.
    /// @dev El nuevo admin queda también como emisor autorizado.
    function transferirAdmin(address nuevoAdmin) external soloAdmin {
        if (nuevoAdmin == address(0)) revert DireccionInvalida(); // evita perder el control a la dirección cero
        address anterior = admin;                                 // guardamos el admin actual para el evento
        admin = nuevoAdmin;                                       // el nuevo toma el control
        emisoresAutorizados[nuevoAdmin] = true;                   // y queda también como emisor
        emit AdminTransferido(anterior, nuevoAdmin);
        emit EmisorAutorizado(nuevoAdmin, anterior);
    }

    // ---------- Lógica principal ----------

    /// @notice Registra el hash de un documento.
    /// @param hashDoc keccak256 del archivo original, calculado off-chain.
    /// @param titular dirección del dueño del documento.
    /// @param tipo categoría del documento.
    function registrar(bytes32 hashDoc, address titular, TipoDocumento tipo)
        external
        soloEmisor                                    // guardia: solo emisores autorizados entran
    {
        if (hashDoc == bytes32(0)) revert HashInvalido();        // un hash vacío no es válido
        if (documentos[hashDoc].existe) revert DocumentoYaExiste(); // no se sobrescribe: inmutabilidad

        // Guarda los metadatos del documento asociados a su huella (hash).
        documentos[hashDoc] = Documento({
            emisor: msg.sender,                       // quién lo registró
            titular: titular,                         // a quién pertenece
            timestamp: uint64(block.timestamp),       // cuándo (hora del bloque)
            tipo: tipo,                               // categoría (alumno regular, título, etc.)
            existe: true,                             // flag para distinguir un slot vacío
            revocado: false                           // nace vigente
        });

        // Evento indexado: alimenta el historial on-chain del frontend.
        emit DocumentoRegistrado(hashDoc, msg.sender, titular, tipo, uint64(block.timestamp));
    }

    /// @notice Invalida un documento registrado (ej: título revocado, contrato anulado).
    /// @dev Solo el emisor original del documento o el admin pueden revocarlo.
    ///      El registro histórico se conserva; el documento deja de ser válido.
    function revocarDocumento(bytes32 hashDoc) external {
        Documento storage doc = documentos[hashDoc];                 // referencia directa al storage para modificarlo
        if (!doc.existe) revert DocumentoNoExiste();                 // no se puede revocar algo que no existe
        if (doc.revocado) revert DocumentoYaRevocado();             // ni revocar dos veces
        // Control de acceso: solo el emisor que lo creó, o el admin.
        if (msg.sender != doc.emisor && msg.sender != admin) revert NoAutorizado();

        doc.revocado = true;        // se invalida, pero el registro histórico se conserva
        emit DocumentoRevocado(hashDoc, msg.sender);
    }

    /// @notice Verifica si un hash está registrado y vigente, y devuelve sus metadatos.
    /// @dev Emite un evento para dejar traza on-chain de la consulta.
    ///      `valido` es false tanto para documentos inexistentes como revocados;
    ///      el campo `doc.revocado` permite distinguir ambos casos.
    function verificar(bytes32 hashDoc)
        external
        returns (bool valido, Documento memory doc)
    {
        doc = documentos[hashDoc];                 // lee los metadatos asociados al hash
        valido = doc.existe && !doc.revocado;      // válido = existe Y no está revocado
        // Emite un evento → deja constancia on-chain de quién verificó y cuándo (auditoría).
        // Por esto NO es `view` y consume gas (~29k), a diferencia de `consultar`.
        emit DocumentoVerificado(hashDoc, msg.sender, valido);
    }

    /// @notice Versión `view` para consultar sin emitir evento ni gastar gas en una tx.
    function consultar(bytes32 hashDoc)
        external
        view                                       // `view` = solo lectura: no cambia estado
        returns (bool valido, Documento memory doc)
    {
        // Misma lógica que verificar pero sin evento: gratis y usable sin wallet.
        doc = documentos[hashDoc];
        valido = doc.existe && !doc.revocado;
    }
}
