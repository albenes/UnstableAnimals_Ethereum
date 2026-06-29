import { toNumber } from './toNumber'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function parsePurchasedTokenIds(receipt, iface) {
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log)
      if (parsed?.name !== 'UnstableAnimalsBought') continue

      const count = toNumber(parsed.args.UnstableAnimalsBought)
      const indexes = parsed.args.UnstableAnimalsIndexes
      return Array.from(indexes.slice(0, count), (id) => toNumber(id)).filter((id) => id > 0)
    } catch {
      // Unrelated log from another contract in the same tx
    }
  }

  return receipt.logs
    .map((log) => {
      try {
        return iface.parseLog(log)
      } catch {
        return null
      }
    })
    .filter((log) => log?.name === 'Transfer' && log.args.from === ZERO_ADDRESS)
    .map((log) => toNumber(log.args.tokenId))
}
