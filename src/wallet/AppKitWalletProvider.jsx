import { createContext, useCallback, useContext, useMemo } from 'react'
import { BrowserProvider } from 'ethers'
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet } from '@reown/appkit/networks'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { JsonRpcProvider } from 'ethers'
import { CHAIN_ID } from '../config/contract'

const MAINNET_RPC = import.meta.env.VITE_MAINNET_RPC || 'https://eth.llamarpc.com'

const WalletConnectionContext = createContext(null)

let appKitInitialized = false

function ensureAppKit() {
  if (appKitInitialized || typeof window === 'undefined') return
  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [mainnet],
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Unstable Animals',
      description: '10,000 Unstable Animals on Ethereum',
      url: window.location.origin,
      icons: [`${window.location.origin}/logo192.png`],
    },
    features: {
      analytics: false,
    },
  })
  appKitInitialized = true
}

function useReadProvider() {
  return useMemo(() => {
    if (import.meta.env.MODE === 'test') return undefined
    return new JsonRpcProvider(MAINNET_RPC, CHAIN_ID)
  }, [])
}

export default function AppKitWalletProvider({ children }) {
  ensureAppKit()

  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const readProvider = useReadProvider()

  const getWriteProvider = useCallback(async () => {
    if (!isConnected || !walletProvider) {
      throw new Error('Wallet not connected')
    }
    return new BrowserProvider(walletProvider)
  }, [isConnected, walletProvider])

  const getConnectedAddress = useCallback(async () => {
    if (address) return address
    const writeProvider = await getWriteProvider()
    const signer = await writeProvider.getSigner()
    return signer.getAddress()
  }, [address, getWriteProvider])

  const connect = useCallback(() => {
    open()
  }, [open])

  const value = useMemo(
    () => ({
      appKitEnabled: true,
      readProvider,
      canTransact: isConnected,
      getWriteProvider,
      getConnectedAddress,
      connect,
      openAppKit: open,
    }),
    [readProvider, isConnected, getWriteProvider, getConnectedAddress, connect, open]
  )

  return <WalletConnectionContext.Provider value={value}>{children}</WalletConnectionContext.Provider>
}

export { WalletConnectionContext }
