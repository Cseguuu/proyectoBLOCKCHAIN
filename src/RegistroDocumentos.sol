// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RegistroDocumentos
/// @notice Registro inmutable de hashes de documentos sensibles.
/// @dev El documento real NO vive on-chain; solo se almacena su huella criptográfica.
contract RegistroDocumentos {
    enum TipoDocumento { Generico, Titulo, Certificado, Contrato, Identidad }

    struct Documento {
        address emisor;       // quien registró
        address titular;      // a quién pertenece
        uint64  timestamp;    // momento del registro (block.timestamp)
        TipoDocumento tipo;   // categoría del documento
        bool    existe;       // flag para distinguir slot vacío
    }

    address public admin;

    // hash del documento => Documento
    mapping(bytes32 => Documento) private documentos;
    // dirección => puede registrar?
    mapping(address => bool) public emisoresAutorizados;

    // ---------- Eventos ----------
    event EmisorAutorizado(address indexed emisor, address indexed por);
    event EmisorRevocado(address indexed emisor, address indexed por);

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

    // ---------- Errores ----------
    error NoAutorizado();
    error SoloAdmin();
    error HashInvalido();
    error DocumentoYaExiste();
    error DocumentoNoExiste();

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
        emisoresAutorizados[emisor] = true;
        emit EmisorAutorizado(emisor, msg.sender);
    }

    function revocarEmisor(address emisor) external soloAdmin {
        emisoresAutorizados[emisor] = false;
        emit EmisorRevocado(emisor, msg.sender);
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
            existe: true
        });

        emit DocumentoRegistrado(hashDoc, msg.sender, titular, tipo, uint64(block.timestamp));
    }

    /// @notice Verifica si un hash está registrado y devuelve sus metadatos.
    /// @dev Emite un evento para dejar traza on-chain de la consulta.
    function verificar(bytes32 hashDoc)
        external
        returns (bool valido, Documento memory doc)
    {
        doc = documentos[hashDoc];
        valido = doc.existe;
        emit DocumentoVerificado(hashDoc, msg.sender, valido);
    }

    /// @notice Versión `view` para consultar sin emitir evento ni gastar gas en una tx.
    function consultar(bytes32 hashDoc)
        external
        view
        returns (bool valido, Documento memory doc)
    {
        doc = documentos[hashDoc];
        valido = doc.existe;
    }
}
