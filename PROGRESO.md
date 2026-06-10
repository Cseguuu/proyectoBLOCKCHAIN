# Progreso del Proyecto — Registro de Documentos en Blockchain

Curso: TICS0870 | Grupo 8: Los Callampines

---

## Estado actual

| Componente | Estado |
|---|---|
| Smart contract `RegistroDocumentos.sol` (v2: revocación + transferencia de admin) | ✅ Completo |
| Tests Forge (21 tests: unitarios + fuzz) | ✅ Pasando |
| Deploy en Sepolia | ⚠️ Desplegada la v1 — falta redeploy de la v2 |
| Demo CLI (Node.js + ethers.js) | ✅ Actualizada para v2 |
| Frontend web (`frontend/index.html`, MetaMask + ethers.js) | ✅ Listo (requiere contrato v2) |
| README del repositorio | ✅ Listo |
| Informe base (`INFORME_BASE.md`) | ✅ Borrador listo |
| Verificación del contrato en Etherscan | ⬜ Pendiente |
| Informe formal (.docx) | ⬜ Pendiente |
| Video demo | ⬜ Pendiente |

---

## Contrato desplegado

- **Red:** Ethereum Sepolia
- **Dirección:** `0xd4C906016999E7DcD5E2708C011a975E5557a37c`
- **Tx de deploy:** `0xc0b6667cac9a74d55bc084df2ca8eb549753891f653924fc523f4cc3d2e98b83`
- **Bloque:** 11018690
- **Gas pagado:** 0.000578 ETH
- **Etherscan:** https://sepolia.etherscan.io/address/0xd4C906016999E7DcD5E2708C011a975E5557a37c

---

## Transacciones on-chain realizadas

| Acción | Tx | Bloque |
|---|---|---|
| Deploy del contrato | `0xc0b666...` | 11018690 |
| Registro de `documento-ejemplo.txt` | `0x206de0...` | 11018891 |

---

## Wallets

- **Admin / Emisor:** `0x193Eb8dE1535983661fa06dEa2d30aA212fF4c26`
- **Keystore local:** `~/.foundry/keystores/MiCuentaNueva`
- **Inscripción del grupo (contrato del profesor):** grupo 8, contrato `0x9C3DddF712B043DcE0ede728AF6D38337860f459`

---

## Estructura del proyecto

```
proyectoBLOCKCHAIN/
├── src/
│   └── RegistroDocumentos.sol      # Contrato principal
├── test/
│   └── RegistroDocumentos.t.sol    # Tests (10/10 pasando)
├── script/
│   └── Deploy.s.sol                # Script de deploy Foundry
├── demo/
│   ├── demo.js                     # CLI principal
│   ├── abi.js                      # ABI + helpers del enum
│   ├── package.json                # Dependencias Node.js
│   ├── .env.example                # Template de variables de entorno
│   ├── documento-ejemplo.txt       # Documento registrado on-chain
│   └── README.md                   # Instrucciones del demo
├── broadcast/                      # Logs de deploy de Foundry
├── foundry.toml                    # Config de Foundry
├── INFORME_BASE.md                 # Borrador del informe escrito
├── PROGRESO.md                     # Este archivo
└── README.md                       # README del repositorio
```

---

## Entorno de desarrollo

| Herramienta | Versión |
|---|---|
| Foundry (forge / cast) | 1.7.1 |
| Solidity | 0.8.24 |
| Node.js | (instalado en WSL) |
| ethers.js | v6.13.2 |
| Sistema | Windows 11 + WSL2 Ubuntu |
| RPC | Alchemy (Sepolia) |

---

## Flujo de demo (para presentación)

```bash
cd /mnt/c/Users/crist/OneDrive/Desktop/Blockchain/proyectoBLOCKCHAIN/demo

# 1. Ver estado del contrato
node demo.js info

# 2. Consultar antes de registrar → NO REGISTRADO
node demo.js consultar documento-ejemplo.txt

# 3. Registrar un documento nuevo
echo "Certificado de participacion - Cristobal Segu" > certificado.txt
node demo.js registrar certificado.txt 0x193Eb8dE1535983661fa06dEa2d30aA212fF4c26 Certificado

# 4. Consultar después → AUTENTICO
node demo.js consultar certificado.txt

# 5. Alterar el documento (propiedad de avalancha)
echo " " >> certificado.txt
node demo.js consultar certificado.txt   # → NO REGISTRADO

# 6. Restaurar y verificar nuevamente
git checkout certificado.txt 2>/dev/null || true
```

---

## Comandos útiles

```bash
# Correr todos los tests
forge test -vv

# Ver contrato en Sepolia
cast call 0xd4C906016999E7DcD5E2708C011a975E5557a37c "admin()(address)" --rpc-url $SEPOLIA_RPC_URL

# Verificar si una dirección es emisor
cast call 0xd4C906016999E7DcD5E2708C011a975E5557a37c \
  "emisoresAutorizados(address)(bool)" \
  0x193Eb8dE1535983661fa06dEa2d30aA212fF4c26 \
  --rpc-url $SEPOLIA_RPC_URL
```

---

## Novedades v2 del contrato (2026-06-10)

- `revocarDocumento(bytes32)`: el emisor original o el admin pueden invalidar un documento. El registro histórico se conserva (`existe=true, revocado=true`) pero `consultar`/`verificar` lo reportan como no válido.
- `transferirAdmin(address)`: el admin puede traspasar el control del contrato.
- Validación de dirección cero en `autorizarEmisor` y `transferirAdmin`.
- El struct `Documento` ahora incluye el campo `revocado` (cambia el ABI de `consultar`/`verificar`).
- CLI: nuevos comandos `revocar-doc`, `revocar-emisor`, `transferir-admin`.
- Frontend web en `frontend/index.html`: drag & drop de cualquier archivo (PDF, DOCX, imágenes — el hash se calcula en el navegador, el archivo nunca se sube), detección de rol (Admin/Emisor/Verificador), panel de administración.

**IMPORTANTE:** la v2 cambia el ABI, por lo que hay que **redesplegar el contrato** y actualizar `CONTRACT_ADDRESS` en `demo/.env` y en el frontend:

```bash
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --account MiCuentaNueva --broadcast
```

---

## Pendientes para la entrega final

- [ ] **Redesplegar el contrato v2 en Sepolia** y actualizar `CONTRACT_ADDRESS` en `demo/.env` y frontend
- [ ] Registrar nuevamente los documentos de ejemplo en el contrato v2
- [ ] Verificar el contrato en Etherscan (subir código fuente para que sea público)
- [ ] Redactar informe formal en `.docx` a partir de `INFORME_BASE.md`
- [ ] Grabar video demo siguiendo el flujo de la sección anterior
- [ ] Autorizar al profesor como emisor (opcional, para demostración de roles)
- [ ] Subir repositorio final con acceso para los profesores
