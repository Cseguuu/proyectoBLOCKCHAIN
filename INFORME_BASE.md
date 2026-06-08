# Registro de Documentos Sensibles en Blockchain
## Proyecto Final — TICS0870

---

## 1. Introducción y Motivación

En Chile y el mundo, la falsificación de documentos sensibles (títulos universitarios, certificados, contratos notariales, documentos de identidad) es un problema real. Los sistemas tradicionales de verificación dependen de bases de datos centralizadas, que pueden ser vulneradas, alteradas o simplemente no están disponibles para consulta pública eficiente.

La tecnología Blockchain ofrece una solución a este problema mediante sus propiedades de **inmutabilidad**, **transparencia** y **descentralización**. Este proyecto implementa un sistema de registro de hashes de documentos sobre la red Ethereum (testnet Sepolia), permitiendo a cualquier persona verificar la autenticidad de un documento sin necesidad de confiar en una autoridad central.

---

## 2. Problema que Resuelve

**Pregunta central:** ¿Cómo puede una persona verificar que un documento es auténtico y no ha sido alterado, sin depender de una entidad centralizada?

**Limitaciones del sistema tradicional:**
- Bases de datos privadas susceptibles a manipulación interna.
- Procesos de verificación lentos y costosos (llamadas telefónicas, trámites presenciales).
- Sin trazabilidad pública de quién emitió qué y cuándo.

**Lo que aporta Blockchain:**
- El hash de un documento registrado on-chain no puede alterarse retroactivamente.
- Cualquiera puede verificar en cualquier momento, sin pedir permiso.
- Queda registro permanente de emisor, titular, tipo y timestamp.

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        CAPA OFF-CHAIN                        │
│                                                             │
│   [Documento Real]  ──►  keccak256(archivo)  =  bytes32     │
│   (PDF, imagen, etc.)        Hash del documento             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Solo el hash viaja on-chain
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT (Sepolia)                   │
│                    RegistroDocumentos.sol                    │
│                                                             │
│   mapping(bytes32 => Documento)  ←  almacenamiento          │
│   registrar(hash, titular, tipo) ←  escritura (emisores)    │
│   verificar(hash)                ←  lectura (cualquiera)    │
└─────────────────────────────────────────────────────────────┘
```

### Componentes principales

| Componente | Tecnología | Rol |
|---|---|---|
| Smart Contract | Solidity 0.8.24 | Lógica de negocio y almacenamiento |
| Framework de desarrollo | Foundry (forge, cast) | Compilación, testing, deploy |
| Red de pruebas | Ethereum Sepolia | Entorno de despliegue |
| Hash del documento | keccak256 / sha256 | Huella digital del archivo |

---

## 4. Roles del Sistema

El contrato implementa tres roles con distintos niveles de acceso:

### Admin
- Dirección que despliega el contrato.
- Único con permiso para autorizar o revocar Emisores.
- Modela a la institución que opera el sistema (ej: Ministerio de Educación, notaría).

### Emisor
- Dirección autorizada por el Admin para registrar documentos.
- Modela a una entidad emisora legítima (ej: universidad, notario, empresa).
- No puede registrar el mismo hash dos veces.

### Verificador
- Cualquier dirección de Ethereum.
- Puede consultar si un hash está registrado y ver sus metadatos.
- No necesita permiso, la verificación es pública.

---

## 5. Estructura del Documento On-Chain

Cuando se registra un documento, el contrato almacena la siguiente información:

```solidity
struct Documento {
    address emisor;       // quien registró el documento
    address titular;      // a quién pertenece el documento
    uint64  timestamp;    // momento exacto del registro (Unix time)
    TipoDocumento tipo;   // categoría: Título, Certificado, Contrato, etc.
    bool    existe;       // indica si el slot está ocupado
}
```

**Lo que NO se almacena:** el archivo original, el nombre, el contenido. Solo el hash de 32 bytes.

---

## 6. Flujo de Funcionamiento

### 6.1 Registro de un documento (Emisor)

1. El emisor tiene el archivo original (PDF, imagen, etc.).
2. Calcula el hash off-chain: `keccak256(contenido_del_archivo)`.
3. Llama a `registrar(hashDoc, titular, tipo)` desde su wallet autorizada.
4. El contrato verifica que el emisor está autorizado y que el hash no existe previamente.
5. Almacena el struct `Documento` y emite el evento `DocumentoRegistrado`.

### 6.2 Verificación de un documento (Verificador)

1. El verificador recibe el archivo que quiere autenticar.
2. Calcula el hash del archivo recibido con la misma función (keccak256).
3. Llama a `verificar(hashDoc)` o `consultar(hashDoc)`.
4. Si el hash está en el contrato → el documento es auténtico y no fue alterado.
5. Si no está → el documento es falso o no fue registrado en este sistema.

---

## 7. Decisiones de Diseño

### ¿Por qué solo el hash y no el documento completo?
Subir archivos a Ethereum es inviable: cuesta miles de dólares en gas y expone información privada en una red pública. El hash es suficiente como prueba de existencia e integridad — si el archivo cambia un solo byte, su hash cambia completamente (propiedad de avalancha).

### ¿Por qué bytes32 como clave del mapping?
`keccak256` retorna 32 bytes nativamente. Usar `bytes32` como clave ocupa un solo storage slot, hace el lookup O(1) y es más eficiente en gas que usar strings o uints.

### ¿Por qué el flag `existe` en el struct?
Solidity devuelve un struct vacío (todos ceros) para claves no existentes. Sin el flag `existe`, no habría forma de distinguir "no registrado" de "registrado con valores en cero". El flag resuelve esa ambigüedad.

### ¿Por qué `uint64` para el timestamp?
`uint64` cubre timestamps hasta el año 584 mil millones — más que suficiente. Al ser más pequeño que `uint256`, se empaqueta junto con otros campos del struct en un mismo storage slot de 32 bytes, reduciendo el costo de SSTORE.

### ¿Por qué custom errors en vez de `require("mensaje")`?
Desde Solidity 0.8.4, los custom errors (`revert NoAutorizado()`) consumen menos gas que strings en `require`. Además permiten hacer `vm.expectRevert(Contrato.Error.selector)` en tests, lo cual es más preciso.

### ¿Por qué dos funciones de consulta (`verificar` y `consultar`)?
- `verificar()`: no es `view`, emite evento. Útil cuando se quiere dejar traza on-chain de quién verificó qué (ej: banco que valida un título queda registrado).
- `consultar()`: es `view`, no gasta gas, no emite evento. Útil para frontends que necesitan consultar sin crear transacciones.

### ¿Por qué el anti-doble-registro?
La inmutabilidad es la propiedad central del sistema. Si se pudiera sobrescribir un hash, el emisor podría "renotarizar" un documento con metadatos distintos, destruyendo la confianza en el registro.

---

## 8. Contrato Inteligente — Interfaz Pública

| Función | Tipo | Acceso | Descripción |
|---|---|---|---|
| `registrar(bytes32, address, TipoDocumento)` | transaction | Solo Emisores | Registra el hash de un documento |
| `verificar(bytes32)` | transaction | Cualquiera | Verifica y emite evento de consulta |
| `consultar(bytes32)` | view (gratis) | Cualquiera | Consulta sin emitir evento |
| `autorizarEmisor(address)` | transaction | Solo Admin | Agrega un emisor autorizado |
| `revocarEmisor(address)` | transaction | Solo Admin | Revoca un emisor |
| `emisoresAutorizados(address)` | view | Cualquiera | Consulta si una dirección es emisor |

### Eventos emitidos

| Evento | Cuándo se emite |
|---|---|
| `DocumentoRegistrado` | Al registrar exitosamente un documento |
| `DocumentoVerificado` | Al llamar a `verificar()` |
| `EmisorAutorizado` | Al autorizar un nuevo emisor |
| `EmisorRevocado` | Al revocar un emisor |

---

## 9. Testing

El proyecto incluye una suite de tests escritos con **Forge** (framework de Foundry):

| Test | Tipo | Qué verifica |
|---|---|---|
| `test_AdminPuedeAutorizarEmisor` | Unitario | Control de acceso — roles |
| `test_NoAdminNoPuedeAutorizar` | Unitario | Rechazo de no-admin |
| `test_AdminPuedeRevocarEmisor` | Unitario | Revocación de emisor |
| `test_RegistrarEmiteEventoYGuardaDocumento` | Unitario | Flujo completo de registro |
| `test_NoEmisorNoPuedeRegistrar` | Unitario | Rechazo de no-emisor |
| `test_NoSePuedeRegistrarHashCero` | Unitario | Validación de hash inválido |
| `test_NoSePuedeRegistrarDosVecesElMismoHash` | Unitario | Anti-doble-registro |
| `test_VerificarDocumentoValido` | Unitario | Verificación exitosa con evento |
| `test_VerificarDocumentoInexistente` | Unitario | Verificación de hash no registrado |
| `testFuzz_RegistrarHashesAleatorios` | Fuzz (256 runs) | Invariante general del sistema |

Resultado: **10/10 tests pasando**.

---

## 10. Despliegue en Sepolia

La red Sepolia es la testnet oficial de Ethereum para pruebas de contratos. El despliegue se realiza con:

```bash
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --account MiCuenta --broadcast
```

Una vez desplegado, el contrato queda en una dirección pública verificable en [sepolia.etherscan.io](https://sepolia.etherscan.io).

---

## 11. Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|---|---|---|
| Solidity | 0.8.24 | Lenguaje del smart contract |
| Foundry | 1.7.1 | Compilación, testing, deploy |
| Ethereum Sepolia | — | Red de pruebas |
| keccak256 | — | Función de hash para documentos |
| WSL2 / Ubuntu | — | Entorno de desarrollo en Windows |

---

## 12. Limitaciones y Trabajo Futuro

- **Centralización del Admin:** actualmente un solo admin controla los emisores. En producción se reemplazaría por un multisig o `AccessControl` de OpenZeppelin.
- **Sin revocación de documentos:** un documento registrado no puede ser invalidado. Se podría agregar una función `revocarDocumento()` accesible solo al emisor original.
- **Sin firma del titular:** el titular no confirma haber recibido el documento. Se podría implementar con firmas EIP-712 off-chain.
- **Sin frontend:** la interacción actual es por línea de comandos. Un frontend web con ethers.js facilitaría el uso por personas no técnicas.
