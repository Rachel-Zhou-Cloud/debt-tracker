import { useState, useCallback, useEffect } from 'react'
import type { Debt, Prepayment } from '@/types'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/constants'

function loadDebts(): Debt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return []
}

function saveDebts(debts: Debt[]) {
  localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts))
}

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>(loadDebts)

  useEffect(() => {
    saveDebts(debts)
  }, [debts])

  const addDebt = useCallback((debt: Omit<Debt, 'id' | 'prepayments'>) => {
    setDebts(prev => [...prev, { ...debt, id: generateId(), prepayments: [] }])
  }, [])

  const updateDebt = useCallback((id: string, updates: Partial<Omit<Debt, 'id'>>) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  }, [])

  const deleteDebt = useCallback((id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id))
  }, [])

  const addPrepayment = useCallback((debtId: string, prepayment: Omit<Prepayment, 'id'>) => {
    setDebts(prev => prev.map(d => {
      if (d.id !== debtId) return d
      return { ...d, prepayments: [...d.prepayments, { ...prepayment, id: generateId() }] }
    }))
  }, [])

  const deletePrepayment = useCallback((debtId: string, prepaymentId: string) => {
    setDebts(prev => prev.map(d => {
      if (d.id !== debtId) return d
      return { ...d, prepayments: d.prepayments.filter(p => p.id !== prepaymentId) }
    }))
  }, [])

  const updatePrepayment = useCallback((debtId: string, prepaymentId: string, updates: Partial<Omit<Prepayment, 'id'>>) => {
    setDebts(prev => prev.map(d => {
      if (d.id !== debtId) return d
      return {
        ...d,
        prepayments: d.prepayments.map(p => p.id === prepaymentId ? { ...p, ...updates } : p),
      }
    }))
  }, [])

  return { debts, addDebt, updateDebt, deleteDebt, addPrepayment, deletePrepayment, updatePrepayment }
}
