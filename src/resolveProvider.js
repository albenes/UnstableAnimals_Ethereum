import { BrowserProvider, JsonRpcProvider } from 'ethers';

const MAINNET_CHAIN_ID = 1;
const MAINNET_RPC = 'https://eth.llamarpc.com';

export function hasWallet() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

export function resolveProvider() {
  if (hasWallet()) {
    return new BrowserProvider(window.ethereum);
  }

  if (import.meta.env.MODE === 'test') {
    return undefined;
  }

  if (typeof window !== 'undefined') {
    return new JsonRpcProvider(MAINNET_RPC, MAINNET_CHAIN_ID);
  }

  return undefined;
}
