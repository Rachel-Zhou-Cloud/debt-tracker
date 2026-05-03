import type { Debt, AmortizationEntry, DebtSummary, CashFlowEntry } from '@/types'

// --- Date Utilities ---

export function getCurrentMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  return `${y}-${m}`
}

export function addMonths(dateStr: string, months: number): string {
  const [y, m] = dateStr.split('-').map(Number) as [number, number]
  const total = y * 12 + (m - 1) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${nm.toString().padStart(2, '0')}`
}

export function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number) as [number, number]
  const [ty, tm] = to.split('-').map(Number) as [number, number]
  return (ty - fy) * 12 + (tm - fm)
}

// --- Amortization Schedule Generation ---

function generateEqualInstallment(debt: Debt): AmortizationEntry[] {
  const r = debt.annualRate / 12
  const n = debt.totalPeriods
  const entries: AmortizationEntry[] = []
  let remaining = debt.principal

  // Sort prepayments by date
  const prepayments = [...debt.prepayments].sort((a, b) => a.date.localeCompare(b.date))
  let prepaymentIdx = 0

  // Recalculate monthly payment based on current remaining and periods left
  function calcMonthly(rem: number, periodsLeft: number): number {
    if (r === 0) return rem / periodsLeft
    return (rem * r * Math.pow(1 + r, periodsLeft)) / (Math.pow(1 + r, periodsLeft) - 1)
  }

  let monthlyPayment = calcMonthly(remaining, n)
  let periodsLeft = n

  for (let i = 0; i < n && remaining > 0.01; i++) {
    const date = addMonths(debt.startDate, i)
    const interest = remaining * r
    let principal = Math.min(monthlyPayment - interest, remaining)
    const payment = interest + principal

    // Handle prepayment in this month
    let prepaymentAmount = 0
    while (prepaymentIdx < prepayments.length && prepayments[prepaymentIdx]!.date === date) {
      prepaymentAmount += prepayments[prepaymentIdx]!.amount
      prepaymentIdx++
    }

    remaining = Math.max(remaining - principal - prepaymentAmount, 0)

    entries.push({
      date,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      prepayment: Math.round(prepaymentAmount * 100) / 100,
    })

    if (remaining <= 0.01) break

    // Recalculate monthly payment after prepayment
    if (prepaymentAmount > 0) {
      periodsLeft = n - i - 1
      if (periodsLeft > 0) {
        monthlyPayment = calcMonthly(remaining, periodsLeft)
      }
    }
  }

  return entries
}

function generateEqualPrincipal(debt: Debt): AmortizationEntry[] {
  const r = debt.annualRate / 12
  const n = debt.totalPeriods
  const entries: AmortizationEntry[] = []
  let remaining = debt.principal

  const prepayments = [...debt.prepayments].sort((a, b) => a.date.localeCompare(b.date))
  let prepaymentIdx = 0

  let basePrincipal = debt.principal / n

  for (let i = 0; i < n && remaining > 0.01; i++) {
    const date = addMonths(debt.startDate, i)
    const interest = remaining * r
    const principal = Math.min(basePrincipal, remaining)
    const payment = principal + interest

    let prepaymentAmount = 0
    while (prepaymentIdx < prepayments.length && prepayments[prepaymentIdx]!.date === date) {
      prepaymentAmount += prepayments[prepaymentIdx]!.amount
      prepaymentIdx++
    }

    remaining = Math.max(remaining - principal - prepaymentAmount, 0)

    entries.push({
      date,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      prepayment: Math.round(prepaymentAmount * 100) / 100,
    })

    if (remaining <= 0.01) break

    // Recalculate base principal after prepayment
    if (prepaymentAmount > 0) {
      const periodsLeft = n - i - 1
      if (periodsLeft > 0) {
        basePrincipal = remaining / periodsLeft
      }
    }
  }

  return entries
}

function generateInterestFirst(debt: Debt): AmortizationEntry[] {
  const r = debt.annualRate / 12
  const n = debt.totalPeriods
  const entries: AmortizationEntry[] = []
  let remaining = debt.principal

  const prepayments = [...debt.prepayments].sort((a, b) => a.date.localeCompare(b.date))
  let prepaymentIdx = 0

  for (let i = 0; i < n && remaining > 0.01; i++) {
    const date = addMonths(debt.startDate, i)
    const interest = remaining * r
    const isLast = i === n - 1 || remaining <= 0.01
    const principal = isLast ? remaining : 0
    const payment = principal + interest

    let prepaymentAmount = 0
    while (prepaymentIdx < prepayments.length && prepayments[prepaymentIdx]!.date === date) {
      prepaymentAmount += prepayments[prepaymentIdx]!.amount
      prepaymentIdx++
    }

    remaining = Math.max(remaining - principal - prepaymentAmount, 0)

    entries.push({
      date,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      prepayment: Math.round(prepaymentAmount * 100) / 100,
    })

    if (remaining <= 0.01) break
  }

  return entries
}

export function generateAmortizationSchedule(debt: Debt): AmortizationEntry[] {
  switch (debt.method) {
    case 'equal_installment': return generateEqualInstallment(debt)
    case 'equal_principal': return generateEqualPrincipal(debt)
    case 'interest_first': return generateInterestFirst(debt)
  }
}

// --- Summary Calculations ---

export function calculateTotalInterest(debt: Debt): number {
  const schedule = generateAmortizationSchedule(debt)
  return schedule.reduce((sum, e) => sum + e.interest, 0)
}

export function calculatePaidSoFar(debt: Debt): { paidPrincipal: number; paidInterest: number; paidMonths: number } {
  const schedule = generateAmortizationSchedule(debt)
  const current = getCurrentMonth()
  let paidPrincipal = 0
  let paidInterest = 0
  let paidMonths = 0

  for (const entry of schedule) {
    if (entry.date > current) break
    paidPrincipal += entry.principal + entry.prepayment
    paidInterest += entry.interest
    paidMonths++
  }

  return { paidPrincipal, paidInterest, paidMonths }
}

export function calculateDebtSummary(debts: Debt[]): DebtSummary {
  const totalPrincipal = debts.reduce((s, d) => s + d.principal, 0)
  const totalInterest = debts.reduce((s, d) => s + calculateTotalInterest(d), 0)
  const totalDebt = totalPrincipal + totalInterest

  let totalPaidPrincipal = 0
  let totalPaidInterest = 0
  let totalPrepaid = 0

  for (const d of debts) {
    const paid = calculatePaidSoFar(d)
    totalPaidPrincipal += paid.paidPrincipal
    totalPaidInterest += paid.paidInterest
    totalPrepaid += d.prepayments.reduce((s, p) => s + p.amount, 0)
  }

  const totalPaid = totalPaidPrincipal + totalPaidInterest
  const remaining = Math.max(totalDebt - totalPaid, 0)
  const percentage = totalDebt > 0 ? Math.min((totalPaid / totalDebt) * 100, 100) : 0

  return { totalPrincipal, totalInterest, totalDebt, totalPaid, totalPrepaid, remaining, percentage }
}

export function getEstimatedPayoffDate(debts: Debt[]): string | null {
  let lastDate: string | null = null
  for (const debt of debts) {
    const schedule = generateAmortizationSchedule(debt)
    const last = schedule[schedule.length - 1]
    if (last && (!lastDate || last.date > lastDate)) {
      lastDate = last.date
    }
  }
  return lastDate
}

export function sortByAvalanche(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.annualRate - a.annualRate)
}

// --- Cash Flow Aggregation ---

export function aggregateCashFlow(debts: Debt[]): CashFlowEntry[] {
  const map = new Map<string, CashFlowEntry>()

  for (const debt of debts) {
    const schedule = generateAmortizationSchedule(debt)
    for (const entry of schedule) {
      let existing = map.get(entry.date)
      if (!existing) {
        existing = {
          date: entry.date,
          totalPrincipal: 0,
          totalInterest: 0,
          totalPrepayment: 0,
          totalPayment: 0,
          debts: [],
        }
        map.set(entry.date, existing)
      }
      existing.totalPrincipal += entry.principal
      existing.totalInterest += entry.interest
      existing.totalPrepayment += entry.prepayment
      existing.totalPayment += entry.payment + entry.prepayment
      existing.debts.push(debt.lender)
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}

// --- Interest Saved by Prepayments ---

export function calculateInterestSaved(debt: Debt): number {
  // Calculate interest without prepayments
  const debtNoPrepay: Debt = { ...debt, prepayments: [] }
  const interestWithout = calculateTotalInterest(debtNoPrepay)
  const interestWith = calculateTotalInterest(debt)
  return Math.max(interestWithout - interestWith, 0)
}

export function calculateTotalInterestSaved(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + calculateInterestSaved(d), 0)
}
