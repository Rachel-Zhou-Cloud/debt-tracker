import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { Debt, FamilyMember } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { calculateTotalInterest, generateAmortizationSchedule, getCurrentMonth } from '@/lib/calculations'
import { formatCurrency, formatRate, methodName } from '@/lib/formatters'
import { PIE_COLORS } from '@/lib/constants'

interface AnalysisTabProps {
  debts: Debt[]
  members: FamilyMember[]
}

export function AnalysisTab({ debts, members }: AnalysisTabProps) {
  const debtComposition = useMemo(() => {
    return debts.map((d, i) => ({
      name: d.lender,
      value: d.principal,
      color: PIE_COLORS[i % PIE_COLORS.length]!,
    }))
  }, [debts])

  const interestData = useMemo(() => {
    return debts.map((d, i) => ({
      name: d.lender,
      value: Math.round(calculateTotalInterest(d)),
      color: PIE_COLORS[i % PIE_COLORS.length]!,
      rate: d.annualRate,
    })).sort((a, b) => b.value - a.value)
  }, [debts])

  const methodBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of debts) {
      const key = methodName(d.method)
      map.set(key, (map.get(key) ?? 0) + d.principal)
    }
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length]!,
    }))
  }, [debts])

  const totalStats = useMemo(() => {
    const totalPrincipal = debts.reduce((s, d) => s + d.principal, 0)
    const totalInterest = debts.reduce((s, d) => s + calculateTotalInterest(d), 0)
    const totalMonths = debts.reduce((max, d) => {
      const schedule = generateAmortizationSchedule(d)
      return Math.max(max, schedule.length)
    }, 0)
    const avgRate = debts.length > 0
      ? debts.reduce((s, d) => s + d.annualRate * d.principal, 0) / totalPrincipal
      : 0
    return { totalPrincipal, totalInterest, totalMonths, avgRate, debtCount: debts.length }
  }, [debts])

  // 家庭成员提前还款贡献率统计
  const memberContribution = useMemo(() => {
    const map = new Map<string, number>()
    let totalPrepaid = 0
    for (const d of debts) {
      for (const p of d.prepayments) {
        totalPrepaid += p.amount
        const contribs = p.contributions ?? []
        if (contribs.length > 0) {
          for (const c of contribs) {
            map.set(c.memberId, (map.get(c.memberId) ?? 0) + c.amount)
          }
        } else {
          map.set('__unspecified__', (map.get('__unspecified__') ?? 0) + p.amount)
        }
      }
    }
    const result = Array.from(map.entries()).map(([id, amount], i) => {
      const m = members.find(m => m.id === id)
      return {
        name: m ? m.name : '未指定',
        amount,
        ratio: totalPrepaid > 0 ? amount / totalPrepaid : 0,
        color: PIE_COLORS[i % PIE_COLORS.length]!,
      }
    }).sort((a, b) => b.amount - a.amount)
    return { items: result, total: totalPrepaid }
  }, [debts, members])

  // 债务权属分析 — 按实际债务人统计
  const debtOwnership = useMemo(() => {
    const currentMonth = getCurrentMonth()
    const map = new Map<string, { principal: number; remaining: number }>()
    for (const d of debts) {
      const key = d.actualDebtorId || '__unspecified__'
      const entry = map.get(key) ?? { principal: 0, remaining: 0 }
      entry.principal += d.principal
      const schedule = generateAmortizationSchedule(d)
      const currentEntry = schedule.filter(e => e.date <= currentMonth).pop()
      entry.remaining += currentEntry ? currentEntry.remaining : d.principal
      map.set(key, entry)
    }
    return Array.from(map.entries()).map(([id, data], i) => {
      const m = members.find(m => m.id === id)
      return {
        name: m ? m.name : '未指定',
        ...data,
        color: PIE_COLORS[i % PIE_COLORS.length]!,
      }
    }).sort((a, b) => b.principal - a.principal)
  }, [debts, members])

  if (debts.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-16 animate-fade-in">
        添加债务后即可查看分析报告
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold">分析报告</h1>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">总借款</p>
          <p className="text-lg font-bold">{formatCurrency(totalStats.totalPrincipal)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">总利息</p>
          <p className="text-lg font-bold text-warning">{formatCurrency(totalStats.totalInterest)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">加权平均利率</p>
          <p className="text-lg font-bold">{formatRate(totalStats.avgRate)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">债务笔数</p>
          <p className="text-lg font-bold">{totalStats.debtCount} 笔</p>
        </Card>
      </div>

      {/* Debt Composition Pie */}
      {debtComposition.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-semibold mb-3">本金构成</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={debtComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {debtComposition.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value) + '元', '本金']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {debtComposition.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interest Ranking */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-3">利息排行</p>
          <div className="space-y-2">
            {interestData.map((item, idx) => {
              const maxInterest = interestData[0]?.value ?? 1
              const width = maxInterest > 0 ? (item.value / maxInterest) * 100 : 0
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-warning font-semibold">{formatCurrency(item.value)}元</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${width}%`, background: item.color }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">利率 {formatRate(item.rate)}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Method Breakdown */}
      {methodBreakdown.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-semibold mb-3">还款方式构成</p>
            <div className="space-y-2">
              {methodBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.value)}元</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 家庭成员提前还款贡献率 */}
      {memberContribution.items.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-semibold mb-1">提前还款贡献率</p>
            <p className="text-[10px] text-muted-foreground mb-3">总提前还款 {formatCurrency(memberContribution.total)}元</p>
            {memberContribution.items.length > 1 && (
              <div className="h-48 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={memberContribution.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="amount"
                      paddingAngle={2}
                    >
                      {memberContribution.items.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value) + '元', '还款']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              {memberContribution.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.amount)}元 <span className="text-muted-foreground font-normal">({(item.ratio * 100).toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.ratio * 100}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 债务权属分析 */}
      {debtOwnership.length > 0 && debtOwnership.some(d => d.name !== '未指定') && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-semibold mb-3">债务权属分析 (实际债务人)</p>
            <div className="space-y-3">
              {debtOwnership.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">总借款</p>
                      <p className="text-sm font-semibold">{formatCurrency(item.principal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">剩余</p>
                      <p className="text-sm font-semibold text-warning">{formatCurrency(item.remaining)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
