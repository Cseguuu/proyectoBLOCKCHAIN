# Frontend — Registro de Documentos en Blockchain

dApp del proyecto TICS0870. Permite registrar, verificar y revocar documentos contra el
contrato `RegistroDocumentos` (Sepolia), con dashboard diferenciado por rol.

**Stack:** React + Vite + TypeScript + Tailwind CSS + ethers v6.

## Características

- **Dashboard por rol:** la UI detecta si la wallet es Admin, Emisor o Verificador y muestra las
  acciones pertinentes. La vista de verificación es pública (funciona sin wallet, en modo lectura).
- **El archivo nunca se sube:** el hash `keccak256` se calcula en el navegador; solo la huella de
  32 bytes viaja on-chain.
- **Estados de transacción:** cada acción reporta enviando → confirmando → minado/fallido, con
  enlace a Etherscan y mensajes legibles para los custom errors del contrato.
- **Historial on-chain:** tabla de eventos (`DocumentoRegistrado` / `Verificado` / `Revocado`).
- **NetworkGuard:** detecta si la wallet no está en Sepolia y ofrece cambiar de red.
- Responsive y accesible (roles ARIA, foco visible, contraste).

## Desarrollo

```bash
cd frontend
npm install
cp .env.example .env     # editar VITE_CONTRACT_ADDRESS con la dirección de la v2
npm run dev              # http://localhost:5173
```

### Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `VITE_CONTRACT_ADDRESS` | Dirección del contrato **v2** en Sepolia (con campo `revocado`). |
| `VITE_CHAIN_ID` | `11155111` para Sepolia. |
| `VITE_READONLY_RPC_URL` | RPC público para consultas sin wallet. |

> La dirección del contrato también puede pegarse en runtime desde el botón **⚙️ Contrato**
> (se guarda en `localStorage`), útil tras un redeploy sin reconstruir.

## Build y despliegue

```bash
npm run build     # genera dist/
npm run preview   # sirve el build localmente
```

Incluye `vercel.json` y `netlify.toml` listos: importa el repo en Vercel o Netlify, define la
raíz del proyecto en `frontend/`, configura las variables `VITE_*` en el panel y despliega.

## Estructura

```
src/
├── lib/        contract.ts (ABI v2), hash.ts, format.ts, errors.ts
├── hooks/      useWallet (conexión/rol/contratos), useRole, useEvents
├── components/ WalletBar, NetworkGuard, FileDropzone, TxButton, ResultCard, EventTable, Toaster, RoleBadge
└── views/      VerifierView, IssuerView, AdminView
```
