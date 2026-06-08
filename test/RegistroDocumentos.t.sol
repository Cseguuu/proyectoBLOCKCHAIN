// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/RegistroDocumentos.sol";

contract RegistroDocumentosTest is Test {
    RegistroDocumentos internal registro;

    address internal admin     = address(0xA11CE);
    address internal emisor    = address(0xE1115);
    address internal titular   = address(0x7174A);
    address internal extranio  = address(0xBADBAD);

    bytes32 internal hashDoc   = keccak256("documento-sensible-001");

    event DocumentoRegistrado(
        bytes32 indexed hashDoc,
        address indexed emisor,
        address indexed titular,
        RegistroDocumentos.TipoDocumento tipo,
        uint64 timestamp
    );

    event DocumentoVerificado(
        bytes32 indexed hashDoc,
        address indexed verificador,
        bool valido
    );

    function setUp() public {
        vm.prank(admin);
        registro = new RegistroDocumentos();

        vm.prank(admin);
        registro.autorizarEmisor(emisor);
    }

    // ---------- Roles ----------

    function test_AdminPuedeAutorizarEmisor() public {
        address nuevo = address(0xBEEF);
        vm.prank(admin);
        registro.autorizarEmisor(nuevo);
        assertTrue(registro.emisoresAutorizados(nuevo));
    }

    function test_NoAdminNoPuedeAutorizar() public {
        vm.prank(extranio);
        vm.expectRevert(RegistroDocumentos.SoloAdmin.selector);
        registro.autorizarEmisor(extranio);
    }

    function test_AdminPuedeRevocarEmisor() public {
        vm.prank(admin);
        registro.revocarEmisor(emisor);
        assertFalse(registro.emisoresAutorizados(emisor));
    }

    // ---------- Registro ----------

    function test_RegistrarEmiteEventoYGuardaDocumento() public {
        vm.expectEmit(true, true, true, true);
        emit DocumentoRegistrado(
            hashDoc,
            emisor,
            titular,
            RegistroDocumentos.TipoDocumento.Titulo,
            uint64(block.timestamp)
        );

        vm.prank(emisor);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Titulo);

        (bool valido, RegistroDocumentos.Documento memory doc) = registro.consultar(hashDoc);
        assertTrue(valido);
        assertEq(doc.emisor, emisor);
        assertEq(doc.titular, titular);
        assertEq(uint8(doc.tipo), uint8(RegistroDocumentos.TipoDocumento.Titulo));
    }

    function test_NoEmisorNoPuedeRegistrar() public {
        vm.prank(extranio);
        vm.expectRevert(RegistroDocumentos.NoAutorizado.selector);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Generico);
    }

    function test_NoSePuedeRegistrarHashCero() public {
        vm.prank(emisor);
        vm.expectRevert(RegistroDocumentos.HashInvalido.selector);
        registro.registrar(bytes32(0), titular, RegistroDocumentos.TipoDocumento.Generico);
    }

    function test_NoSePuedeRegistrarDosVecesElMismoHash() public {
        vm.startPrank(emisor);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Generico);
        vm.expectRevert(RegistroDocumentos.DocumentoYaExiste.selector);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Generico);
        vm.stopPrank();
    }

    // ---------- Verificación ----------

    function test_VerificarDocumentoValido() public {
        vm.prank(emisor);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Certificado);

        vm.expectEmit(true, true, false, true);
        emit DocumentoVerificado(hashDoc, extranio, true);

        vm.prank(extranio);
        (bool valido, ) = registro.verificar(hashDoc);
        assertTrue(valido);
    }

    function test_VerificarDocumentoInexistente() public {
        vm.prank(extranio);
        (bool valido, RegistroDocumentos.Documento memory doc) = registro.verificar(hashDoc);
        assertFalse(valido);
        assertEq(doc.emisor, address(0));
    }

    // ---------- Fuzz ----------

    function testFuzz_RegistrarHashesAleatorios(bytes32 h, uint8 tipoRaw) public {
        vm.assume(h != bytes32(0));
        RegistroDocumentos.TipoDocumento tipo =
            RegistroDocumentos.TipoDocumento(uint8(tipoRaw % 5));

        vm.prank(emisor);
        registro.registrar(h, titular, tipo);

        (bool valido, ) = registro.consultar(h);
        assertTrue(valido);
    }
}
