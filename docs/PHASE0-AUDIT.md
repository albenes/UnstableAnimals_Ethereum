# Fase 0 — Auditoría y baseline

Rama base: `UnstableAnimals` → `cursor/unstable-animals-modernize-88f4`

## Contrato desplegado (fuente de verdad)

| Campo | Valor |
|-------|-------|
| Nombre Solidity | `UnstableAnimals` |
| Dirección mainnet | `0xe29d2d356bffE827E4Df3B6cA9Fdc9819C3e2651` |
| Variable mint count | `UnstableAnimalsMinted` |
| Mint owner | `mintUnstableAnimalsGroup()` |
| OpenSea slug | `unstable-animals` |
| Metadata IPFS | `parallelworlds.mypinata.cloud/ipfs/QmQDWG92prsc64fPoeVtKrSZhR3RM2PCaCBCJLdH7A1vaK/` |

**No hay redeploy planificado.** Toda modernización debe leer/escribir este contrato.

## `main` vs `UnstableAnimals` (por qué divergimos)

El `main` actual del repo es un clon de **Space Shibas** modernizado por error:

| | `main` (incorrecto para nosotros) | `UnstableAnimals` (nuestro proyecto) |
|---|---|---|
| Contrato | `SpaceShibas` @ `0xeF81…` | `UnstableAnimals` @ `0xe29d…` |
| Toolchain | Vite, React 18, ethers v6, CI | CRA, React 17, ethers v5 + web3.js |
| UI | Solo mint | Mint + Timeline + Team + Footer |
| Tests | 13 tests Hardhat + Vitest | Solo template roto (`Greeter`) |

**Decisión:** modernizar desde `UnstableAnimals`, no desde `main`. Al terminar las fases, esta rama reemplazará `main`.

## Problemas encontrados en Fase 0

### Críticos (corregidos en esta fase)

1. **`MintSection.js` con dos flujos de mint** — ethers (`buyUnstableAnimals`) y web3.js (`finishPayment` / `buyUnstableAnimal`) duplicados; el botón usaba web3.
2. **`MintGallery.js` roto** — renderizaba un `<div>` vacío; los portraits no se mostraban.
3. **Config del contrato dispersa** — dirección repetida en varios sitios.

### Pendientes para fases siguientes

| Fase | Trabajo |
|------|---------|
| **1** | Tests `UnstableAnimals.sol`, `.nvmrc`, scripts `compile`/`prebuild`, limpiar deps muertas | ✅ Hecha en `cursor/phase-1-fundamentals-eb02` |
| **2** | Migrar CRA → Vite, React 18, CI | ✅ Hecha en `cursor/phase-2-toolchain-eb02` |
| **3** | ethers v6, `JsonRpcProvider` read-only sin wallet |

### Deuda técnica menor (no bloqueante)

- `react-native-*` en dependencias de una web app (usado por timeline)
- `hardhat.config.js` con bloques comentados de redes/testnets
- `App.test.js` sigue siendo boilerplate CRA
- `public/index minting full.html` — archivo suelto de backup
- `package-lock.json` + `yarn.lock` coexisten

## Cambios aplicados en Fase 0

- [x] Rama `cursor/unstable-animals-modernize-88f4` desde `UnstableAnimals`
- [x] `src/config/contract.js` — constantes centralizadas
- [x] `MintSection.js` — un solo flujo ethers; eliminado web3.js
- [x] `MintGallery.js` — galería de portraits restaurada
- [x] `UnstablePortrait.js` — URI desde config compartida
- [x] Validación de red mainnet antes de mint
- [x] Enlaces OpenSea/Rarible restaurados post-mint

## Cómo verificar localmente

```bash
yarn install
yarn start
yarn test:contracts
yarn test
yarn build
```
