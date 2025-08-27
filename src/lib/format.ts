export function fmtNum(n: number | null) {
  if (n == null || isNaN(n)) return '--'
  return n.toLocaleString('pt-BR')
}

export function fmtMoney(value: number | null) {
  if (value == null || isNaN(value)) return '--'
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
