# Registro de Documentos Sensibles en Blockchain

Proyecto final del curso **TICS0870 — Blockchain**.

Sistema para registrar y verificar la autenticidad de documentos sensibles
(títulos, certificados, contratos) sobre Ethereum, sin exponer el documento
original. Solo se almacena on-chain la **huella criptográfica** (`keccak256`)
del archivo; el documento real nunca sale del control de su dueño.

## Contrato desplegado

- **Red:** Ethereum Sepolia (testnet)
- **Dirección:** [`0x237b7111Be8436Ba3c74826C3C2DA6B3b2309cE1`](https://sepolia.etherscan.io/address/0x237b7111Be8436Ba3c74826C3C2DA6B3b2309cE1)

## ¿Cómo funciona?

1. El **Emisor** (una autoridad: universidad, notaría, etc.) calcula el hash de
   un documento y lo registra on-chain junto con el titular y el tipo.
2. Cualquier **Verificador** puede tomar un archivo, calcular su hash y consultar
   el contrato: si el hash coincide, el documento es auténtico y no fue alterado.
3. Si el documento se modifica en un solo byte, su hash cambia por completo y la
   verificación falla — así se detecta cualquier falsificación.

Solo el hash vive en la blockchain. El documento real se mantiene privado.

## Roles

| Rol | Permiso |
|---|---|
| **Admin** | Autoriza y revoca Emisores. Es quien desplegó el contrato. |
| **Emisor** | Registra documentos. Debe ser autorizado por el Admin. |
| **Verificador** | Cualquier dirección. Consulta sin necesidad de permiso. |

## Estructura del repositorio

```
src/RegistroDocumentos.sol      Smart contract principal
test/RegistroDocumentos.t.sol   Tests con Forge (unitarios + fuzz)
script/Deploy.s.sol             Script de despliegue a Sepolia
demo/                           CLI en Node.js + ethers.js para la demo
frontend/                       dApp web (React + Vite + Tailwind + ethers v6)
INFORME_BASE.md                 Base del informe escrito
```

## Uso

### Requisitos
- [Foundry](https://book.getfoundry.sh/) (forge, cast)
- Node.js (para el demo CLI)

### Compilar y testear

```bash
forge build
forge test -vv
```

Resultado esperado: **10/10 tests pasando** (incluye 256 corridas de fuzzing).

### Desplegar a Sepolia

```bash
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --account MiCuenta \
  --sender 0xTU_DIRECCION \
  --broadcast
```

### Interactuar (demo CLI)

Ver instrucciones detalladas en [`demo/README.md`](demo/README.md).

```bash
cd demo
npm install
cp .env.example .env   # editar con tus valores

node demo.js info
node demo.js registrar documento-ejemplo.txt 0xTitular Titulo
node demo.js consultar documento-ejemplo.txt
```

### Interfaz web (frontend)

dApp con dashboard por rol (Admin / Emisor / Verificador), historial de eventos on-chain y
conexión por MetaMask. Ver [`frontend/README.md`](frontend/README.md).

```bash
cd frontend
npm install
cp .env.example .env   # editar VITE_CONTRACT_ADDRESS con la dirección de la v2
npm run dev            # http://localhost:5173
```

## Decisiones de diseño

Las justificaciones técnicas de cada decisión (uso de `bytes32`, flag `existe`,
custom errors, eventos indexados, separación `verificar`/`consultar`, etc.) están
documentadas en [`INFORME_BASE.md`](INFORME_BASE.md).

## Tecnologías

Solidity 0.8.24 · Foundry · ethers.js v6 · Ethereum Sepolia · keccak256
