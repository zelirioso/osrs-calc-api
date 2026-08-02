// Strips redundant leading zeros (e.g. "07" -> "7") without touching a lone "0".
export function stripLeadingZeros(value: string): string {
  return value.replace(/^0+(?=\d)/, '');
}

// Comma-groups displayed numbers (e.g. 206297.5 -> "206,297.5"). Display only
// -- never applied to input values, which must stay plain for type="number".
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
