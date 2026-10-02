import { Badge } from '@/design-system/components/data'
import type { InvoiceStatus } from './types'

/* Shared billing pills — text first, never color-only. */

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }): React.JSX.Element {
  const tone =
    status === 'paid'
      ? 'success'
      : status === 'pending'
        ? 'warning'
        : status === 'failed'
          ? 'danger'
          : 'neutral'
  const label =
    status === 'paid'
      ? 'Paid'
      : status === 'pending'
        ? 'Pending'
        : status === 'failed'
          ? 'Failed'
          : 'Draft'
  return <Badge tone={tone}>{label}</Badge>
}
