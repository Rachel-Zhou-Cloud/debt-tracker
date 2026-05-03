import { useState } from 'react'
import { LayoutDashboard, List, ChartColumn, ChartPie } from 'lucide-react'
import { useDebts } from '@/hooks/useDebts'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { OverviewTab } from '@/components/tabs/OverviewTab'
import { DebtsTab } from '@/components/tabs/DebtsTab'
import { CashFlowTab } from '@/components/tabs/CashFlowTab'
import { AnalysisTab } from '@/components/tabs/AnalysisTab'
import { MilestoneToast } from '@/components/MilestoneToast'
import { cn } from '@/lib/utils'

const TABS = [
  { label: '总览', icon: LayoutDashboard },
  { label: '债务', icon: List },
  { label: '现金流', icon: ChartColumn },
  { label: '分析', icon: ChartPie },
] as const

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const debtActions = useDebts()
  const familyActions = useFamilyMembers()

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-lg mx-auto pb-20">
        <div className="p-4">
          {activeTab === 0 && <OverviewTab debts={debtActions.debts} />}
          {activeTab === 1 && (
            <DebtsTab
              {...debtActions}
              members={familyActions.members}
              addMember={familyActions.addMember}
              deleteMember={familyActions.deleteMember}
            />
          )}
          {activeTab === 2 && <CashFlowTab debts={debtActions.debts} />}
          {activeTab === 3 && <AnalysisTab debts={debtActions.debts} members={familyActions.members} />}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-md border-t safe-bottom">
        <div className="max-w-lg mx-auto flex">
          {TABS.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors',
                activeTab === idx ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Milestone Celebration */}
      <MilestoneToast debts={debtActions.debts} />
    </div>
  )
}
