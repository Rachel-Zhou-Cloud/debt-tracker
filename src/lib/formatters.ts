export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    const wan = amount / 10000
    return wan.toFixed(wan % 1 === 0 ? 0 : 2) + '万'
  }
  return amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export function formatCurrencyFull(amount: number): string {
  return amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  return `${year}年${parseInt(month!, 10)}月`
}

export function formatDateShort(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  return `${year!.slice(2)}/${month}`
}

export function formatPercent(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%'
}

export function formatRate(rate: number): string {
  return (rate * 100).toFixed(2) + '%'
}

export function methodName(method: string): string {
  switch (method) {
    case 'equal_installment': return '等额本息'
    case 'equal_principal': return '等额本金'
    case 'interest_first': return '先息后本'
    default: return method
  }
}
