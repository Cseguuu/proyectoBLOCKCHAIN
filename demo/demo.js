#!/usr/bin/env node
// CLI de demostracion para el contrato RegistroDocumentos en Sepolia.
//
// Uso:
//   node demo.js registrar <archivo> <titular> <tipo>
//   node demo.js verificar <archivo>
//   node demo.js consultar <archivo>
//   node demo.js revocar-doc <archivo>
//   node demo.js autorizar <address>
//   node demo.js revocar-emisor <address>
//   node demo.js transferir-admin <address>
//   node demo.js info
//
// Funciona con cualquier tipo de archivo (PDF, DOCX, imagenes, txt, etc.):
// el hash keccak256 se calcula sobre los bytes crudos del archivo.
//
// Requiere un archivo .env con:
//   SEPOLIA_RPC_URL=...
//   PRIVATE_KEY=0x...
//   CONTRACT_ADDRESS=0x...

import "dotenv/config";
import { readFileSync } from "node:fs";
import { ethers } from "ethers";
import { REGISTRO_ABI, nombreTipo, indiceTipo } from "./abi.js";

const { SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

function exigirEnv() {
  const faltan = [];
  if (!SEPOLIA_RPC_URL) faltan.push("SEPOLIA_RPC_URL");
  if (!PRIVATE_KEY) faltan.push("PRIVATE_KEY");
  if (!CONTRACT_ADDRESS) faltan.push("CONTRACT_ADDRESS");
  if (faltan.length) {
    console.error(`Faltan variables en .env: ${faltan.join(", ")}`);
    process.exit(1);
  }
}

// Calcula el hash del documento (keccak256 de los bytes del archivo).
// Es la misma huella que se compara on-chain.
function hashDeArchivo(ruta) {
  const bytes = readFileSync(ruta);
  return ethers.keccak256(bytes);
}

function conectar() {
  exigirEnv();
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contrato = new ethers.Contract(CONTRACT_ADDRESS, REGISTRO_ABI, wallet);
  return { provider, wallet, contrato };
}

function fmtFecha(ts) {
  return new Date(Number(ts) * 1000).toLocaleString("es-CL");
}

function linkTx(hash) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

// ---------------------------------------------------------------------------

async function cmdRegistrar(archivo, titular, tipo) {
  if (!archivo || !titular || tipo === undefined) {
    console.error("Uso: node demo.js registrar <archivo> <titular> <tipo>");
    console.error("Tipos: Generico | Titulo | Certificado | Contrato | Identidad");
    process.exit(1);
  }
  const { contrato } = conectar();
  const hash = hashDeArchivo(archivo);
  const tipoIdx = indiceTipo(tipo);

  console.log(`\n  Archivo:   ${archivo}`);
  console.log(`  Hash:      ${hash}`);
  console.log(`  Titular:   ${titular}`);
  console.log(`  Tipo:      ${nombreTipo(tipoIdx)}`);
  console.log(`\n  Enviando transaccion de registro...`);

  const tx = await contrato.registrar(hash, titular, tipoIdx);
  console.log(`  Tx enviada: ${linkTx(tx.hash)}`);
  const receipt = await tx.wait();
  console.log(`  Confirmada en bloque ${receipt.blockNumber}  (gas usado: ${receipt.gasUsed})`);

  // Decodificar el evento DocumentoRegistrado del receipt.
  for (const log of receipt.logs) {
    try {
      const parsed = contrato.interface.parseLog(log);
      if (parsed?.name === "DocumentoRegistrado") {
        console.log(`\n  Evento DocumentoRegistrado:`);
        console.log(`    emisor:    ${parsed.args.emisor}`);
        console.log(`    titular:   ${parsed.args.titular}`);
        console.log(`    tipo:      ${nombreTipo(parsed.args.tipo)}`);
        console.log(`    timestamp: ${fmtFecha(parsed.args.timestamp)}`);
      }
    } catch { /* log de otro contrato, se ignora */ }
  }
  console.log(`\n  Documento registrado exitosamente.\n`);
}

async function cmdVerificar(archivo) {
  if (!archivo) {
    console.error("Uso: node demo.js verificar <archivo>");
    process.exit(1);
  }
  const { contrato } = conectar();
  const hash = hashDeArchivo(archivo);

  console.log(`\n  Archivo: ${archivo}`);
  console.log(`  Hash:    ${hash}`);
  console.log(`\n  Llamando verificar() (transaccion, deja traza on-chain)...`);

  const tx = await contrato.verificar(hash);
  console.log(`  Tx enviada: ${linkTx(tx.hash)}`);
  const receipt = await tx.wait();

  // El resultado real lo leemos de forma estatica (sin gastar) para mostrarlo.
  const [valido, doc] = await contrato.consultar.staticCall(hash);
  if (valido) {
    console.log(`\n  >>> DOCUMENTO AUTENTICO <<<`);
    console.log(`    emisor:    ${doc.emisor}`);
    console.log(`    titular:   ${doc.titular}`);
    console.log(`    tipo:      ${nombreTipo(doc.tipo)}`);
    console.log(`    registrado: ${fmtFecha(doc.timestamp)}`);
  } else {
    console.log(`\n  >>> DOCUMENTO NO REGISTRADO (posible falsificacion) <<<`);
  }
  console.log(`  (verificacion confirmada en bloque ${receipt.blockNumber})\n`);
}

async function cmdConsultar(archivo) {
  if (!archivo) {
    console.error("Uso: node demo.js consultar <archivo>");
    process.exit(1);
  }
  const { contrato } = conectar();
  const hash = hashDeArchivo(archivo);

  console.log(`\n  Archivo: ${archivo}`);
  console.log(`  Hash:    ${hash}`);

  const [valido, doc] = await contrato.consultar(hash);
  if (valido) {
    console.log(`\n  >>> DOCUMENTO AUTENTICO <<< (consulta gratuita, sin transaccion)`);
    console.log(`    emisor:    ${doc.emisor}`);
    console.log(`    titular:   ${doc.titular}`);
    console.log(`    tipo:      ${nombreTipo(doc.tipo)}`);
    console.log(`    registrado: ${fmtFecha(doc.timestamp)}\n`);
  } else if (doc.existe && doc.revocado) {
    console.log(`\n  >>> DOCUMENTO REVOCADO <<< (fue registrado pero ya no es valido)`);
    console.log(`    emisor:    ${doc.emisor}`);
    console.log(`    titular:   ${doc.titular}`);
    console.log(`    registrado: ${fmtFecha(doc.timestamp)}\n`);
  } else {
    console.log(`\n  >>> DOCUMENTO NO REGISTRADO <<<\n`);
  }
}

async function cmdRevocarDoc(archivo) {
  if (!archivo) {
    console.error("Uso: node demo.js revocar-doc <archivo>");
    process.exit(1);
  }
  const { contrato } = conectar();
  const hash = hashDeArchivo(archivo);

  console.log(`\n  Archivo: ${archivo}`);
  console.log(`  Hash:    ${hash}`);
  console.log(`\n  Enviando transaccion de revocacion...`);

  const tx = await contrato.revocarDocumento(hash);
  console.log(`  Tx enviada: ${linkTx(tx.hash)}`);
  const receipt = await tx.wait();
  console.log(`  Confirmada en bloque ${receipt.blockNumber}`);
  console.log(`\n  Documento revocado. Ya no aparecera como valido.\n`);
}

async function cmdAutorizar(address) {
  if (!address) {
    console.error("Uso: node demo.js autorizar <address>");
    process.exit(1);
  }
  const { contrato } = conectar();
  console.log(`\n  Autorizando emisor: ${address}`);
  const tx = await contrato.autorizarEmisor(address);
  console.log(`  Tx enviada: ${linkTx(tx.hash)}`);
  const receipt = await tx.wait();
  console.log(`  Confirmada en bloque ${receipt.blockNumber}`);
  const ok = await contrato.emisoresAutorizados(address);
  console.log(`  ¿Es emisor autorizado ahora? ${ok}\n`);
}

async function cmdRevocarEmisor(address) {
  if (!address) {
    console.error("Uso: node demo.js revocar-emisor <address>");
    process.exit(1);
  }
  const { contrato } = conectar();
  console.log(`\n  Revocando emisor: ${address}`);
  const tx = await contrato.revocarEmisor(address);
  console.log(`  Tx enviada: ${linkTx(tx.hash)}`);
  const receipt = await tx.wait();
  console.log(`  Confirmada en bloque ${receipt.blockNumber}`);
  const ok = await contrato.emisoresAutorizados(address);
  console.log(`  ¿Sigue siendo emisor autorizado? ${ok}\n`);
}

async function cmdTransferirAdmin(address) {
  if (!address) {
    console.error("Uso: node demo.js transferir-admin <address>");
    process.exit(1);
  }
  const { contrato } = conectar();
  console.log(`\n  ADVERTENCIA: esta accion transfiere el control total del contrato.`);
  console.log(`  Transfiriendo admin a: ${address}`);
  const tx = await contrato.transferirAdmin(address);
  console.log(`  Tx enviada: ${linkTx(tx.hash)}`);
  const receipt = await tx.wait();
  console.log(`  Confirmada en bloque ${receipt.blockNumber}`);
  const nuevoAdmin = await contrato.admin();
  console.log(`  Nuevo admin: ${nuevoAdmin}\n`);
}

async function cmdInfo() {
  const { contrato, wallet } = conectar();
  const admin = await contrato.admin();
  const yoSoyEmisor = await contrato.emisoresAutorizados(wallet.address);
  console.log(`\n  Contrato:  ${CONTRACT_ADDRESS}`);
  console.log(`  Admin:     ${admin}`);
  console.log(`  Mi wallet: ${wallet.address}`);
  console.log(`  ¿Soy emisor autorizado? ${yoSoyEmisor}`);
  console.log(`  Etherscan: https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}\n`);
}

// ---------------------------------------------------------------------------

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case "registrar":        return cmdRegistrar(...args);
    case "verificar":        return cmdVerificar(...args);
    case "consultar":        return cmdConsultar(...args);
    case "revocar-doc":      return cmdRevocarDoc(...args);
    case "autorizar":        return cmdAutorizar(...args);
    case "revocar-emisor":   return cmdRevocarEmisor(...args);
    case "transferir-admin": return cmdTransferirAdmin(...args);
    case "info":             return cmdInfo();
    default:
      console.log("Comandos disponibles:");
      console.log("  node demo.js registrar <archivo> <titular> <tipo>");
      console.log("  node demo.js verificar <archivo>");
      console.log("  node demo.js consultar <archivo>   (gratis, sin tx)");
      console.log("  node demo.js revocar-doc <archivo>");
      console.log("  node demo.js autorizar <address>");
      console.log("  node demo.js revocar-emisor <address>");
      console.log("  node demo.js transferir-admin <address>");
      console.log("  node demo.js info");
  }
}

main().catch((e) => {
  console.error(`\n  ERROR: ${e.shortMessage ?? e.message}\n`);
  process.exit(1);
});
