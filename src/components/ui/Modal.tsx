import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative z-50 w-full max-w-lg bg-card rounded-t-2xl shadow-elevated animate-slide-up max-h-[85vh] overflow-y-auto',
        className
      )}>
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
