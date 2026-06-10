// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RegistroDocumentos
/// @notice Registro inmutable de hashes de documentos sensibles.
/// @dev El documento real NO vive on-chain; solo se almacena su huella criptográfica.
///      Funciona con cualquier tipo de archivo (PDF, DOCX, imágenes, etc.) porque
///      el hash se calcula off-chain sobre los bytes crudos del archivo.
contract RegistroDocumentos {
    enum TipoDocumento { Generico, Titulo, Certificado, Contrato, Identidad }

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
    modifier soloAdmin() {
        if (msg.sender != admin) revert SoloAdmin();
        _;
    }

    modifier soloEmisor() {
        if (!emisoresAutorizados[msg.sender]) revert NoAutorizado();
        _;
    }

    constructor() {
        admin = msg.sender;
        emisoresAutorizados[msg.sender] = true; // el admin parte como emisor
        emit EmisorAutorizado(msg.sender, msg.sender);
    }

    // ---------- Gestión de roles ----------
    function autorizarEmisor(address emisor) external soloAdmin {
        if (emisor == address(0)) revert DireccionInvalida();
        emisoresAutorizados[emisor] = true;
        emit EmisorAutorizado(emisor, msg.sender);
    }

    function revocarEmisor(address emisor) external soloAdmin {
        emisoresAutorizados[emisor] = false;
        emit EmisorRevocado(emisor, msg.sender);
    }

    /// @notice Transfiere el rol de admin a otra dirección.
    /// @dev El nuevo admin queda también como emisor autorizado.
    function transferirAdmin(address nuevoAdmin) external soloAdmin {
        if (nuevoAdmin == address(0)) revert DireccionInvalida();
        address anterior = admin;
        admin = nuevoAdmin;
        emisoresAutorizados[nuevoAdmin] = true;
        emit AdminTransferido(anterior, nuevoAdmin);
        emit EmisorAutorizado(nuevoAdmin, anterior);
    }

    // ---------- Lógica principal ----------

    /// @notice Registra el hash de un documento.
    /// @param hashDoc keccak256/sha256 del archivo original, calculado off-chain.
    /// @param titular dirección del dueño del documento.
    /// @param tipo categoría del documento.
    function registrar(bytes32 hashDoc, address titular, TipoDocumento tipo)
        external
        soloEmisor
    {
        if (hashDoc == bytes32(0)) revert HashInvalido();
        if (documentos[hashDoc].existe) revert DocumentoYaExiste();

        documentos[hashDoc] = Documento({
            emisor: msg.sender,
            titular: titular,
            timestamp: uint64(block.timestamp),
            tipo: tipo,
            existe: true,
            revocado: false
        });

        emit DocumentoRegistrado(hashDoc, msg.sender, titular, tipo, uint64(block.timestamp));
    }

    /// @notice Invalida un documento registrado (ej: título revocado, contrato anulado).
    /// @dev Solo el emisor original del documento o el admin pueden revocarlo.
    ///      El registro histórico se conserva; el documento deja de ser válido.
    function revocarDocumento(bytes32 hashDoc) external {
        Documento storage doc = documentos[hashDoc];
        if (!doc.existe) revert DocumentoNoExiste();
        if (doc.revocado) revert DocumentoYaRevocado();
        if (msg.sender != doc.emisor && msg.sender != admin) revert NoAutorizado();

        doc.revocado = true;
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
        doc = documentos[hashDoc];
        valido = doc.existe && !doc.revocado;
        emit DocumentoVerificado(hashDoc, msg.sender, valido);
    }

    /// @notice Versión `view` para consultar sin emitir evento ni gastar gas en una tx.
    function consultar(bytes32 hashDoc)
        external
        view
        returns (bool valido, Documento memory doc)
    {
        doc = documentos[hashDoc];
        valido = doc.existe && !doc.revocado;
    }
}
