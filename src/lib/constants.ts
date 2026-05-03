import type { Milestone } from '@/types'

export const MOTIVATIONAL_MESSAGES: { max: number; message: string }[] = [
  { max: 0, message: '记录债务是掌控财务的第一步' },
  { max: 10, message: '刚刚开始，每一步都算数' },
  { max: 20, message: '坚持就是胜利，继续加油！' },
  { max: 30, message: '已经还了不少了，保持节奏' },
  { max: 40, message: '快到一半了，曙光就在前方' },
  { max: 50, message: '半程达成！后半段会越来越轻松' },
  { max: 60, message: '过了一大半，胜利在望' },
  { max: 75, message: '冲刺阶段，再坚持一下！' },
  { max: 90, message: '就差一点点了，终点近在眼前' },
  { max: 99, message: '几乎清零了！最后的冲刺！' },
  { max: 100, message: '恭喜！债务已清零！' },
]

export function getMotivationalMessage(percentage: number): string {
  for (const item of MOTIVATIONAL_MESSAGES) {
    if (percentage <= item.max) return item.message
  }
  return MOTIVATIONAL_MESSAGES[MOTIVATIONAL_MESSAGES.length - 1]!.message
}

export const MILESTONES: Milestone[] = [
  { threshold: 10, label: '迈出第一步！', emoji: '🌱' },
  { threshold: 25, label: '四分之一达成！', emoji: '💪' },
  { threshold: 50, label: '半程里程碑！', emoji: '🎉' },
  { threshold: 75, label: '还剩最后四分之一！', emoji: '🔥' },
  { threshold: 90, label: '冲刺阶段！', emoji: '⭐' },
  { threshold: 100, label: '债务清零！自由了！', emoji: '🏆' },
]

export const PIE_COLORS = [
  'hsl(168, 55%, 38%)',
  'hsl(38, 92%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(200, 70%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(340, 65%, 50%)',
  'hsl(20, 80%, 50%)',
  'hsl(60, 70%, 45%)',
]

export const STORAGE_KEYS = {
  DEBTS: 'debt-tracker-data',
  FAMILY: 'debt-tracker-family-members',
  MILESTONES: 'debt-tracker-milestones',
} as const

export const DEFAULT_PREPAYER_NAME = '姐姐'
