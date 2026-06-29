import { createContext, useCallback, useContext, useMemo, lazy, Suspense } from 'react'
import { BrowserProvider, JsonRpcProvider } from 'ethers'
import { CHAIN_ID } from '../config/contract'
import { WALLETCONNECT_ENABLED } from './config'

const MAINNET_RPC = import.meta.env.VITE_MAINNET_RPC || 'https://eth.llamarpc.com'

const WalletConnectionContext = createContext(null)

const AppKitWalletProvider = lazy(() => import('./AppKitWalletProvider.jsx'))

function hasInjectedWallet() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
}

function useReadProvider() {
  return useMemo(() => {
    if (import.meta.env.MODE === 'test') return undefined
    return new JsonRpcProvider(MAINNET_RPC, CHAIN_ID)
  }, [])
}

function InjectedWalletProvider({ children }) {
  const readProvider = useReadProvider()

  const getWriteProvider = useCallback(async () => {
    if (!hasInjectedWallet()) {
      throw new Error('No wallet available')
    }
    return new BrowserProvider(window.ethereum)
  }, [])

  const getConnectedAddress = useCallback(async () => {
    const writeProvider = await getWriteProvider()
    const signer = await writeProvider.getSigner()
    return signer.getAddress()
  }, [getWriteProvider])

  const connect = useCallback(async () => {
    if (!hasInjectedWallet()) {
      throw new Error('No wallet available')
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' })
  }, [])

  const value = useMemo(
    () => ({
      appKitEnabled: false,
      readProvider,
      canTransact: hasInjectedWallet(),
      getWriteProvider,
      getConnectedAddress,
      connect,
      openAppKit: () => {},
    }),
    [readProvider, getWriteProvider, getConnectedAddress, connect]
  )

  return <WalletConnectionContext.Provider value={value}>{children}</WalletConnectionContext.Provider>
}

export function WalletConnectionProvider({ children }) {
  if (WALLETCONNECT_ENABLED) {
    return (
      <Suspense fallback={<InjectedWalletProvider>{children}</InjectedWalletProvider>}>
        <AppKitWalletProvider>{children}</AppKitWalletProvider>
      </Suspense>
    )
  }
  return <InjectedWalletProvider>{children}</InjectedWalletProvider>
}

export function useWalletConnection() {
  const context = useContext(WalletConnectionContext)
  if (!context) {
    throw new Error('useWalletConnection must be used within WalletConnectionProvider')
  }
  return context
}
