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

## Estado del proyecto

Estamos modernizando desde la rama `UnstableAnimals` (no desde `main`, que apuntaba al contrato Space Shibas por error).

Ver [docs/PHASE0-AUDIT.md](docs/PHASE0-AUDIT.md) para el análisis completo y el plan de fases.

## Desarrollo

```bash
yarn install
yarn start              # Vite dev server
yarn compile            # compila el contrato
yarn test:contracts     # 13 tests Hardhat
yarn test               # tests de React (Vitest)
yarn build              # build de producción
```
