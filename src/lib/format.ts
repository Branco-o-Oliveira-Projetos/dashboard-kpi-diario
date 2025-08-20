export function fmtNum(value: number | null, isMock: boolean = false): string {
  if (isMock || value === null || value === undefined) return '—'
  
  return new Intl.NumberFormat('pt-BR').format(value)
}
