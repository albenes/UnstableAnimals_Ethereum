import { describe, expect, it, vi } from 'vitest'
import { switchToMainnet } from './switchToMainnet'

describe('switchToMainnet', () => {
  it('switches chain when wallet supports it', async () => {
    const request = vi.fn().mockResolvedValue(null)
    await switchToMainnet({ request })
    expect(request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    })
  })

  it('adds mainnet when chain is unknown (4902)', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce({ code: 4902 })
      .mockResolvedValueOnce(null)

    await switchToMainnet({ request })

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    })
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'wallet_addEthereumChain',
      params: [
        expect.objectContaining({
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
        }),
      ],
    })
  })

  it('rethrows other wallet errors', async () => {
    const err = { code: 4001, message: 'User rejected' }
    const request = vi.fn().mockRejectedValue(err)
    await expect(switchToMainnet({ request })).rejects.toEqual(err)
  })
})
