# Registro de Documentos Sensibles en Blockchain
## Proyecto Final — TICS0870

**Grupo 8 — Los Callampines**
Fecha de entrega: junio 2026

---

## 1. Portada

| Campo | Valor |
|---|---|
| Título | Sistema de Registro de Documentos Sensibles en Blockchain |
| Curso | TICS0870 — Blockchain |
| Grupo | 8 — Los Callampines |
| Integrantes | *(completar con nombres del grupo)* |
| Fecha | Junio 2026 |

---

## 2. Resumen Ejecutivo

Este proyecto implementa un sistema de registro y verificación de autenticidad de documentos sensibles (títulos universitarios, certificados, contratos) sobre la red Ethereum. La solución almacena únicamente la **huella criptográfica** (`keccak256`) de cada documento en un contrato inteligente desplegado en la testnet Sepolia, sin exponer jamás el contenido original.

**Objetivos principales:**
- Proveer un mecanismo de verificación público, auditable e inmutable.
- Eliminar la dependencia de una autoridad centralizada para validar documentos.
- Implementar un control de acceso por roles (Admin / Emisor / Verificador) con lógica de revocación.

**Resultados obtenidos:**
- Contrato `RegistroDocumentos` desplegado en Sepolia (`0x237b7111Be8436Ba3c74826C3C2DA6B3b2309cE1`).
- Suite de 21 tests (unitarios + fuzzing) con 100% de cobertura de la lógica de negocio.
- Demo CLI en Node.js y frontend web (React + Vite + Tailwind) con dashboard por rol y conexión via MetaMask.

---

## 3. Introducción

### Contexto y motivación

En Chile y el mundo, la falsificación de documentos sensibles es un problema real. Los sistemas de verificación tradicionales dependen de bases de datos centralizadas susceptibles a manipulación interna, procesos lentos y sin trazabilidad pública.

La tecnología Blockchain resuelve esto mediante tres propiedades fundamentales:
- **Inmutabilidad:** ningún registro puede modificarse retroactivamente.
- **Transparencia:** cualquiera puede auditar el estado del contrato.
- **Descentralización:** no existe un operador central que pueda falsificar o eliminar datos.

### Objetivos del proyecto

1. Diseñar e implementar un contrato inteligente en Solidity para el registro de hashes de documentos.
2. Implementar un sistema de roles (Admin, Emisor, Verificador) con autorización y revocación.
3. Proporcionar herramientas de interacción: CLI para operadores técnicos y frontend web para usuarios generales.
4. Desplegar el sistema en una red de pruebas pública (Sepolia) y verificar su funcionamiento.

---

## 4. Antecedentes Técnicos

### Funciones hash criptográficas

Una función hash `H: {0,1}* → {0,1}^k` transforma una entrada de longitud arbitraria en una salida de tamaño fijo. Para ser útil en seguridad, debe cumplir:

1. **Resistencia a colisiones:** es computacionalmente inviable encontrar `x ≠ y` tal que `H(x) = H(y)`.
2. **Hiding:** dado `H(x)`, es inviable determinar `x`.
3. **Propiedad de avalancha:** un cambio mínimo en la entrada produce una salida completamente distinta.

Este proyecto usa `keccak256`, la función hash nativa de Ethereum. Al cambiar un solo byte del documento, el hash resultante es completamente diferente — esto es lo que hace imposible la falsificación sin ser detectado.

### Smart contracts y la EVM

Un contrato inteligente es código desplegado en la blockchain de Ethereum que se ejecuta de forma determinista en la Ethereum Virtual Machine (EVM). A diferencia de una base de datos convencional:
- El código y el estado son inmutables una vez desplegados.
- La ejecución está garantizada por el consenso de la red, sin intermediarios.
- Cada llamada queda registrada permanentemente en la blockchain.

### Ethereum y Sepolia

Sepolia es la testnet oficial de Ethereum para pruebas de contratos. Funciona con el mismo protocolo que la red principal pero usa ETH de prueba sin valor real, lo que permite desarrollar y verificar contratos sin costo.

### Wallets y EOAs

Una *Externally Owned Account* (EOA) es una cuenta de Ethereum controlada por una clave privada (firma digital). Toda transacción debe ser firmada por una EOA. En este proyecto, la wallet del emisor firma cada registro, dejando constancia criptográfica irrefutable de quién registró el documento y cuándo.

---

## 5. Desarrollo

### 5.1 Arquitectura del sistema

```
┌──────────────────────────────────────────────────────────────┐
│                        CAPA OFF-CHAIN                         │
│                                                              │
│  [Documento Real]  ──►  keccak256(bytes archivo)  =  bytes32 │
│  (PDF, imagen, DOCX…)         hash del documento             │
└──────────────────────────────┬───────────────────────────────┘
                               │  Solo el hash (32 bytes) viaja on-chain
                               ▼
┌──────────────────────────────────────────────────────────────┐
│               SMART CONTRACT — Sepolia                        │
│               RegistroDocumentos.sol                         │
│                                                              │
│  mapping(bytes32 => Documento)  ←  almacenamiento O(1)       │
│  registrar(hash, titular, tipo) ←  escritura (solo Emisores) │
│  verificar(hash)                ←  lectura + evento on-chain  │
│  consultar(hash)                ←  lectura gratuita (view)   │
│  revocarDocumento(hash)         ←  invalidación              │
└──────────────────────────────┬───────────────────────────────┘
                               │
          ┌────────────────────┴──────────────────┐
          ▼                                        ▼
┌─────────────────────┐               ┌────────────────────────┐
│   demo/ (CLI)       │               │  frontend/ (dApp web)  │
│   Node.js + ethers  │               │  React + Vite + ethers │
│   Para operadores   │               │  Para usuarios finales │
└─────────────────────┘               └────────────────────────┘
```

### 5.2 Roles del sistema

El contrato implementa tres roles con distintos niveles de acceso:

| Rol | Cómo se obtiene | Permisos |
|---|---|---|
| **Admin** | Es quien despliega el contrato | Autorizar/revocar Emisores, transferir el rol de Admin |
| **Emisor** | Autorizado por el Admin | Registrar documentos, revocar documentos propios |
| **Verificador** | Cualquier dirección | Consultar y verificar documentos (gratis, sin permiso) |

El Admin modela a la institución que opera el sistema (ej: Ministerio de Educación). Los Emisores modelan a entidades emisoras legítimas (universidades, notarías). Cualquier persona puede verificar sin necesitar cuenta.

### 5.3 Estructura del documento on-chain

Al registrar un documento, el contrato almacena:

```solidity
struct Documento {
    address emisor;        // quien registró el documento (EOA autorizada)
    address titular;       // a quién pertenece el documento
    uint64  timestamp;     // momento exacto del registro (block.timestamp)
    TipoDocumento tipo;    // categoría: Genérico, Título, Certificado, Contrato, Identidad
    bool    existe;        // flag para distinguir "no registrado" de "valores en cero"
    bool    revocado;      // true si el documento fue invalidado
}
```

**Lo que NO se almacena:** el archivo original, su nombre, su contenido. Solo el hash de 32 bytes. El documento real permanece bajo el control de su dueño.

### 5.4 Flujo de registro

1. El Emisor tiene el archivo original (PDF, imagen, etc.).
2. Calcula el hash off-chain: `keccak256(bytes_del_archivo)`.
3. Llama a `registrar(hashDoc, titular, tipo)` firmando con su wallet.
4. El contrato verifica que el Emisor está autorizado y que el hash no existe previamente.
5. Almacena el struct `Documento` y emite el evento `DocumentoRegistrado`.

### 5.5 Flujo de verificación

1. El Verificador recibe el archivo a autenticar (puede ser cualquier persona).
2. Calcula el hash del archivo con la misma función (`keccak256`).
3. Llama a `consultar(hashDoc)` (gratis, sin wallet) o `verificar(hashDoc)` (deja traza on-chain).
4. Si el hash está en el contrato y no fue revocado → documento auténtico.
5. Si no está → el documento no fue emitido por este sistema, o fue alterado.

### 5.6 Flujo de revocación

Un Emisor puede invalidar un documento que él mismo registró (ej: título revocado, contrato anulado). El Admin puede revocar cualquier documento. El registro histórico se conserva (`existe = true`), pero el documento deja de reportarse como válido (`revocado = true`). Esto permite distinguir tres estados: *válido*, *revocado* y *nunca registrado*.

### 5.7 Decisiones de diseño

**¿Por qué solo el hash y no el documento completo?**
Subir archivos a Ethereum es inviable: cuesta miles de dólares en gas y expone información privada en una red pública. El hash de 32 bytes es suficiente como prueba de existencia e integridad: si el archivo cambia un solo byte, su hash cambia completamente (propiedad de avalancha).

**¿Por qué `bytes32` como clave del mapping?**
`keccak256` retorna 32 bytes nativamente. Usar `bytes32` como clave ocupa un solo storage slot, hace el lookup O(1) y es más eficiente en gas que usar `string` o `uint`.

**¿Por qué el flag `existe` en el struct?**
Solidity devuelve un struct vacío (todos ceros) para claves no existentes. Sin el flag `existe`, sería imposible distinguir "no registrado" de "registrado con valores en cero". El flag resuelve esa ambigüedad.

**¿Por qué `uint64` para el timestamp?**
`uint64` cubre timestamps hasta el año 584 mil millones — más que suficiente. Al ser más pequeño que `uint256`, se empaqueta junto con otros campos del struct en un mismo storage slot de 32 bytes, reduciendo el costo de `SSTORE`.

**¿Por qué custom errors en vez de `require("mensaje")`?**
Desde Solidity 0.8.4, los custom errors (`revert NoAutorizado()`) consumen menos gas que strings en `require`. Además permiten usar `vm.expectRevert(Contrato.Error.selector)` en tests, lo que es más preciso y legible.

**¿Por qué dos funciones de consulta (`verificar` y `consultar`)?**
- `verificar()`: no es `view`; emite el evento `DocumentoVerificado`. Útil cuando se quiere dejar traza on-chain de quién verificó qué (ej: un banco que valida un título queda registrado en la blockchain).
- `consultar()`: es `view`; no gasta gas ni emite evento. Ideal para frontends que necesitan mostrar el estado sin crear transacciones.

---

## 6. Interfaz Pública del Contrato

| Función | Tipo | Acceso | Descripción |
|---|---|---|---|
| `registrar(bytes32, address, TipoDocumento)` | transaction | Solo Emisores | Registra el hash de un documento |
| `revocarDocumento(bytes32)` | transaction | Emisor original o Admin | Invalida un documento registrado |
| `verificar(bytes32)` | transaction | Cualquiera | Verifica y emite evento on-chain |
| `consultar(bytes32)` | view (gratis) | Cualquiera | Consulta sin emitir evento |
| `autorizarEmisor(address)` | transaction | Solo Admin | Agrega un Emisor autorizado |
| `revocarEmisor(address)` | transaction | Solo Admin | Revoca un Emisor |
| `transferirAdmin(address)` | transaction | Solo Admin | Transfiere el control del contrato |
| `emisoresAutorizados(address)` | view | Cualquiera | Consulta si una dirección es Emisor |
| `admin()` | view | Cualquiera | Retorna la dirección del Admin actual |

### Eventos emitidos

| Evento | Cuándo se emite |
|---|---|
| `DocumentoRegistrado(hashDoc, emisor, titular, tipo, timestamp)` | Al registrar exitosamente |
| `DocumentoVerificado(hashDoc, verificador, valido)` | Al llamar a `verificar()` |
| `DocumentoRevocado(hashDoc, por)` | Al revocar un documento |
| `EmisorAutorizado(emisor, por)` | Al autorizar un nuevo Emisor |
| `EmisorRevocado(emisor, por)` | Al revocar un Emisor |
| `AdminTransferido(anterior, nuevo)` | Al transferir el rol de Admin |

---

## 7. Testing

El proyecto incluye 21 tests escritos con **Forge** (Foundry), organizados en:

### Tests unitarios

| Test | Qué verifica |
|---|---|
| `test_AdminPuedeAutorizarEmisor` | Control de acceso — rol Admin |
| `test_NoAdminNoPuedeAutorizar` | Rechazo de no-Admin |
| `test_AdminPuedeRevocarEmisor` | Revocación de Emisor |
| `test_NoSePuedeAutorizarDireccionCero` | Validación de dirección cero |
| `test_RegistrarEmiteEventoYGuardaDocumento` | Flujo completo de registro |
| `test_NoEmisorNoPuedeRegistrar` | Rechazo de no-Emisor |
| `test_NoSePuedeRegistrarHashCero` | Validación de hash inválido |
| `test_NoSePuedeRegistrarDosVecesElMismoHash` | Anti-doble-registro |
| `test_VerificarDocumentoValido` | Verificación exitosa con evento |
| `test_VerificarDocumentoInexistente` | Verificación de hash no registrado |
| `test_EmisorPuedeRevocarSuDocumento` | Revocación por Emisor original |
| `test_AdminPuedeRevocarCualquierDocumento` | Revocación por Admin |
| `test_ExtranioNoPuedeRevocarDocumento` | Protección de revocación |
| `test_NoSePuedeRevocarDocumentoInexistente` | Error en revocación inválida |
| `test_NoSePuedeRevocarDosVeces` | Anti-doble-revocación |
| `test_VerificarDocumentoRevocadoDevuelveInvalido` | Estado post-revocación |
| `test_AdminPuedeTransferirAdmin` | Transferencia de Admin |
| `test_NoAdminNoPuedeTransferirAdmin` | Protección de transferencia |
| `test_NoSePuedeTransferirAdminADireccionCero` | Validación en transferencia |

### Tests de fuzzing

| Test | Tipo | Qué verifica |
|---|---|---|
| `testFuzz_RegistrarHashesAleatorios` | Fuzz (256 runs) | Invariante: cualquier hash válido se puede registrar |
| `testFuzz_RegistrarYRevocar` | Fuzz (256 runs) | Invariante: registrar+revocar siempre deja `existe=true, revocado=true` |

**Resultado: 21/21 tests pasando.**

---

## 8. Despliegue y Demo

### Contrato desplegado

- **Red:** Ethereum Sepolia (testnet)
- **Dirección:** `0x237b7111Be8436Ba3c74826C3C2DA6B3b2309cE1`
- **Etherscan:** https://sepolia.etherscan.io/address/0x237b7111Be8436Ba3c74826C3C2DA6B3b2309cE1

### CLI de demostración

```bash
cd demo && npm install && cp .env.example .env
# Editar .env con SEPOLIA_RPC_URL y PRIVATE_KEY

node demo.js info                                             # Estado del contrato
node demo.js registrar archivo.pdf 0xTitular Titulo          # Registrar
node demo.js consultar archivo.pdf                           # Verificar (gratis)
node demo.js revocar-doc archivo.pdf                         # Revocar
```

### Frontend web

dApp desplegable en Vercel/Netlify con dashboard diferenciado por rol:
- **Verificador (público):** arrastra un archivo, su hash se calcula en el navegador, y se consulta el contrato. Sin wallet necesaria.
- **Emisor:** panel para registrar (con titular y tipo) y revocar documentos propios.
- **Admin:** panel para autorizar/revocar Emisores y transferir el control del contrato.

```bash
cd frontend && npm install && cp .env.example .env
# VITE_CONTRACT_ADDRESS=0x237b7111Be8436Ba3c74826C3C2DA6B3b2309cE1
npm run dev    # http://localhost:5173
```

---

## 9. Análisis Crítico

### Ventajas del sistema

- **Inmutabilidad garantizada por la red:** ningún actor, incluido el administrador del sistema, puede alterar un registro histórico. Esto es matemáticamente imposible sin controlar la mayoría del poder computacional de la red.
- **Verificación pública y sin permiso:** cualquier persona, en cualquier lugar, puede verificar un documento presentando el archivo y consultando la blockchain.
- **Privacidad del contenido:** el documento real nunca sale del control de su dueño. Solo el hash de 32 bytes se almacena on-chain.
- **Trazabilidad completa:** cada registro, verificación y revocación queda como evento indexado, auditable para siempre.
- **Eficiencia en gas:** el uso de `bytes32`, `uint64` y custom errors optimiza el costo de cada operación.

### Limitaciones

- **Centralización del Admin:** un único admin controla quién puede emitir. Si la clave privada del admin se pierde o se compromete, el sistema queda bloqueado o en manos de un atacante.
- **Sin confirmación del titular:** el titular del documento no firma ni confirma haber recibido el documento. Un Emisor malicioso podría registrar documentos con un titular falso.
- **Opacidad del hash:** si el contenido de un documento es predecible (ej: un formulario estándar), un atacante podría calcular el hash esperado y verificar su existencia antes de que sea público.

### Riesgos de seguridad

- **Front-running del hash:** cuando un Emisor envía la transacción de registro, el hash es visible en el *mempool* antes de ser confirmado. Un atacante podría intentar registrarlo primero. Mitigación posible: comprometer el hash con un *salt* secreto y revelarlo luego (esquema de commit-reveal).
- **Pérdida del rol de Admin:** si el Admin pierde acceso a su clave privada, nadie puede autorizar nuevos Emisores. En producción se mitigaría con un contrato multisig (`Gnosis Safe`) o `AccessControl` de OpenZeppelin, que requiere múltiples firmas para operaciones críticas.
- **Dependencia de la testnet:** Sepolia es una red de pruebas. Para un sistema de producción se requeriría desplegar en la mainnet de Ethereum u otra red con garantías de permanencia (ej: Polygon, Base).

### Costos y escalabilidad

Cada registro cuesta aproximadamente 72.000 gas. Con un precio de gas de 2 gwei en Sepolia y un ETH a USD 3.000, cada registro costaría ~USD 0,43. Para un sistema de escala nacional (millones de documentos) esto es viable, pero requiere considerar períodos de alta congestión donde el gas sube significativamente. Una alternativa es usar una red L2 (como Arbitrum u Optimism) que mantiene las garantías de seguridad de Ethereum con costos 10–100× menores.

### Trabajo futuro

- **Firmas del titular (EIP-712):** el titular podría firmar un mensaje off-chain confirmando la recepción del documento, añadiendo una segunda capa de verificación.
- **Múltiples contratos de registro por dominio:** universidades, notarías y entidades de salud tendrían instancias separadas con sus propios Admins, reduciendo la superficie de ataque.
- **Indexación con The Graph:** un subgrafo permitiría consultar el historial completo de un titular de forma eficiente, sin depender de `queryFilter` en el cliente.
- **Contrato multisig para el Admin:** reemplazar la EOA simple por un `Gnosis Safe` que requiera N-de-M firmas para operaciones de administración.

---

## 10. Conclusiones

Este proyecto demuestra cómo la blockchain de Ethereum puede resolver un problema real — la verificación de autenticidad de documentos — de forma descentralizada, pública e inmutable. Los conceptos criptográficos fundamentales del curso (funciones hash, propiedades de avalancha y resistencia a colisiones, firmas digitales, EOAs) son el núcleo de la solución: el hash `keccak256` es la prueba de integridad, y la firma de cada transacción es la prueba de autoría.

El sistema implementado va más allá de un registro simple: incluye revocación de documentos con preservación del historial, control de acceso por roles, transferencia de administración y una interfaz de usuario completa. La suite de 21 tests — incluyendo pruebas de fuzzing con 256 iteraciones aleatorias — valida que las invariantes del sistema se mantienen bajo cualquier entrada.

Las principales limitaciones identificadas (centralización del Admin, ausencia de confirmación del titular, riesgo de front-running) son inherentes a la arquitectura mínima elegida y tienen soluciones conocidas (multisig, EIP-712, commit-reveal) que representan extensiones naturales para una versión de producción.

---

## 11. Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|---|---|---|
| Solidity | 0.8.24 | Lenguaje del smart contract |
| Foundry (forge, cast) | 1.7.1 | Compilación, testing, deploy, interacción |
| Ethereum Sepolia | — | Red de pruebas pública |
| keccak256 | — | Función de hash para documentos |
| Node.js + ethers.js | v6.13.2 | CLI de demostración |
| React + Vite | 18 / 5 | Frontend web |
| Tailwind CSS | 3 | Estilos del frontend |
| GitHub Actions | — | CI (build + tests automáticos) |
| macOS + WSL2/Ubuntu | — | Entorno de desarrollo |

---

## 12. Uso de Inteligencia Artificial Generativa

Durante el desarrollo de este proyecto se utilizaron herramientas de IA generativa como asistencia. A continuación se declara de forma transparente su uso:

| Herramienta | Uso |
|---|---|
| Claude (Anthropic) | Asistencia en el desarrollo del frontend React, revisión de decisiones de diseño del contrato, y revisión del informe |

**Partes generadas o asistidas:**
- El frontend (`frontend/src/`) fue desarrollado con asistencia significativa de Claude, incluyendo la arquitectura de componentes, los hooks de React y la integración con ethers v6.
- Las decisiones de diseño del contrato (sección 5.7) fueron escritas con asistencia de IA a partir de las decisiones tomadas por el equipo.
- El equipo revisó, validó y ajustó todo el código y texto generado.

**Partes de autoría propia:**
- El diseño del contrato `RegistroDocumentos.sol` y sus invariantes.
- Los tests de Forge.
- Las decisiones arquitectónicas del sistema (roles, estructura del struct, separación verificar/consultar).
- El análisis crítico y las conclusiones.

---

## 13. Referencias

- Nakamoto, S. (2008). *Bitcoin: A Peer-to-Peer Electronic Cash System*. https://bitcoin.org/bitcoin.pdf
- Buterin, V. (2014). *Ethereum: A Next-Generation Smart Contract and Decentralized Application Platform*. https://ethereum.org/en/whitepaper/
- Solidity Documentation (v0.8.24). https://docs.soliditylang.org/en/v0.8.24/
- Foundry Book. https://book.getfoundry.sh/
- ethers.js v6 Documentation. https://docs.ethers.org/v6/
- OpenZeppelin Contracts. https://docs.openzeppelin.com/contracts/
- Ethereum Improvement Proposals — EIP-712 (Typed structured data hashing). https://eips.ethereum.org/EIPS/eip-712
