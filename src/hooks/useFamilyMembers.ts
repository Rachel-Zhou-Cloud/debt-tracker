import { useState, useCallback, useEffect } from 'react'
import type { FamilyMember } from '@/types'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/constants'

const DEFAULT_MEMBER_NAMES = ['爸爸', '妈妈', '姐姐', '弟弟']

function createDefaultMembers(): FamilyMember[] {
  return DEFAULT_MEMBER_NAMES.map(name => ({ id: generateId(), name }))
}

function loadMembers(): FamilyMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAMILY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  const defaults = createDefaultMembers()
  localStorage.setItem(STORAGE_KEYS.FAMILY, JSON.stringify(defaults))
  return defaults
}

function saveMembers(members: FamilyMember[]) {
  localStorage.setItem(STORAGE_KEYS.FAMILY, JSON.stringify(members))
}

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>(loadMembers)

  useEffect(() => {
    saveMembers(members)
  }, [members])

  const addMember = useCallback((name: string) => {
    setMembers(prev => [...prev, { id: generateId(), name }])
  }, [])

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
  }, [])

  return { members, addMember, deleteMember }
}
