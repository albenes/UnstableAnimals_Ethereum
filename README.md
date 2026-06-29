# Unstable Animals

10,000 unstable animals on the Ethereum blockchain

* [unstableanimals.com](https://unstableanimals.com)
* [Twitter](https://twitter.com/UnstableAnimals)
* [Discord](https://discord.gg/dCX6vqxXNm)

## Contrato desplegado

| Campo | Valor |
|-------|-------|
| Red | Ethereum mainnet |
| Dirección | `0xe29d2d356bffE827E4Df3B6cA9Fdc9819C3e2651` |
| OpenSea | `unstable-animals` |

Constantes centralizadas en `src/config/contract.js`.

## Stack

- **Frontend:** React 18, Vite 6, ethers v6, SWR 2
- **Contracts:** Hardhat 2, Solidity 0.8.4 (`UnstableAnimals.sol`)

## Desarrollo

Requiere Node.js 18+ (ver `.nvmrc`).

```bash
yarn install
yarn start              # Vite dev server
yarn compile            # compila el contrato
yarn test:contracts     # 13 tests Hardhat
yarn test               # tests de React (Vitest)
yarn build              # build de producción
```

Ver [docs/PHASE0-AUDIT.md](docs/PHASE0-AUDIT.md) para el historial de modernización.
