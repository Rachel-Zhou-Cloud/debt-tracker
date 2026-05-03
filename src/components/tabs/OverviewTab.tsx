import { useMemo } from 'react'
import { Calendar, TrendingUp, Lightbulb, Target, Sparkles, Banknote } from 'lucide-react'
import type { Debt } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { HistorySummary } from '@/components/HistorySummary'
import {
  calculateDebtSummary,
  getEstimatedPayoffDate,
  sortByAvalanche,
  generateAmortizationSchedule,
  getCurrentMonth,
  calculateTotalInterestSaved,
} from '@/lib/calculations'
import { formatCurrency, formatDate, formatRate } from '@/lib/formatters'
import { getMotivationalMessage } from '@/lib/constants'

interface OverviewTabProps {
  debts: Debt[]
}

export function OverviewTab({ debts }: OverviewTabProps) {
  const summary = useMemo(() => calculateDebtSummary(debts), [debts])
  const payoffDate = useMemo(() => getEstimatedPayoffDate(debts), [debts])
  const message = useMemo(() => getMotivationalMessage(summary.percentage), [summary.percentage])
  const interestSaved = useMemo(() => calculateTotalInterestSaved(debts), [debts])

  const activeDebts = useMemo(() => {
    const current = getCurrentMonth()
    return sortByAvalanche(debts).filter(d => {
      const schedule = generateAmortizationSchedule(d)
      const last = schedule[schedule.length - 1]
      return last && last.date >= current
    })
  }, [debts])

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mb-6">
          <Target className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">开始你的债务清零之旅</h2>
        <p className="text-muted-foreground text-sm text-center max-w-[260px]">
          记录每一笔债务是掌控财务的第一步，点击下方「债务」Tab 添加你的第一笔记录
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Card */}
      <Card className="overflow-hidden border-0">
        <div className="gradient-hero p-5 pb-4">
          <p className="text-primary-foreground/80 text-xs font-medium mb-1">剩余待还</p>
          <p className="text-3xl font-bold text-primary-foreground tracking-tight">
            {formatCurrency(summary.remaining)}
            <span className="text-sm font-normal ml-1">元</span>
          </p>
          {payoffDate && (
            <p className="text-primary-foreground/70 text-xs mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              预计 {formatDate(payoffDate)} 全部还清
            </p>
          )}
        </div>
        <CardContent className="pt-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">还款进度</span>
              <span className="font-semibold text-primary">{summary.percentage.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full gradient-progress rounded-full transition-all duration-1000"
                style={{ width: `${summary.percentage}%` }}
              />
            </div>
          </div>

          {/* Motivational Message */}
          <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-2.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-primary font-medium">{message}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">已还本金</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(summary.totalPaid - (summary.totalPaid - summary.totalPrepaid > 0 ? summary.totalInterest * (summary.percentage / 100) : 0))}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">已还利息</p>
          <p className="text-sm font-bold text-warning">{formatCurrency(summary.totalInterest * (summary.percentage / 100))}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">提前还款</p>
          <p className="text-sm font-bold text-success">{formatCurrency(summary.totalPrepaid)}</p>
        </Card>
      </div>

      {/* Historical Summary */}
      <HistorySummary debts={debts} />

      {/* Interest Saved */}
      {interestSaved > 0 && (
        <Card className="overflow-hidden border-0">
          <div className="gradient-warm p-4 flex items-center gap-3">
            <Banknote className="w-8 h-8 text-accent-foreground shrink-0" />
            <div>
              <p className="text-accent-foreground/80 text-xs">提前还款已为你节省</p>
              <p className="text-xl font-bold text-accent-foreground">{formatCurrency(interestSaved)} 元利息</p>
            </div>
          </div>
        </Card>
      )}

      {/* Avalanche Recommendation */}
      {activeDebts.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-accent" />
              <p className="text-sm font-semibold">雪崩法建议</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              优先偿还利率最高的债务，可以节省更多利息
            </p>
            {activeDebts.slice(0, 3).map((debt, idx) => (
              <div key={debt.id} className="flex items-center justify-between py-2 border-t first:border-t-0">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0 ? 'gradient-warm text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium">{debt.lender}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-destructive" />
                  <span className="font-semibold text-destructive">{formatRate(debt.annualRate)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
