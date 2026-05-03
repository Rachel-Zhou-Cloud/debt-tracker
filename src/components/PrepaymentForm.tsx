import { useState, useEffect, useCallback } from 'react'
import type { FamilyMember, Prepayment, PrepaymentContribution } from '@/types'
import { DEFAULT_PREPAYER_NAME } from '@/lib/constants'

interface PrepaymentFormProps {
  onSubmit: (data: { date: string; amount: number; contributions: PrepaymentContribution[] }) => void
  onCancel: () => void
  members: FamilyMember[]
  initialData?: Prepayment
}

export function PrepaymentForm({ onSubmit, onCancel, members, initialData }: PrepaymentFormProps) {
  const [date, setDate] = useState(initialData?.date ?? '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '')
  const [allocations, setAllocations] = useState<Record<string, string>>({})

  const totalAmount = parseFloat(amount) || 0

  // 找到默认还款人（姐姐）
  const defaultPayer = members.find(m => m.name === DEFAULT_PREPAYER_NAME)

  // 当总金额变化时，将全额分配给默认还款人（仅新建模式）
  const resetAllocations = useCallback((newAmount: string) => {
    const val = parseFloat(newAmount) || 0
    if (val > 0 && defaultPayer) {
      const allocs: Record<string, string> = {}
      for (const m of members) {
        allocs[m.id] = m.id === defaultPayer.id ? val.toString() : ''
      }
      setAllocations(allocs)
    } else {
      const allocs: Record<string, string> = {}
      for (const m of members) allocs[m.id] = ''
      setAllocations(allocs)
    }
  }, [defaultPayer, members])

  // 初始化分配：编辑模式回填已有数据，新建模式初始化空
  useEffect(() => {
    if (initialData) {
      const allocs: Record<string, string> = {}
      for (const m of members) allocs[m.id] = ''
      for (const c of (initialData.contributions ?? [])) {
        allocs[c.memberId] = c.amount.toString()
      }
      setAllocations(allocs)
    } else {
      const allocs: Record<string, string> = {}
      for (const m of members) allocs[m.id] = ''
      setAllocations(allocs)
    }
  }, [members, initialData])

  const handleAmountChange = (newAmount: string) => {
    setAmount(newAmount)
    // 编辑模式下改金额不自动重置分配，保留用户已有设置
    if (!initialData) {
      resetAllocations(newAmount)
    }
  }

  const handleAllocationChange = (memberId: string, value: string) => {
    setAllocations(prev => ({ ...prev, [memberId]: value }))
  }

  const allocatedTotal = members.reduce((s, m) => s + (parseFloat(allocations[m.id] ?? '') || 0), 0)
  const remaining = totalAmount - allocatedTotal

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !amount || totalAmount <= 0) return

    const contributions: PrepaymentContribution[] = []
    for (const m of members) {
      const val = parseFloat(allocations[m.id] ?? '') || 0
      if (val > 0) {
        contributions.push({ memberId: m.id, amount: val })
      }
    }

    onSubmit({ date, amount: totalAmount, contributions })
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">提前还款月份</label>
        <input className={inputClass} type="month" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">还款总金额 (元)</label>
        <input
          className={inputClass}
          type="number"
          value={amount}
          onChange={e => handleAmountChange(e.target.value)}
          placeholder="10000"
        />
      </div>

      {/* 分摊明细 */}
      {members.length > 0 && totalAmount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">分摊明细</label>
            <span className={`text-xs font-medium ${
              Math.abs(remaining) < 0.01 ? 'text-success' : remaining > 0 ? 'text-warning' : 'text-destructive'
            }`}>
              {Math.abs(remaining) < 0.01
                ? '已分配完毕'
                : remaining > 0
                  ? `待分配 ${remaining.toFixed(2)} 元`
                  : `超出 ${Math.abs(remaining).toFixed(2)} 元`}
            </span>
          </div>
          <div className="space-y-2">
            {members.map(m => {
              const val = parseFloat(allocations[m.id] ?? '') || 0
              const pct = totalAmount > 0 && val > 0 ? ((val / totalAmount) * 100).toFixed(1) : null
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-sm w-12 shrink-0">{m.name}</span>
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    type="number"
                    placeholder="0"
                    value={allocations[m.id] ?? ''}
                    onChange={e => handleAllocationChange(m.id, e.target.value)}
                  />
                  {pct && (
                    <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">{pct}%</span>
                  )}
                </div>
              )
            })}
          </div>
          {/* 快捷操作 */}
          {defaultPayer && (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => resetAllocations(amount)}
                className="text-[11px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                全部归{DEFAULT_PREPAYER_NAME}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (members.length === 0) return
                  const per = totalAmount / members.length
                  const allocs: Record<string, string> = {}
                  for (const m of members) allocs[m.id] = per.toFixed(2)
                  setAllocations(allocs)
                }}
                className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                平均分摊
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
          取消
        </button>
        <button
          type="submit"
          disabled={totalAmount > 0 && Math.abs(remaining) >= 0.01 && members.length > 0}
          className="flex-1 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-medium active:scale-[0.97] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          {initialData ? '保存修改' : '确认提前还款'}
        </button>
      </div>
    </form>
  )
}
