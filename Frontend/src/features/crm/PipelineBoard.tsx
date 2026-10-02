import { Link } from 'react-router'
import { Avatar, Badge } from '@/design-system/components/data'
import type { CrmRecord } from './types'
import { STAGE_ORDER } from './types'
import { StageBadge } from './stageUi'

/* Pipeline: 5 lifecycle stages, keyboard-first moves (no DnD lib).
   DnD decision: HTML5 drag is pointer-only; select-based moves keep
   keyboard + screen-reader parity, so moves use labeled selects. */

export function PipelineBoard({
  records,
  onMove,
}: {
  records: CrmRecord[]
  onMove: (id: string, stage: CrmRecord['stage']) => void
}): React.JSX.Element {
  return (
    <div className="crm-pipeline" role="group" aria-label="Lead pipeline">
      {STAGE_ORDER.map(stage => {
        const cards = records.filter(r => r.stage === stage)
        return (
          <section key={stage} aria-labelledby={`pipe-${stage}`} className="crm-pipe-col">
            <h3 id={`pipe-${stage}`} className="wx-h4">
              {stage} · {cards.length}
            </h3>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {cards.length === 0 && (
                <li className="wx-caption" style={{ padding: '8px 4px' }}>
                  No leads here.
                </li>
              )}
              {cards.map(r => (
                <li key={r.id} className="crm-pipe-card">
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Avatar name={r.name} size="sm" />
                    <Link
                      to={`/contacts/${r.id}`}
                      className="wx-label"
                      style={{ textDecoration: 'none' }}
                    >
                      {r.name}
                    </Link>
                  </span>
                  <span className="wx-caption">
                    {r.assignedTo ?? 'Unassigned'} · {r.lastActivity}
                  </span>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StageBadge stage={r.stage} />
                    {r.tags.slice(0, 2).map(t => (
                      <Badge key={t} tone="neutral">
                        #{t}
                      </Badge>
                    ))}
                  </span>
                  <label className="wx-caption">
                    Move to
                    <select
                      className="wx-select"
                      value={r.stage}
                      onChange={e => onMove(r.id, e.target.value as CrmRecord['stage'])}
                      aria-label={`Move ${r.name} to stage`}
                      style={{ minHeight: 32, marginTop: 4 }}
                    >
                      {STAGE_ORDER.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
