# Decisiones Técnicas — Validador de Certificados UAI
## Por qué elegimos cada tecnología y por qué no las alternativas

Grupo 8 — Los Callampines · TICS0870

---

Este documento explica en lenguaje simple cada decisión técnica del proyecto:
qué usamos, cómo funciona, y por qué lo elegimos por sobre las alternativas
que aparecen en el material del curso u otras opciones conocidas.

---

## 1. Función de hash: `keccak256` en vez de SHA-256

### Qué es y cómo lo usamos

Una función hash transforma un archivo de cualquier tamaño en una "huella digital"
de tamaño fijo (32 bytes). En este proyecto, cuando el Registro Académico quiere
certificar un PDF, calcula `keccak256(bytes_del_PDF)` y guarda ese resultado de 32
bytes en la blockchain. El PDF nunca se sube — solo su huella.

Cuando un empleador quiere verificar el certificado, arrastra el mismo PDF,
calculamos su `keccak256` en el navegador y comparamos con el registro on-chain.
Si coincide → auténtico. Si alguien alteró aunque sea una coma del documento →
el hash es completamente distinto.

### Propiedades que usamos (vistas en Clase 1 y 2)

- **Resistencia a colisiones:** imposible encontrar dos PDFs distintos con el mismo hash.
- **Hiding:** dado el hash, no se puede reconstruir el PDF original.
- **Propiedad de avalancha:** cambiar un solo byte en el PDF produce un hash completamente distinto. Esta es la propiedad clave para detectar falsificaciones.

### Por qué `keccak256` y no SHA-256

**SHA-256** es la función del curso (Clase 2): es la que usa Bitcoin para minar bloques y
construir los árboles de Merkle. Es perfectamente segura y habríamos podido usarla.

Sin embargo elegimos **`keccak256`** por una razón práctica concreta: es la función
hash **nativa de la EVM** (Ethereum Virtual Machine). Solidity tiene el opcode
`keccak256()` integrado, y ethers.js tiene `ethers.keccak256()`. Usar `keccak256`
significa:

1. El cálculo en el contrato Solidity usa el opcode más barato en gas.
2. El cálculo en el frontend (JavaScript) y en la CLI (Node.js) usa la misma función
   que Ethereum usa internamente, sin necesidad de librerías externas.
3. Los hashes que genera el usuario son directamente comparables con los almacenados
   on-chain sin conversión.

Si hubiéramos usado SHA-256, habríamos necesitado una librería extra en el frontend y
el contrato habría necesitado invocar un *precompile* más costoso. Técnicamente igual
de seguro, pero más complicado sin ningún beneficio para este caso de uso.

---

## 2. Blockchain: Ethereum en vez de Bitcoin u otras cadenas

### Por qué no Bitcoin (visto en Clases 1–4)

Bitcoin (Clases 1–4) es el primer sistema blockchain y fue el punto de partida del
curso. Pero Bitcoin es una blockchain diseñada para **transferir valor** (BTC), no
para ejecutar lógica arbitraria. No tiene un lenguaje de programación general ni
soporte nativo para "contratos" que registren hashes de documentos y controlen roles
de acceso. Técnicamente se puede poner datos en Bitcoin (con `OP_RETURN`), pero es
un hack limitado: no puedes implementar un mapping, roles, revocación, ni eventos.

### Por qué Ethereum (visto en Clases 5–9)

Ethereum (Clase 5) es una "máquina de estados" programable. Cada nodo de la red
ejecuta la misma EVM (Ethereum Virtual Machine), que puede correr cualquier lógica
expresada en bytecode. Eso es lo que llamamos un **smart contract**: código que vive
en la blockchain, con su propio almacenamiento, que cualquiera puede llamar y que
nadie puede modificar una vez desplegado.

Para certificar documentos necesitamos exactamente eso:
- Un mapping `hash → documento` que guarde los datos.
- Funciones `registrar`, `verificar`, `revocar` con lógica de control de acceso.
- Eventos indexados para trazabilidad.

Todo eso es imposible en Bitcoin y nativo en Ethereum.

### Por qué Sepolia y no la mainnet

Sepolia es la **testnet oficial de Ethereum** (mencionada en Clase 9 como red de
pruebas para el taller). Funciona con el mismo protocolo que la red principal, pero
usa ETH de prueba sin valor real. Para un prototipo académico, pagar ~USD 0.43 por
cada registro en la mainnet sería innecesario. En Sepolia obtenemos el mismo
comportamiento sin costo.

### Por qué no otras cadenas (Polygon, Solana, etc.)

Polygon, Base, Arbitrum y otras son redes L2 o sidechains que no aparecen en el
temario del curso. Son alternativas válidas en producción (Clase 9 las menciona como
dirección de trabajo futuro para bajar costos de gas), pero usar Sepolia nos permite
trabajar directamente sobre el protocolo Ethereum tal como fue enseñado, sin
introducir complejidad adicional.

---

## 3. Mecanismo de consenso: Proof of Stake (no Proof of Work)

### Lo que vimos en clase

La Clase 4 dedicó tiempo significativo a **Proof of Work (PoW)**: el mecanismo de
consenso original de Bitcoin donde los mineros compiten resolviendo puzzles
computacionales costosos para proponer el siguiente bloque. Es el mecanismo que da
seguridad a Bitcoin.

### Qué usa Ethereum hoy

Ethereum usó PoW hasta 2022 ("The Merge"). Hoy usa **Proof of Stake (PoS)** (Clase 5):
en vez de gastar electricidad minando, los validadores depositan ETH como garantía
("stake") y se les elige aleatoriamente para proponer bloques. Si actúan de mala fe,
pierden su stake.

### Por qué no nos afecta directamente

Este cambio es transparente para nosotros como desarrolladores de aplicaciones: el
mecanismo de consenso está debajo de la capa de contratos. Lo que nos importa es que
las transacciones se confirman y los registros son inmutables — eso lo garantiza PoS
igual que PoW. La diferencia relevante es que PoS consume ~99.95% menos electricidad
y tiene tiempos de bloque más predecibles (~12 segundos en Sepolia).

---

## 4. Modelo de cuentas: EOA vs contrato (visto en Clases 6 y 8)

### Dos tipos de cuentas en Ethereum (Clase 8)

Ethereum tiene dos tipos de cuentas:

- **EOA (Externally Owned Account):** controlada por una clave privada. Es lo que
  tiene cada usuario con MetaMask. Para actuar, firma una transacción con su clave.
- **Contrato:** código desplegado en una dirección. No tiene clave privada; solo puede
  actuar cuando alguien lo llama.

### Cómo lo usamos

En nuestro sistema:
- **Admin** → EOA (wallet de TI UAI, controlada por su clave privada).
- **Emisores** → EOAs (wallets del Registro Académico).
- **Verificadores** → pueden ser EOAs (si dejan traza) o simplemente leer con un RPC
  público (sin cuenta ni wallet).
- **`RegistroDocumentos.sol`** → el contrato que almacena los datos.

Toda escritura (registrar, revocar, autorizar) es iniciada por una EOA que firma la
transacción. El contrato no puede actuar solo.

### Por qué EOAs para los roles y no contratos multisig

En un sistema de producción, el Admin y el Emisor deberían ser contratos multisig
(ej: Gnosis Safe, que requiere N-de-M firmas). Pero para el prototipo, las EOAs son
suficientes y más simples de demostrar. Lo importante es que la arquitectura lo
permite: basta cambiar la dirección del Admin/Emisor a un contrato multisig sin
modificar el contrato principal.

---

## 5. Solidity: el lenguaje del contrato (visto en Clases 8 y 9)

### Por qué Solidity

Solidity es el lenguaje más usado para escribir smart contracts en Ethereum y es el
que se enseñó en Clases 8 y 9. Tiene tipado estático, soporte nativo para `mapping`,
`struct`, `event`, `modifier` y `error` — exactamente las herramientas que necesitamos.

Las alternativas principales son **Vyper** (sintaxis tipo Python, más restrictivo) y
**Huff** (lenguaje de bajo nivel, casi ensamblador). Vyper favorece la legibilidad
y evita ciertos errores comunes, pero tiene un ecosistema más pequeño y no fue cubierto
en el curso. Huff está pensado para optimización extrema de gas, innecesaria para este
proyecto. Solidity es la opción natural dada la enseñanza del curso.

### Decisiones específicas dentro de Solidity

**`mapping(bytes32 => Documento)` en vez de array**

La Clase 9 enseñó mappings. Usamos `mapping` porque nos da acceso O(1): dado un hash,
encontrar el documento es instantáneo sin importar cuántos haya registrados. Un array
requeriría iterar — O(n) — lo que en blockchain es caro y lento.

**`struct Documento` para empacar datos**

Agrupar `emisor`, `titular`, `timestamp`, `tipo`, `existe`, `revocado` en un struct
permite leerlos todos en una sola llamada y facilita el empaquetado eficiente en
storage slots de 32 bytes.

**`uint64` para el timestamp en vez de `uint256`**

`uint256` es el tipo por defecto en Solidity y el más común. Sin embargo `uint64` cubre
timestamps hasta el año 584 mil millones, más que suficiente, y ocupa solo 8 bytes.
Al combinarlo con otros campos del struct en el mismo storage slot de 32 bytes, reduce
el número de operaciones `SSTORE` y por tanto el costo en gas.

**Custom errors (`revert NoAutorizado()`) en vez de `require("string")`**

La Clase 8 mostró `require` con string como la forma básica de validar condiciones.
Los **custom errors** (disponibles desde Solidity 0.8.4) hacen lo mismo pero con menos
gas: no almacenan el string en el bytecode. También permiten usar `vm.expectRevert`
con el selector específico del error en los tests de Forge, lo que hace las pruebas
más precisas.

**`modifier` para control de acceso**

La Clase 8 enseñó modifiers. Usamos `modifier soloAdmin()` y `modifier soloEmisor()`
para centralizar la verificación de roles en un solo lugar. Alternativa habría sido
repetir el `if` en cada función — funciona igual pero viola DRY y hace el código más
difícil de mantener.

**`event` indexado para trazabilidad**

La Clase 9 enseñó eventos. Emitimos eventos en cada operación importante
(`DocumentoRegistrado`, `DocumentoVerificado`, `DocumentoRevocado`). Los campos
`indexed` permiten filtrar por hash de documento, emisor o titular en el historial
de la blockchain sin leer todos los eventos.

**Dos funciones de consulta: `verificar()` y `consultar()`**

`consultar()` es `view` — no crea transacción, no gasta gas, gratis para cualquiera.
`verificar()` no es `view` — emite un evento que registra on-chain quién verificó y
cuándo. La distinción `view` vs transacción fue enseñada en Clase 8. Esta separación
permite que el verificador típico (empleador) consulte gratis, mientras que un proceso
formal de auditoría puede usar `verificar()` para dejar evidencia permanente.

**Lo que conscientemente NO usamos del temario de Clase 9**

La Clase 9 dedicó tiempo significativo a:
- **`payable`, `msg.value`, `transfer/send/call`:** el contrato no mueve fondos. Un
  registro de certificados no necesita cobrar ETH para funcionar; añadir un fee
  agregaría complejidad sin beneficio conceptual para el caso de uso.
- **`try/catch`:** no llamamos a contratos externos, así que no hay excepciones que
  capturar en Solidity. (El `try/catch` en la CLI es JavaScript, no Solidity.)
- **Interfaces entre contratos:** no llamamos a ningún otro contrato on-chain. La
  interacción siempre es EOA → nuestro contrato, nunca contrato → contrato.

Estas omisiones son justificables: el contrato resuelve el problema sin necesitarlas.

---

## 6. Foundry: compilar, testear y desplegar (visto en Clase 9)

### Por qué Foundry y no Hardhat o Truffle

La Clase 9 presentó **Foundry** como el framework de desarrollo para el taller
práctico. Es la herramienta más moderna del ecosistema Ethereum:

- **`forge`:** compilar y testear. Los tests se escriben en Solidity (no JavaScript),
  lo que significa que el mismo lenguaje que el contrato se usa para las pruebas —
  menos contexto mental que cambiar.
- **`cast`:** interactuar con contratos desde la terminal. Útil para verificar el
  estado del contrato sin abrir el frontend.

**Hardhat** (Node.js) y **Truffle** (hoy descontinuado) son alternativas populares,
pero no fueron el foco del curso. Foundry es más rápido, sus tests en Solidity son más
naturales para el trabajo con contratos, y tiene soporte nativo de **fuzzing**.

### Fuzzing (no cubierto en clase, agregado como bonus)

Los tests de fuzzing (`testFuzz_*`) generan entradas aleatorias automáticamente para
verificar invariantes del sistema. En 256 iteraciones prueban que:
1. Cualquier hash válido (≠ 0) puede ser registrado exitosamente.
2. Registrar + revocar siempre resulta en `existe=true, revocado=true`.

Esto va más allá de los tests unitarios del curso y detecta casos borde que un
programador podría no haber pensado manualmente.

---

## 7. ethers.js v6: la librería de conexión (visto en Clase 9)

### Qué es

ethers.js es la librería JavaScript para conectarse a nodos Ethereum y llamar a
contratos. La Clase 9 la usó en el taller de interacción con contratos.

### v6 en vez de v5

La versión 6 es la actual y usa `bigint` nativo de JavaScript en vez de la clase
`BigNumber` de v5, lo que simplifica las operaciones aritméticas con números grandes
de Ethereum.

### Provider de solo lectura (sin MetaMask)

ethers.js permite crear un `JsonRpcProvider` con una URL RPC pública (Alchemy,
PublicNode, Infura) para leer la blockchain sin que el usuario tenga wallet. Esto es
clave para que un empleador pueda verificar certificados **sin instalar nada ni tener
cuenta**. Para escribir (registrar, revocar), sí se necesita un `BrowserProvider`
que use MetaMask para firmar.

---

## 8. MetaMask: firma de transacciones desde el navegador (visto en Clases 6 y 9)

### Qué hace MetaMask

MetaMask es una extensión del navegador que guarda la clave privada del usuario de
forma segura y la usa para firmar transacciones cuando el usuario lo aprueba. En el
contexto de Ethereum (Clases 6 y 7), toda transacción debe ser firmada por una EOA —
MetaMask es el puente entre el usuario y esa firma.

### Por qué lo necesita el Emisor y el Admin (no el Verificador)

- **Verificador:** solo lee la blockchain. No firma nada. Un `JsonRpcProvider` público
  basta — sin MetaMask.
- **Emisor/Admin:** crean transacciones que modifican el estado del contrato. Eso
  requiere una firma de EOA → MetaMask firma en nombre del usuario.

Esta distinción entre **leer gratis** y **escribir con firma** es la misma que el
curso establece en Clases 6–8: las llamadas `view` no cuestan gas ni requieren firma;
las transacciones sí.

### Alternativas

Una alternativa sería tener un backend nuestro con la clave privada del Emisor y que
el frontend llame a nuestro servidor, que a su vez firme y envíe la transacción.
Funciona, pero introduce un servidor centralizado que puede ser comprometido, caído o
manipulado. Con MetaMask, la clave privada nunca sale del dispositivo del usuario.

---

## 9. React + Vite + Tailwind: el frontend (no cubierto en clase)

### Por qué React

React no está en el temario del curso — el frontend es una adición al proyecto para
hacerlo demostrable a personas sin conocimiento técnico. Elegimos React + Vite porque
es el stack moderno más estándar para aplicaciones web interactivas:

- **React:** componentes reutilizables, estado reactivo. Nos permite tener el mismo
  componente `FileDropzone` en la vista de Verificador y en la de Emisor.
- **Vite:** build tool rápido. Soporta variables de entorno `VITE_*` para configurar
  la dirección del contrato sin hardcodearla.
- **TypeScript:** tipado estático que detecta errores en tiempo de compilación. Por
  ejemplo, nos avisó cuando pasábamos un `File` donde esperábamos un `string`.
- **Tailwind CSS:** utilidades de CSS en línea que permiten diseñar sin escribir
  archivos CSS separados.

### Por qué un frontend y no solo la CLI

La CLI (Node.js) es ideal para desarrolladores, pero para demostrar el caso de uso UAI
necesitamos que un empleador sin conocimiento técnico pueda:
1. Arrastrar un PDF.
2. Ver "✅ CERTIFICADO AUTÉNTICO" o "❌ NO REGISTRADO".

Eso requiere una interfaz gráfica. La CLI cumple la función de demo técnica; el
frontend cumple la función de producto usable.

---

## 10. keccak256 calculado en el navegador (off-chain)

### El principio fundamental del diseño

El archivo **nunca sale del navegador**. El hash se calcula con `SubtleCrypto` (API
nativa del navegador) o con `ethers.keccak256()` sobre los bytes crudos del archivo,
antes de cualquier llamada a la red. Solo el hash de 32 bytes va al contrato.

### Por qué es importante

1. **Privacidad:** un certificado de alumno regular puede contener RUT, nombre
   completo, dirección. Si subiéramos el PDF a algún servidor, ese servidor vería
   información sensible. Al calcular el hash localmente, nadie ve el contenido.
2. **Costo:** subir archivos a Ethereum costaría miles de dólares en gas. Un hash de
   32 bytes cuesta fracciones de centavo.
3. **Mismo resultado:** cualquier persona que tenga el mismo PDF calculará el mismo
   hash. La verificación es reproducible por cualquiera con el archivo.

---

## 11. Árbol de Merkle: por qué NO lo usamos (visto en Clase 2)

La Clase 2 dedicó tiempo al **árbol de Merkle**: una estructura donde los hashes de
múltiples transacciones (o documentos) se combinan en pares repetidamente hasta llegar
a un único **Merkle root**. Bitcoin lo usa para comprimir todas las transacciones de
un bloque en un solo hash de 32 bytes en la cabecera del bloque.

**¿Por qué no lo usamos?**

El árbol de Merkle es útil cuando quieres probar que un elemento está en un conjunto
sin revelar el conjunto completo (Merkle proof). En nuestro caso, cada certificado
es verificado individualmente por su propio hash — no hay necesidad de agruparlos en
una estructura de árbol. Si la UAI quisiera publicar un "lote" de 10.000 diplomas de
una ceremonia en una sola transacción con pruebas individuales, un Merkle tree sería
la solución natural. Para el prototipo, el diseño 1-hash-1-registro es más simple y
suficiente.

---

## 12. Proof of Work vs Proof of Stake: por qué no nos importa elegir (Clase 4)

La Clase 4 explicó en detalle cómo funciona el **Proof of Work** de Bitcoin: los
mineros buscan un nonce tal que `hash(bloque + nonce) < target`. Es costoso
computacionalmente a propósito, para que alterar la cadena requiera más poder que
toda la red honesta.

Para nuestro proyecto, esto es una capa de infraestructura que **no controlamos ni
elegimos**: Ethereum Sepolia usa Proof of Stake y no tenemos opción de cambiar eso.
Lo relevante para nosotros es que tanto PoW como PoS garantizan la inmutabilidad de
los registros una vez confirmados — que es lo que necesitamos para que los
certificados on-chain no puedan ser alterados.

---

## 13. UTXO vs Account Model: por qué Ethereum usa cuentas (Clase 5)

La Clase 3 y 5 comparan los dos modelos de estado:

- **UTXO (Unspent Transaction Output):** el modelo de Bitcoin. No hay "saldo" como
  tal; solo outputs no gastados. Cada transacción consume outputs y crea nuevos.
- **Account Model:** el modelo de Ethereum. Cada dirección tiene un saldo y un
  estado. Los contratos tienen su propio almacenamiento persistente.

Para registrar documentos, necesitamos **almacenamiento persistente** asociado a
una dirección (el contrato) — eso es natural en el Account Model. En el modelo UTXO
de Bitcoin, no existe el concepto de "este mapping de hashes a documentos vive en
esta dirección". Otra razón más por la que Ethereum es la elección correcta para
este proyecto.

---

## 14. Resumen: qué usamos de cada clase

| Clase | Tema | Cómo aparece en el proyecto |
|---|---|---|
| 1 | Fundamentos criptográficos, propiedades de hash | `keccak256` como prueba de integridad; propiedad de avalancha para detectar falsificaciones |
| 2 | SHA-256, árboles de Merkle, hash pointers | `keccak256` en vez de SHA-256 (nativo de EVM); árbol de Merkle descartado por diseño 1:1 |
| 3 | Firmas digitales, llaves pública/privada, EOAs | Toda transacción firmada por EOA (Emisor, Admin); verificación sin firma (Verificador) |
| 4 | Proof of Work, consenso, Bitcoin | Ethereum usa PoS (transparente para nosotros); entendemos la inmutabilidad que garantiza |
| 5 | Ethereum, EVM, Account Model, Proof of Stake | El contrato vive en la EVM; Account Model permite mapping y almacenamiento persistente |
| 6 | Wallets, MetaMask, unidades de ETH, EOAs | MetaMask firma las transacciones del Emisor y Admin; Verificador no necesita wallet |
| 7 | Transacciones, gas, gasLimit, gasPrice | Gas optimizado con `uint64`, custom errors, struct packing; Sepolia para no pagar real |
| 8 | Smart contracts, Solidity, `require`, `modifier`, visibilidad | Contrato completo en Solidity; `modifier`, `mapping`, `struct`, custom errors, `view` |
| 9 | Taller: eventos, `payable`, interfaces, Forge, Sepolia | `event` indexado, Foundry para tests y deploy, ethers.js v6 en CLI y frontend |

---

*Documento generado con asistencia de Claude (Anthropic) — TICS0870, Grupo 8.*
