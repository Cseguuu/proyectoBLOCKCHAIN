# Guion de Defensa — Validador de Certificados UAI
## Preguntas probables y respuestas para la interrogación

Grupo 8 — Los Callampines · TICS0870

> La rúbrica dice: *"se evaluará que todos los miembros del grupo sepan cómo funciona
> cada contrato y sepan explicar cada línea de código."* Este documento prepara para eso.
> Está pensado para responder rápido, con seguridad y con datos concretos del proyecto.

---

## Parte A — Respuestas rápidas (rapid fire)

### Sobre el hash

**P: ¿Qué algoritmo de hash usan?**
> `keccak256`. Produce una huella de 256 bits (32 bytes) a partir de cualquier archivo.

**P: ¿Por qué keccak256 y no SHA-256?**
> Porque es la función hash **nativa de la EVM**. Solidity la tiene como opcode integrado
> y ethers.js como `ethers.keccak256()`. Usarla significa que el cálculo en el contrato es
> el más barato en gas, y que el hash que calcula el navegador es directamente comparable
> con el almacenado on-chain sin conversiones. SHA-256 (la de Bitcoin) es igual de segura,
> pero en Ethereum sería un precompile más caro y necesitaría librerías extra en el frontend.

**P: ¿Keccak256 es lo mismo que SHA-3?**
> Casi. Keccak ganó el concurso para ser SHA-3, pero Ethereum adoptó la versión *original*
> de Keccak antes de que NIST le hiciera un ajuste menor de padding. Por eso se llama
> `keccak256` y no `sha3_256` — difieren en una constante de padding, no en seguridad.

**P: ¿Dónde se calcula el hash?**
> **Off-chain, en el navegador del usuario** (o en Node.js en la CLI). El archivo nunca
> se sube a ningún lado. Solo el hash de 32 bytes viaja a la blockchain.

**P: ¿Qué propiedad del hash garantiza que no se puede falsificar?**
> La **propiedad de avalancha**: cambiar un solo byte del archivo (una nota, una fecha, una
> letra del nombre) produce un hash completamente distinto. Y la **resistencia a colisiones**:
> es computacionalmente inviable construir un archivo distinto que dé el mismo hash.

### Sobre la blockchain

**P: ¿Por qué Ethereum y no Bitcoin?**
> Porque necesitamos un smart contract con lógica: un mapping de hashes, control de roles,
> revocación, eventos. Bitcoin solo transfiere valor; no tiene un lenguaje para esa lógica.
> Ethereum es una máquina de estados programable (la EVM).

**P: ¿En qué red está desplegado?**
> En **Sepolia**, la testnet oficial de Ethereum. Mismo protocolo que la mainnet pero con
> ETH de prueba sin valor real. Dirección: `0x237b7111Be8436Ba3c74826C3C2DA6B3b2309cE1`.

**P: ¿Qué mecanismo de consenso usa?**
> Ethereum hoy usa **Proof of Stake** (desde "The Merge" en 2022). No es algo que nosotros
> elijamos: es la capa de infraestructura. Nos garantiza que un registro confirmado es
> inmutable, que es lo que necesitamos.

**P: ¿Cuánto cuesta registrar un documento?**
> ~72.000 gas por registro. En Sepolia es gratis (ETH de prueba). En mainnet, a 2 gwei y
> ETH a USD 3.000, serían ~USD 0,43.

### Sobre las cuentas y firmas

**P: ¿Cómo se firma una transacción?**
> Cada acción de escritura (registrar, revocar, autorizar) la inicia una **EOA** (cuenta
> controlada por clave privada) que firma la transacción con **MetaMask**. La firma prueba
> criptográficamente quién hizo la acción, sin revelar la clave privada.

**P: ¿El verificador necesita wallet?**
> No. Verificar es una llamada `view` de solo lectura: usa un RPC público y no cuesta gas ni
> requiere firma. Solo emitir/revocar/administrar necesita MetaMask.

**P: ¿Dónde guardan la clave privada?**
> Nunca está en nuestro código ni en el servidor. Vive en MetaMask (o en el keystore local
> de Foundry para la CLI). El `.env` con la clave está en `.gitignore`.

---

## Parte B — Explicación línea por línea del contrato

> `src/RegistroDocumentos.sol`. Esto es lo que más pesa en la rúbrica.

**Líneas 1–2 — Licencia y versión**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
```
- `SPDX`: identificador de licencia, buena práctica obligatoria en Solidity moderno.
- `pragma ^0.8.24`: compila con 0.8.24 o superior dentro de la misma major. Desde 0.8 el
  overflow/underflow aritmético revierte automáticamente (antes había que usar SafeMath).

**Líneas 12–18 — El enum de tipos**
```solidity
enum TipoDocumento { CertificadoAlumnoRegular, DiplomaTitulo, ConcentracionNotas, CertificadoEgreso, Otro }
```
- Un enum es un tipo con valores fijos. Internamente es un `uint8`: `CertificadoAlumnoRegular`
  es 0, `DiplomaTitulo` es 1, etc. Modela los documentos académicos reales de la UAI.

**Líneas 20–27 — El struct Documento**
```solidity
struct Documento {
    address emisor;       // quién lo registró
    address titular;      // a qué alumno pertenece
    uint64  timestamp;    // cuándo se registró
    TipoDocumento tipo;   // qué tipo de certificado
    bool    existe;       // ¿el slot está ocupado?
    bool    revocado;     // ¿fue invalidado?
}
```
- Agrupa los datos de cada certificado. `uint64` para el timestamp (no `uint256`) para que
  varios campos quepan en un mismo storage slot de 32 bytes y ahorrar gas.
- `existe` es clave: Solidity devuelve un struct con todo en cero para una clave inexistente.
  Sin `existe` no podríamos distinguir "no registrado" de "registrado con valores cero".

**Líneas 29–34 — Variables de estado**
```solidity
address public admin;
mapping(bytes32 => Documento) private documentos;
mapping(address => bool) public emisoresAutorizados;
```
- `admin`: la dirección que controla el contrato. `public` genera un getter automático.
- `documentos`: el corazón del sistema. Mapea cada hash a su `Documento`. Acceso O(1).
  Es `private` para que no se expongan los structs en masa, pero se leen vía `consultar`.
- `emisoresAutorizados`: quién puede registrar. `public` para poder consultarlo desde fuera.

**Líneas 37–58 — Eventos**
```solidity
event DocumentoRegistrado(bytes32 indexed hashDoc, address indexed emisor, ...);
```
- Los eventos quedan en los logs de la blockchain. `indexed` permite filtrarlos
  eficientemente (ej: "todos los documentos de este emisor"). El frontend los lee con
  `queryFilter` para mostrar el historial on-chain.

**Líneas 61–67 — Custom errors**
```solidity
error NoAutorizado();
error SoloAdmin();
```
- Reemplazan a `require("mensaje")`. Gastan menos gas (no guardan el string) y permiten
  testear con `vm.expectRevert(Contrato.SoloAdmin.selector)` en Forge.

**Líneas 70–78 — Modifiers**
```solidity
modifier soloAdmin() {
    if (msg.sender != admin) revert SoloAdmin();
    _;
}
```
- `modifier` es código reutilizable que envuelve funciones. `_;` es donde se inserta el
  cuerpo de la función. `soloAdmin` verifica que quien llama (`msg.sender`) sea el admin;
  si no, revierte. Centraliza el control de acceso en un solo lugar.

**Líneas 80–84 — Constructor**
```solidity
constructor() {
    admin = msg.sender;
    emisoresAutorizados[msg.sender] = true;
    emit EmisorAutorizado(msg.sender, msg.sender);
}
```
- Corre una sola vez, al desplegar. Quien despliega (`msg.sender`) queda como admin y
  como primer emisor. En el caso UAI, esto sería TI UAI.

**Líneas 87–96 — Gestión de emisores**
```solidity
function autorizarEmisor(address emisor) external soloAdmin {
    if (emisor == address(0)) revert DireccionInvalida();
    emisoresAutorizados[emisor] = true;
    emit EmisorAutorizado(emisor, msg.sender);
}
```
- Solo el admin puede llamarla (`soloAdmin`). Valida que no sea la dirección cero
  (`address(0)`, una dirección inválida usada por error). Marca al emisor como autorizado.

**Líneas 100–107 — Transferir admin**
```solidity
function transferirAdmin(address nuevoAdmin) external soloAdmin {
    if (nuevoAdmin == address(0)) revert DireccionInvalida();
    admin = nuevoAdmin;
    emisoresAutorizados[nuevoAdmin] = true;
    ...
}
```
- Traspasa el control. El nuevo admin queda también como emisor. Es irreversible para el
  admin anterior — por eso el frontend pide confirmación.

**Líneas 115–132 — Registrar (la función central)**
```solidity
function registrar(bytes32 hashDoc, address titular, TipoDocumento tipo) external soloEmisor {
    if (hashDoc == bytes32(0)) revert HashInvalido();
    if (documentos[hashDoc].existe) revert DocumentoYaExiste();
    documentos[hashDoc] = Documento({ emisor: msg.sender, titular: titular, ... existe: true, revocado: false });
    emit DocumentoRegistrado(hashDoc, msg.sender, titular, tipo, uint64(block.timestamp));
}
```
- `soloEmisor`: solo wallets autorizadas pueden registrar.
- Valida que el hash no sea cero y que no exista ya (anti-doble-registro).
- Guarda el struct y emite el evento. `block.timestamp` es la hora del bloque.

**Líneas 137–145 — Revocar documento**
```solidity
function revocarDocumento(bytes32 hashDoc) external {
    Documento storage doc = documentos[hashDoc];
    if (!doc.existe) revert DocumentoNoExiste();
    if (doc.revocado) revert DocumentoYaRevocado();
    if (msg.sender != doc.emisor && msg.sender != admin) revert NoAutorizado();
    doc.revocado = true;
    emit DocumentoRevocado(hashDoc, msg.sender);
}
```
- `storage doc`: referencia directa al struct en almacenamiento (modificarlo cambia el
  estado). Solo el emisor original **o** el admin pueden revocar. No borra el registro:
  marca `revocado = true`, conservando el historial.

**Líneas 151–158 — Verificar (transacción, deja traza)**
```solidity
function verificar(bytes32 hashDoc) external returns (bool valido, Documento memory doc) {
    doc = documentos[hashDoc];
    valido = doc.existe && !doc.revocado;
    emit DocumentoVerificado(hashDoc, msg.sender, valido);
}
```
- `memory doc`: copia temporal para devolver, no modifica el estado. `valido` es true solo
  si existe y no está revocado. Emite evento → queda traza de quién verificó.

**Líneas 161–168 — Consultar (view, gratis)**
```solidity
function consultar(bytes32 hashDoc) external view returns (bool valido, Documento memory doc) {
    doc = documentos[hashDoc];
    valido = doc.existe && !doc.revocado;
}
```
- Idéntica a `verificar` pero `view`: no modifica estado ni emite evento → no cuesta gas ni
  requiere wallet. Es la que usa el verificador típico.

---

## Parte C — Preguntas trampa y cómo responderlas

**P: "¿Por qué `verificar` y `consultar` hacen lo mismo? ¿No es código repetido?"**
> No es repetición casual, es una decisión de diseño. `consultar` es `view` (gratis, sin
> traza) para el uso masivo. `verificar` emite un evento para dejar prueba on-chain de que
> alguien verificó — útil en una auditoría o proceso legal. Es la diferencia entre *leer* y
> *dejar constancia*, que es justamente la distinción `view` vs transacción del curso.

**P: "Si guardan solo el hash, ¿cómo saben de qué alumno es el certificado?"**
> El struct guarda la dirección del `titular` (el alumno) y del `emisor` junto con el hash.
> El *contenido* del PDF no está on-chain, pero sí los metadatos de quién lo emitió y para
> quién. La verificación confirma autenticidad e integridad, no revela el contenido.

**P: "¿Qué pasa si dos alumnos tienen el mismo certificado?"**
> Si los archivos son byte-a-byte idénticos, tendrían el mismo hash y el segundo registro
> fallaría con `DocumentoYaExiste`. En la práctica no ocurre: cada certificado tiene RUT,
> nombre y fecha distintos, así que cada hash es único.

**P: "¿Puede alguien registrar un documento falso?"**
> Solo un emisor autorizado puede registrar (`soloEmisor`). Si una wallet no fue autorizada
> por el admin, su transacción revierte. La confianza está en que el admin (TI UAI) solo
> autoriza a oficinas legítimas.

**P: "¿Qué impide que copien el hash del mempool y lo registren primero?" (front-running)**
> Es una limitación real que reconocemos en el análisis crítico. Cuando el emisor envía la
> transacción, el hash es visible en el mempool antes de confirmarse. Mitigación conocida:
> esquema commit-reveal (registrar primero un compromiso con un salt secreto y revelar
> después). No lo implementamos por simplicidad del prototipo.

**P: "¿Y si pierden la clave del admin?"**
> Nadie podría autorizar nuevos emisores. En producción se mitiga con un contrato multisig
> (Gnosis Safe) o `AccessControl` de OpenZeppelin. Para el prototipo, una EOA simple basta.

**P: "¿Por qué `bytes32` y no `string` para el hash?"**
> `keccak256` devuelve 32 bytes nativamente. `bytes32` ocupa exactamente un storage slot,
> el lookup es O(1) y es mucho más barato en gas que `string`, que es de longitud variable.

**P: "¿El contrato es actualizable?"**
> No, es inmutable una vez desplegado — esa es justamente la garantía de seguridad. Para
> cambiar la lógica habría que desplegar un contrato nuevo. Patrones de upgradeability
> (proxies) existen pero añaden complejidad y superficie de ataque; no aplican al prototipo.

---

## Parte D — Datos que conviene tener memorizados

| Dato | Valor |
|---|---|
| Algoritmo de hash | keccak256 (256 bits / 32 bytes) |
| Lenguaje del contrato | Solidity 0.8.24 |
| Red | Ethereum Sepolia (testnet, Proof of Stake) |
| Dirección del contrato | `0x237b7111Be8436Ba3c74826C3C2DA6B3b2309cE1` |
| Framework | Foundry (forge + cast) |
| Tests | 21 (unitarios + 2 de fuzzing con 256 runs c/u) |
| Gas por registro | ~72.000 |
| Librería de conexión | ethers.js v6.13.2 |
| Frontend | React 18 + Vite 5 + TypeScript + Tailwind |
| Roles | Admin (TI UAI) / Emisor (Registro Académico) / Verificador (público) |
| Dónde se calcula el hash | Off-chain, en el navegador (el archivo nunca se sube) |

---

*Documento de preparación generado con asistencia de Claude (Anthropic) — TICS0870, Grupo 8.*
