import { describe, expect, it } from 'vitest'
import { Interface } from 'ethers'
import { parsePurchasedTokenIds } from './parseMintReceipt'

const iface = new Interface([
  'event UnstableAnimalsBought(address buyer, uint256 UnstableAnimalsBought, uint256[10] UnstableAnimalsIndexes)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
])

describe('parsePurchasedTokenIds', () => {
  it('reads token ids from UnstableAnimalsBought event', () => {
    const encoded = iface.encodeEventLog('UnstableAnimalsBought', [
      '0x0000000000000000000000000000000000000001',
      2n,
      [5n, 9n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
    ])

    const receipt = {
      logs: [
        {
          topics: encoded.topics,
          data: encoded.data,
        },
      ],
    }

    expect(parsePurchasedTokenIds(receipt, iface)).toEqual([5, 9])
  })
})
