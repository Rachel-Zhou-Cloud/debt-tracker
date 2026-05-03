import { useState, useMemo } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import type { Debt, FamilyMember, Prepayment, PrepaymentContribution } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { DebtForm } from '@/components/DebtForm'
import { DebtCard } from '@/components/DebtCard'

interface DebtsTabProps {
  debts: Debt[]
  addDebt: (debt: Omit<Debt, 'id' | 'prepayments'>) => void
  updateDebt: (id: string, updates: Partial<Omit<Debt, 'id'>>) => void
  deleteDebt: (id: string) => void
  addPrepayment: (debtId: string, data: { date: string; amount: number; contributions: PrepaymentContribution[] }) => void
  deletePrepayment: (debtId: string, prepaymentId: string) => void
  updatePrepayment: (debtId: string, prepaymentId: string, updates: Partial<Omit<Prepayment, 'id'>>) => void
  members: FamilyMember[]
  addMember: (name: string) => void
  deleteMember: (id: string) => void
}

export function DebtsTab({
  debts, addDebt, deleteDebt,
  addPrepayment, deletePrepayment, updatePrepayment,
  members, addMember,
}: DebtsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMember, setFilterMember] = useState<string>('')
  const [showMemberInput, setShowMemberInput] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  const filteredDebts = useMemo(() => {
    let result = debts
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(d => d.lender.toLowerCase().includes(q))
    }
    if (filterMember) {
      result = result.filter(d => d.nominalDebtorId === filterMember || d.actualDebtorId === filterMember)
    }
    return result
  }, [debts, searchQuery, filterMember])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">我的债务</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" /> 添加
        </button>
      </div>

      {/* Search & Filter */}
      {debts.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="搜索债务..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Family member filter */}
          {members.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterMember('')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !filterMember ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                全部
              </button>
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setFilterMember(filterMember === m.id ? '' : m.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterMember === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {/* Add member */}
          <div className="flex items-center gap-2">
            {showMemberInput ? (
              <div className="flex gap-2 flex-1">
                <input
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-card text-xs"
                  placeholder="成员名称"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (newMemberName.trim()) {
                      addMember(newMemberName.trim())
                      setNewMemberName('')
                      setShowMemberInput(false)
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs"
                >
                  添加
                </button>
                <button onClick={() => setShowMemberInput(false)} className="px-2 text-xs text-muted-foreground">
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMemberInput(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Users className="w-3 h-3" /> 管理家庭成员
              </button>
            )}
          </div>
        </div>
      )}

      {/* Debt List */}
      <div className="space-y-3">
        {filteredDebts.map(debt => (
          <DebtCard
            key={debt.id}
            debt={debt}
            members={members}
            onDelete={deleteDebt}
            onAddPrepayment={addPrepayment}
            onDeletePrepayment={deletePrepayment}
            onUpdatePrepayment={updatePrepayment}
          />
        ))}
      </div>

      {filteredDebts.length === 0 && debts.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">没有匹配的债务记录</p>
      )}

      {debts.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">还没有债务记录，点击上方「添加」开始</p>
      )}

      <Modal open={showAddForm} onClose={() => setShowAddForm(false)} title="添加债务">
        <DebtForm
          onSubmit={debt => {
            addDebt(debt)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
          members={members}
        />
      </Modal>
    </div>
  )
}
