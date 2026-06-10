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

    event DocumentoRevocado(
        bytes32 indexed hashDoc,
        address indexed por
    );

    event AdminTransferido(address indexed anterior, address indexed nuevo);

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

    // ---------- Revocación de documentos ----------

    function test_EmisorPuedeRevocarSuDocumento() public {
        vm.prank(emisor);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Titulo);

        vm.expectEmit(true, true, false, false);
        emit DocumentoRevocado(hashDoc, emisor);

        vm.prank(emisor);
        registro.revocarDocumento(hashDoc);

        (bool valido, RegistroDocumentos.Documento memory doc) = registro.consultar(hashDoc);
        assertFalse(valido);          // ya no es válido
        assertTrue(doc.existe);       // pero el registro histórico se conserva
        assertTrue(doc.revocado);
    }

    function test_AdminPuedeRevocarCualquierDocumento() public {
        vm.prank(emisor);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Contrato);

        vm.prank(admin);
        registro.revocarDocumento(hashDoc);

        (bool valido, ) = registro.consultar(hashDoc);
        assertFalse(valido);
    }

    function test_ExtranioNoPuedeRevocarDocumento() public {
        vm.prank(emisor);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Generico);

        vm.prank(extranio);
        vm.expectRevert(RegistroDocumentos.NoAutorizado.selector);
        registro.revocarDocumento(hashDoc);
    }

    function test_NoSePuedeRevocarDocumentoInexistente() public {
        vm.prank(admin);
        vm.expectRevert(RegistroDocumentos.DocumentoNoExiste.selector);
        registro.revocarDocumento(hashDoc);
    }

    function test_NoSePuedeRevocarDosVeces() public {
        vm.startPrank(emisor);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Generico);
        registro.revocarDocumento(hashDoc);
        vm.expectRevert(RegistroDocumentos.DocumentoYaRevocado.selector);
        registro.revocarDocumento(hashDoc);
        vm.stopPrank();
    }

    function test_VerificarDocumentoRevocadoDevuelveInvalido() public {
        vm.startPrank(emisor);
        registro.registrar(hashDoc, titular, RegistroDocumentos.TipoDocumento.Titulo);
        registro.revocarDocumento(hashDoc);
        vm.stopPrank();

        vm.expectEmit(true, true, false, true);
        emit DocumentoVerificado(hashDoc, extranio, false);

        vm.prank(extranio);
        (bool valido, RegistroDocumentos.Documento memory doc) = registro.verificar(hashDoc);
        assertFalse(valido);
        assertTrue(doc.revocado);
    }

    // ---------- Transferencia de admin ----------

    function test_AdminPuedeTransferirAdmin() public {
        address nuevoAdmin = address(0xCAFE);

        vm.expectEmit(true, true, false, false);
        emit AdminTransferido(admin, nuevoAdmin);

        vm.prank(admin);
        registro.transferirAdmin(nuevoAdmin);

        assertEq(registro.admin(), nuevoAdmin);
        assertTrue(registro.emisoresAutorizados(nuevoAdmin));

        // el admin anterior ya no puede autorizar emisores
        vm.prank(admin);
        vm.expectRevert(RegistroDocumentos.SoloAdmin.selector);
        registro.autorizarEmisor(address(0xBEEF));

        // el nuevo admin sí puede
        vm.prank(nuevoAdmin);
        registro.autorizarEmisor(address(0xBEEF));
        assertTrue(registro.emisoresAutorizados(address(0xBEEF)));
    }

    function test_NoAdminNoPuedeTransferirAdmin() public {
        vm.prank(extranio);
        vm.expectRevert(RegistroDocumentos.SoloAdmin.selector);
        registro.transferirAdmin(extranio);
    }

    function test_NoSePuedeTransferirAdminADireccionCero() public {
        vm.prank(admin);
        vm.expectRevert(RegistroDocumentos.DireccionInvalida.selector);
        registro.transferirAdmin(address(0));
    }

    function test_NoSePuedeAutorizarDireccionCero() public {
        vm.prank(admin);
        vm.expectRevert(RegistroDocumentos.DireccionInvalida.selector);
        registro.autorizarEmisor(address(0));
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

    function testFuzz_RegistrarYRevocar(bytes32 h) public {
        vm.assume(h != bytes32(0));

        vm.startPrank(emisor);
        registro.registrar(h, titular, RegistroDocumentos.TipoDocumento.Generico);
        registro.revocarDocumento(h);
        vm.stopPrank();

        (bool valido, RegistroDocumentos.Documento memory doc) = registro.consultar(h);
        assertFalse(valido);
        assertTrue(doc.existe);
        assertTrue(doc.revocado);
    }
}
