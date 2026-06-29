import { BrowserProvider, JsonRpcProvider } from 'ethers'
import { CHAIN_ID } from './config/contract'

const MAINNET_RPC = import.meta.env.VITE_MAINNET_RPC || 'https://eth.llamarpc.com'

export function hasWallet() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
}

/** @deprecated Prefer useWalletConnection() — kept for tests and legacy imports */
export function resolveProvider() {
  if (hasWallet()) {
    return new BrowserProvider(window.ethereum)
  }

  if (import.meta.env.MODE === 'test') {
    return undefined
  }

  if (typeof window !== 'undefined') {
    return new JsonRpcProvider(MAINNET_RPC, CHAIN_ID)
  }

  return undefined
}
