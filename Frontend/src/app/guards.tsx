import type { ReactNode } from 'react'

/* Route guard seams. Real auth/RBAC wiring arrives with auth stage. */

export function RequireAuth({ children }: { children: ReactNode }): React.JSX.Element {
  return <>{children}</>
}

export function RequireRole({
  children,
}: {
  children: ReactNode
  roles?: string[]
}): React.JSX.Element {
  return <>{children}</>
}
