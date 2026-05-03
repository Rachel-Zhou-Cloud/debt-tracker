import { useState, useEffect, useMemo, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import type { Debt } from '@/types'
import { calculateDebtSummary } from '@/lib/calculations'
import { MILESTONES, STORAGE_KEYS } from '@/lib/constants'

interface MilestoneToastProps {
  debts: Debt[]
}

function loadSeenMilestones(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MILESTONES)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return []
}

function saveSeenMilestones(seen: number[]) {
  localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(seen))
}

export function MilestoneToast({ debts }: MilestoneToastProps) {
  const [visible, setVisible] = useState(false)
  const [currentMilestone, setCurrentMilestone] = useState<typeof MILESTONES[number] | null>(null)
  const [seenMilestones, setSeenMilestones] = useState<number[]>(loadSeenMilestones)

  const summary = useMemo(() => calculateDebtSummary(debts), [debts])

  const checkMilestones = useCallback(() => {
    if (debts.length === 0) return

    for (const milestone of MILESTONES) {
      if (summary.percentage >= milestone.threshold && !seenMilestones.includes(milestone.threshold)) {
        setCurrentMilestone(milestone)
        setVisible(true)

        const updated = [...seenMilestones, milestone.threshold]
        setSeenMilestones(updated)
        saveSeenMilestones(updated)
        break
      }
    }
  }, [debts.length, summary.percentage, seenMilestones])

  useEffect(() => {
    checkMilestones()
  }, [checkMilestones])

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!visible || !currentMilestone) return null

  const isComplete = currentMilestone.threshold === 100

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex justify-center p-4 animate-slide-down"
      onClick={() => setVisible(false)}
    >
      <div className={`w-full max-w-sm rounded-2xl shadow-elevated p-4 ${
        isComplete ? 'gradient-warm' : 'gradient-hero'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-2xl">{currentMilestone.emoji}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white/80" />
              <p className="text-sm font-bold text-white">
                {summary.percentage.toFixed(0)}% 里程碑!
              </p>
            </div>
            <p className="text-xs text-white/80 mt-0.5">{currentMilestone.label}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
