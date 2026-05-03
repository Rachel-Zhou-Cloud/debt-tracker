import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Trash2, Plus, Banknote, Pencil } from 'lucide-react'
import type { Debt, FamilyMember, Prepayment, PrepaymentContribution } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PrepaymentForm } from '@/components/PrepaymentForm'
import { generateAmortizationSchedule, calculateTotalInterest, getCurrentMonth } from '@/lib/calculations'
import { formatCurrency, formatDate, formatRate, methodName } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface DebtCardProps {
  debt: Debt
  members: FamilyMember[]
  onDelete: (id: string) => void
  onAddPrepayment: (debtId: string, data: { date: string; amount: number; contributions: PrepaymentContribution[] }) => void
  onDeletePrepayment: (debtId: string, prepaymentId: string) => void
  onUpdatePrepayment: (debtId: string, prepaymentId: string, updates: Partial<Omit<Prepayment, 'id'>>) => void
}

export function DebtCard({ debt, members, onDelete, onAddPrepayment, onDeletePrepayment, onUpdatePrepayment }: DebtCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showPrepayForm, setShowPrepayForm] = useState(false)
  const [editingPrepayment, setEditingPrepayment] = useState<Prepayment | null>(null)

  const schedule = useMemo(() => generateAmortizationSchedule(debt), [debt])
  const totalInterest = useMemo(() => calculateTotalInterest(debt), [debt])
  const currentMonth = getCurrentMonth()

  const totalPaid = schedule
    .filter(e => e.date <= currentMonth)
    .reduce((s, e) => s + e.payment + e.prepayment, 0)

  const totalAmount = debt.principal + totalInterest
  const progress = totalAmount > 0 ? Math.min((totalPaid / totalAmount) * 100, 100) : 0

  const member = members.find(m => m.id === debt.nominalDebtorId)
  const actualMember = members.find(m => m.id === debt.actualDebtorId)

  return (
    <>
      <Card className="overflow-hidden animate-fade-in">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{debt.lender}</h3>
                {member && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">名义: {member.name}</span>
                )}
                {actualMember && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">实际: {actualMember.name}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{methodName(debt.method)} | {formatRate(debt.annualRate)} | {debt.totalPeriods}期</p>
            </div>
            <button onClick={() => onDelete(debt.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4 text-destructive/60" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground">本金</p>
              <p className="text-sm font-semibold">{formatCurrency(debt.principal)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">总利息</p>
              <p className="text-sm font-semibold text-warning">{formatCurrency(totalInterest)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">已还</p>
              <p className="text-sm font-semibold text-success">{formatCurrency(totalPaid)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div className="h-full gradient-progress rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{formatDate(debt.startDate)} 开始</span>
            <span>{progress.toFixed(1)}%</span>
          </div>

          {/* Prepayments */}
          {debt.prepayments.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                <Banknote className="w-3 h-3" />
                提前还款记录
              </p>
              {debt.prepayments.map(p => {
                const contribs = p.contributions ?? []
                return (
                  <div key={p.id} className="py-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{formatDate(p.date)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-success">-{formatCurrency(p.amount)}</span>
                        <button onClick={() => setEditingPrepayment(p)} className="text-muted-foreground/50 hover:text-primary">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => onDeletePrepayment(debt.id, p.id)} className="text-destructive/50 hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {contribs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {contribs.map(c => {
                          const m = members.find(m => m.id === c.memberId)
                          return (
                            <span key={c.memberId} className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success">
                              {m?.name ?? '未知'} {formatCurrency(c.amount)}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowPrepayForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3 h-3" /> 提前还款
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              还款明细 {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Amortization Schedule - Full Timeline */}
        {expanded && (
          <CardContent className="bg-muted/30 border-t pt-3">
            <div className="space-y-0.5 max-h-64 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-5 text-[10px] font-medium text-muted-foreground pb-1 border-b mb-1">
                <span>月份</span>
                <span className="text-right">本金</span>
                <span className="text-right">利息</span>
                <span className="text-right">月供</span>
                <span className="text-right">余额</span>
              </div>
              {schedule.map(entry => {
                const isPast = entry.date < currentMonth
                const isCurrent = entry.date === currentMonth
                return (
                  <div
                    key={entry.date}
                    className={cn(
                      'grid grid-cols-5 text-[11px] py-1 rounded',
                      isPast && 'text-muted-foreground/60',
                      isCurrent && 'bg-primary/10 font-medium text-primary',
                      !isPast && !isCurrent && 'text-foreground',
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {isPast && <span className="text-success text-[8px]">&#10003;</span>}
                      {formatDate(entry.date).replace(/^\d{4}/, y => y.slice(2))}
                    </span>
                    <span className="text-right">{entry.principal.toFixed(0)}</span>
                    <span className="text-right">{entry.interest.toFixed(0)}</span>
                    <span className="text-right">{(entry.payment + entry.prepayment).toFixed(0)}</span>
                    <span className="text-right">{formatCurrency(entry.remaining)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      <Modal open={showPrepayForm} onClose={() => setShowPrepayForm(false)} title="添加提前还款">
        <PrepaymentForm
          members={members}
          onSubmit={data => {
            onAddPrepayment(debt.id, data)
            setShowPrepayForm(false)
          }}
          onCancel={() => setShowPrepayForm(false)}
        />
      </Modal>

      <Modal open={!!editingPrepayment} onClose={() => setEditingPrepayment(null)} title="编辑提前还款">
        {editingPrepayment && (
          <PrepaymentForm
            members={members}
            initialData={editingPrepayment}
            onSubmit={data => {
              onUpdatePrepayment(debt.id, editingPrepayment.id, data)
              setEditingPrepayment(null)
            }}
            onCancel={() => setEditingPrepayment(null)}
          />
        )}
      </Modal>
    </>
  )
}
