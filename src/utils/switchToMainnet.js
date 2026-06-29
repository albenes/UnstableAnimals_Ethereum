import { CHAIN_ID_HEX } from '../config/contract'

const MAINNET_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: 'Ethereum Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://eth.llamarpc.com'],
  blockExplorerUrls: ['https://etherscan.io'],
}

export async function switchToMainnet(ethereum = window.ethereum) {
  if (!ethereum) {
    throw new Error('No wallet available')
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX }],
    })
  } catch (err) {
    if (err?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [MAINNET_PARAMS],
      })
      return
    }
    throw err
  }
}
