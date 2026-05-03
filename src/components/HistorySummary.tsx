import { useMemo } from 'react'
import { TrendingDown, Calendar } from 'lucide-react'
import type { Debt } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { calculatePaidSoFar, getCurrentMonth, generateAmortizationSchedule } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'

interface HistorySummaryProps {
  debts: Debt[]
}

export function HistorySummary({ debts }: HistorySummaryProps) {
  const stats = useMemo(() => {
    let totalPaidPrincipal = 0
    let totalPaidInterest = 0
    let totalPaidMonths = 0
    let totalRemainingMonths = 0
    const current = getCurrentMonth()

    for (const d of debts) {
      const paid = calculatePaidSoFar(d)
      totalPaidPrincipal += paid.paidPrincipal
      totalPaidInterest += paid.paidInterest
      totalPaidMonths = Math.max(totalPaidMonths, paid.paidMonths)

      const schedule = generateAmortizationSchedule(d)
      const remaining = schedule.filter(e => e.date > current).length
      totalRemainingMonths = Math.max(totalRemainingMonths, remaining)
    }

    return { totalPaidPrincipal, totalPaidInterest, totalPaidMonths, totalRemainingMonths }
  }, [debts])

  if (debts.length === 0 || stats.totalPaidMonths === 0) return null

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-success" />
          <p className="text-sm font-semibold">历史还款汇总</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">累计已还本金</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(stats.totalPaidPrincipal)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">累计已还利息</p>
            <p className="text-sm font-bold text-warning">{formatCurrency(stats.totalPaidInterest)}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>已还 <strong className="text-foreground">{stats.totalPaidMonths}</strong> 个月</span>
          </div>
          <span className="text-border">|</span>
          <span>剩余 <strong className="text-foreground">{stats.totalRemainingMonths}</strong> 个月</span>
        </div>
      </CardContent>
    </Card>
  )
}
