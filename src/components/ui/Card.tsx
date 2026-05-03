import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex flex-col space-y-1.5 p-4 pb-2', className)}>{children}</div>
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-4 pt-0', className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex items-center p-4 pt-0', className)}>{children}</div>
}
