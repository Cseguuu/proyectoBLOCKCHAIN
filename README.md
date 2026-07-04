# Registro de Documentos Sensibles en Blockchain

Proyecto final del curso **TICS0870 — Blockchain**.

Sistema para registrar y verificar la autenticidad de documentos sensibles
(títulos, certificados, contratos) sobre Ethereum, sin exponer el documento
original. Solo se almacena on-chain la **huella criptográfica** (`keccak256`)
del archivo; el documento real nunca sale del control de su dueño.

## Contrato desplegado

- **Red:** Ethereum Sepolia (testnet)
- **Dirección:** [`0xbF43Ec80BDC51ADBCF8dd9932eA2E79DD7f27c84`](https://sepolia.etherscan.io/address/0xbF43Ec80BDC51ADBCF8dd9932eA2E79DD7f27c84)

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
demo/                           CLI en Node.js + ethers.js — base del proyecto
frontend/                       dApp web (React + Vite + Tailwind + ethers v6) — extra
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

Resultado esperado: **21 tests pasando** (incluye 2 pruebas de fuzzing con 256 corridas cada una).

### Desplegar tu propio contrato (y ser admin)

El contrato no recibe parámetros en su constructor: **la cuenta que lo despliega
queda automáticamente como `admin`** (y como emisor autorizado). Para desplegar el
tuyo necesitas tres cosas previas:

1. **Un endpoint RPC de Sepolia.** Crea una cuenta gratuita en
   [Alchemy](https://www.alchemy.com/) o [Infura](https://www.infura.io/) y copia
   la URL HTTPS de Sepolia. Guárdala en una variable de entorno:
   ```bash
   export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY"
   ```
2. **ETH de prueba** en la cuenta que desplegará, desde un faucet de Sepolia
   (p. ej. [sepoliafaucet.com](https://sepoliafaucet.com/)). Sin saldo, la
   transacción de despliegue falla por falta de gas.
3. **Una cuenta importada en el keystore de Foundry** (no se usa la clave privada
   en texto plano):
   ```bash
   cast wallet import MiCuenta --interactive   # pega tu private key una vez
   ```

Con eso listo, despliega:

```bash
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --account MiCuenta \
  --sender 0xTU_DIRECCION \
  --broadcast
```

El comando imprime la dirección del contrato desplegado. Serás el **admin** de ese
contrato. Para operarlo desde la CLI o el frontend, apunta a esa dirección
(`.env` de `demo/` o `VITE_CONTRACT_ADDRESS` en `frontend/`).

### Interactuar (demo CLI) — base del proyecto

Forma principal de usar el sistema por línea de comandos.
Ver instrucciones detalladas en [`demo/README.md`](demo/README.md).

```bash
cd demo
npm install
cp .env.example .env   # editar con tus valores

node demo.js info
node demo.js registrar documento-ejemplo.txt 0xTitular Titulo
node demo.js consultar documento-ejemplo.txt
```

### Interfaz web (frontend) — extra

Además de la CLI, se desarrolló una dApp web con dashboard por rol
(Admin / Emisor / Verificador), historial de eventos on-chain y conexión por
MetaMask. Ver [`frontend/README.md`](frontend/README.md).

```bash
cd frontend
npm install
cp .env.example .env   # editar VITE_CONTRACT_ADDRESS con la dirección del contrato
npm run dev            # http://localhost:5173
```

## Decisiones de diseño

Las justificaciones técnicas de cada decisión (uso de `bytes32`, flag `existe`,
custom errors, eventos indexados, separación `verificar`/`consultar`, etc.) están
documentadas en el informe del proyecto.

## Tecnologías

Solidity 0.8.24 · Foundry · ethers.js v6 · Ethereum Sepolia · keccak256
