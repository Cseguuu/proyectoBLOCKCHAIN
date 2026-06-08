# Demo CLI — RegistroDocumentos

CLI en Node.js (ethers.js v6) para interactuar con el contrato desplegado en Sepolia.

## Instalacion

Desde WSL, dentro de la carpeta `demo/`:

```bash
cd demo
npm install
cp .env.example .env
```

Edita `.env` con tus valores:
- `SEPOLIA_RPC_URL` — tu URL de Alchemy.
- `PRIVATE_KEY` — clave privada de tu wallet emisora. La obtienes del keystore con:
  ```bash
  cast wallet private-key --account MiCuentaNueva
  ```
- `CONTRACT_ADDRESS` — ya viene con la direccion desplegada (`0xd4C9...a37c`).

> El `.env` esta en `.gitignore`. Nunca lo subas al repositorio.

## Comandos

```bash
# Ver estado del contrato y si tu wallet es emisor
node demo.js info

# Registrar un documento (calcula keccak256 del archivo)
node demo.js registrar documento-ejemplo.txt 0xTitular... Titulo

# Verificar (transaccion, deja traza on-chain con evento)
node demo.js verificar documento-ejemplo.txt

# Consultar (gratis, sin transaccion, solo lectura)
node demo.js consultar documento-ejemplo.txt

# Autorizar otra wallet como emisor (solo admin)
node demo.js autorizar 0xOtraWallet...
```

## Flujo de demostracion sugerido (para el video)

1. `node demo.js info` — muestra que tu wallet es el admin/emisor.
2. `node demo.js consultar documento-ejemplo.txt` — sale "NO REGISTRADO".
3. `node demo.js registrar documento-ejemplo.txt 0xTitular Titulo` — lo registra.
4. `node demo.js consultar documento-ejemplo.txt` — ahora sale "AUTENTICO".
5. Edita un byte del archivo y vuelve a consultar — el hash cambia y sale "NO REGISTRADO", demostrando la deteccion de alteraciones.
