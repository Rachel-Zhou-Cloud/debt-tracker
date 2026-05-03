import { useState } from 'react'
import type { Debt, PaymentMethod, FamilyMember } from '@/types'

interface DebtFormProps {
  onSubmit: (debt: Omit<Debt, 'id' | 'prepayments'>) => void
  onCancel: () => void
  initialData?: Debt
  members: FamilyMember[]
}

export function DebtForm({ onSubmit, onCancel, initialData, members }: DebtFormProps) {
  const [lender, setLender] = useState(initialData?.lender ?? '')
  const [principal, setPrincipal] = useState(initialData?.principal?.toString() ?? '')
  const [annualRate, setAnnualRate] = useState(
    initialData ? (initialData.annualRate * 100).toString() : ''
  )
  const [totalPeriods, setTotalPeriods] = useState(initialData?.totalPeriods?.toString() ?? '')
  const [startDate, setStartDate] = useState(initialData?.startDate ?? '')
  const [method, setMethod] = useState<PaymentMethod>(initialData?.method ?? 'equal_installment')
  const [nominalDebtorId, setNominalDebtorId] = useState(initialData?.nominalDebtorId ?? '')
  const [actualDebtorId, setActualDebtorId] = useState(initialData?.actualDebtorId ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lender || !principal || !annualRate || !totalPeriods || !startDate) return

    onSubmit({
      lender,
      principal: parseFloat(principal),
      annualRate: parseFloat(annualRate) / 100,
      totalPeriods: parseInt(totalPeriods),
      startDate,
      method,
      nominalDebtorId: nominalDebtorId || undefined,
      actualDebtorId: actualDebtorId || undefined,
    })
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'
  const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>借款方名称</label>
        <input className={inputClass} value={lender} onChange={e => setLender(e.target.value)} placeholder="如：招商银行" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>借款本金 (元)</label>
          <input className={inputClass} type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="100000" />
        </div>
        <div>
          <label className={labelClass}>年利率 (%)</label>
          <input className={inputClass} type="number" step="0.01" value={annualRate} onChange={e => setAnnualRate(e.target.value)} placeholder="5.00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>还款期数 (月)</label>
          <input className={inputClass} type="number" value={totalPeriods} onChange={e => setTotalPeriods(e.target.value)} placeholder="36" />
        </div>
        <div>
          <label className={labelClass}>起始月份</label>
          <input className={inputClass} type="month" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass}>还款方式</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['equal_installment', '等额本息'],
            ['equal_principal', '等额本金'],
            ['interest_first', '先息后本'],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setMethod(val)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                method === val
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {members.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>名义债务人</label>
            <select
              className={inputClass}
              value={nominalDebtorId}
              onChange={e => setNominalDebtorId(e.target.value)}
            >
              <option value="">未指定</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>实际债务人</label>
            <select
              className={inputClass}
              value={actualDebtorId}
              onChange={e => setActualDebtorId(e.target.value)}
            >
              <option value="">未指定</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-medium active:scale-[0.97] transition-transform"
        >
          {initialData ? '保存修改' : '添加债务'}
        </button>
      </div>
    </form>
  )
}
