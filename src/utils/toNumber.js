export function toNumber(value) {
  return typeof value === 'bigint' ? Number(value) : Number(value)
}
