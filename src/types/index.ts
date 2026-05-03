export type PaymentMethod = 'equal_installment' | 'equal_principal' | 'interest_first'

export interface PrepaymentContribution {
  memberId: string
  amount: number
}

export interface Prepayment {
  id: string
  date: string    // "YYYY-MM"
  amount: number
  contributions: PrepaymentContribution[]
}

export interface Debt {
  id: string
  lender: string
  principal: number
  annualRate: number       // e.g. 0.05 = 5%
  totalPeriods: number     // months
  startDate: string        // "YYYY-MM"
  method: PaymentMethod
  prepayments: Prepayment[]
  nominalDebtorId?: string   // 名义债务人
  actualDebtorId?: string    // 实际债务人
}

export interface AmortizationEntry {
  date: string
  principal: number
  interest: number
  payment: number
  remaining: number
  prepayment: number
}

export interface FamilyMember {
  id: string
  name: string
}

export interface DebtSummary {
  totalPrincipal: number
  totalInterest: number
  totalDebt: number
  totalPaid: number
  totalPrepaid: number
  remaining: number
  percentage: number
}

export interface CashFlowEntry {
  date: string
  totalPrincipal: number
  totalInterest: number
  totalPrepayment: number
  totalPayment: number
  debts: string[]
}

export interface Milestone {
  threshold: number
  label: string
  emoji: string
}
