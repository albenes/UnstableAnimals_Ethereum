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
yarn start
yarn compile          # compila el contrato
yarn test:contracts   # 13 tests Hardhat
CI=true yarn test --watchAll=false   # test de React
```

> El build de producción (`yarn build`) falla en Node 22 por `react-scripts@4`. Se resuelve en la Fase 2 (migración a Vite).
