export function fmtNum(value: number | null, isMock: boolean = false): string {
  if (isMock || value === null || value === undefined) return '—'
  
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function fmtMoney(value: number | null) {
  if (value == null || isNaN(value)) return '--'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
