import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Debt } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { aggregateCashFlow, getCurrentMonth } from '@/lib/calculations'
import { formatCurrency, formatDateShort } from '@/lib/formatters'

interface CashFlowTabProps {
  debts: Debt[]
}

type ViewMode = 'all' | 'remaining'

export function CashFlowTab({ debts }: CashFlowTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const currentMonth = getCurrentMonth()

  const allCashFlow = useMemo(() => aggregateCashFlow(debts), [debts])

  const cashFlow = useMemo(() => {
    if (viewMode === 'remaining') {
      return allCashFlow.filter(e => e.date >= currentMonth)
    }
    return allCashFlow
  }, [allCashFlow, viewMode, currentMonth])

  const chartData = useMemo(() => {
    return cashFlow.map(entry => ({
      date: formatDateShort(entry.date),
      rawDate: entry.date,
      principal: Math.round(entry.totalPrincipal),
      interest: Math.round(entry.totalInterest),
      prepayment: Math.round(entry.totalPrepayment),
    }))
  }, [cashFlow])

  const totalStats = useMemo(() => {
    const total = allCashFlow.reduce(
      (acc, e) => ({
        principal: acc.principal + e.totalPrincipal,
        interest: acc.interest + e.totalInterest,
        prepayment: acc.prepayment + e.totalPrepayment,
      }),
      { principal: 0, interest: 0, prepayment: 0 }
    )
    const paid = allCashFlow
      .filter(e => e.date <= currentMonth)
      .reduce((s, e) => s + e.totalPayment, 0)
    return { ...total, paid, totalMonths: allCashFlow.length }
  }, [allCashFlow, currentMonth])

  // Find "today" index for reference line
  const todayIdx = chartData.findIndex(d => d.rawDate >= currentMonth)
  const todayLabel = todayIdx >= 0 ? chartData[todayIdx]?.date : undefined

  if (debts.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-16 animate-fade-in">
        添加债务后即可查看现金流图表
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">现金流</h1>
        <div className="flex bg-muted rounded-lg p-0.5">
          {(['all', 'remaining'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === mode
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {mode === 'all' ? '全部' : '剩余'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">总月数</p>
          <p className="text-sm font-bold">{totalStats.totalMonths}个月</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">总还款额</p>
          <p className="text-sm font-bold">{formatCurrency(totalStats.principal + totalStats.interest + totalStats.prepayment)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">已还</p>
          <p className="text-sm font-bold text-success">{formatCurrency(totalStats.paid)}</p>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-3">月度还款分布</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 88%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(200, 10%, 46%)' }}
                  interval={Math.max(Math.floor(chartData.length / 8), 0)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(200, 10%, 46%)' }}
                  tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(150, 15%, 88%)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => {
                    const label = name === 'principal' ? '本金' : name === 'interest' ? '利息' : '提前还款'
                    return [formatCurrency(value) + '元', label]
                  }}
                />
                <Bar dataKey="principal" stackId="a" fill="hsl(168, 55%, 38%)" radius={[0, 0, 0, 0]} name="principal" />
                <Bar dataKey="interest" stackId="a" fill="hsl(38, 92%, 50%)" radius={[0, 0, 0, 0]} name="interest" />
                {chartData.some(d => d.prepayment > 0) && (
                  <Bar dataKey="prepayment" stackId="a" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} name="prepayment" />
                )}
                {viewMode === 'all' && todayLabel && (
                  <ReferenceLine
                    x={todayLabel}
                    stroke="hsl(0, 72%, 51%)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: '当前', position: 'top', fontSize: 10, fill: 'hsl(0, 72%, 51%)' }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(168, 55%, 38%)' }} />
              <span className="text-muted-foreground">本金</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(38, 92%, 50%)' }} />
              <span className="text-muted-foreground">利息</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(142, 71%, 45%)' }} />
              <span className="text-muted-foreground">提前还款</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Details */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-3">逐月明细</p>
          <div className="space-y-0 max-h-80 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-4 text-[10px] font-medium text-muted-foreground pb-1.5 border-b mb-1 sticky top-0 bg-card">
              <span>月份</span>
              <span className="text-right">本金</span>
              <span className="text-right">利息</span>
              <span className="text-right">总还款</span>
            </div>
            {cashFlow.map(entry => {
              const isPast = entry.date < currentMonth
              const isCurrent = entry.date === currentMonth
              return (
                <div
                  key={entry.date}
                  className={`grid grid-cols-4 text-[11px] py-1.5 border-b border-border/50 ${
                    isPast ? 'text-muted-foreground/60' : isCurrent ? 'text-primary font-medium bg-primary/5 rounded' : ''
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {isPast && <span className="text-success text-[8px]">&#10003;</span>}
                    {formatDateShort(entry.date)}
                  </span>
                  <span className="text-right">{formatCurrency(entry.totalPrincipal)}</span>
                  <span className="text-right">{formatCurrency(entry.totalInterest)}</span>
                  <span className="text-right font-medium">{formatCurrency(entry.totalPayment)}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
