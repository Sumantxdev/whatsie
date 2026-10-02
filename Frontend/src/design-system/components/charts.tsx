import { useId, useState } from 'react'
import { cx } from '../utils'

/* Shared SVG visualization primitives. Token-driven, zero dependencies.
   Every chart ships an accessible text summary — never visuals-only. */

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  labelledBy,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  labelledBy?: string
}): React.JSX.Element {
  return (
    <section aria-labelledby={labelledBy} className="wx-chart-card">
      <div className="wx-chart-head">
        <div>
          <h3 className="wx-h3">{title}</h3>
          {subtitle && <p className="wx-caption">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export interface LineSeries {
  label: string
  color: string
  values: number[]
}

function srOnlyStyle(): React.CSSProperties {
  return {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  }
}

export function LineChart({
  series,
  labels,
  height = 180,
  summary,
}: {
  series: LineSeries[]
  labels: string[]
  height?: number
  summary: string
}): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId()
  const W = 560
  const H = height
  const PAD = { l: 36, r: 12, t: 12, b: 26 }
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const x = (i: number): number =>
    PAD.l + (i / Math.max(1, labels.length - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number): number => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
  const path = (values: number[]): string =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const ticks = [0, 0.5, 1].map(f => Math.round(max * f))

  return (
    <div className="wx-chart" role="img" aria-label={summary}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} aria-hidden="true">
        {ticks.map(t => (
          <g key={t}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
            <text
              x={PAD.l - 6}
              y={y(t) + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--text-muted)"
            >
              {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}
            </text>
          </g>
        ))}
        {series.map(s => (
          <path
            key={s.label}
            d={path(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
        {series.map(s =>
          s.values.map((v, i) => (
            <circle
              key={`${s.label}-${i}`}
              cx={x(i)}
              cy={y(v)}
              r={hover === i ? 5 : 3}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={1.5}
              tabIndex={0}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
            >
              <title>{`${labels[i]} · ${s.label}: ${v.toLocaleString()}`}</title>
            </circle>
          ))
        )}
        {labels.map((l, i) =>
          i % Math.ceil(labels.length / 6) === 0 ? (
            <text
              key={`${gid}-${i}`}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-muted)"
            >
              {l}
            </text>
          ) : null
        )}
      </svg>
      {hover !== null && labels[hover] !== undefined && (
        <div className="wx-chart-tip" role="status">
          <strong>{labels[hover]}</strong>
          {series.map(s => (
            <span key={s.label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: 999, background: s.color }}
              />
              {s.label}: {s.values[hover]?.toLocaleString() ?? '—'}
            </span>
          ))}
        </div>
      )}
      <div style={srOnlyStyle()}>
        <p>{summary}</p>
        <table>
          <caption>Chart data</caption>
          <tbody>
            {labels.map((l, i) => (
              <tr key={l}>
                <th scope="row">{l}</th>
                {series.map(s => (
                  <td key={s.label}>{`${s.label}: ${s.values[i] ?? 0}`}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="wx-chart-legend" aria-hidden="true">
        {series.map(s => (
          <span key={s.label} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 10, height: 3, borderRadius: 2, background: s.color }} />
            <span className="wx-caption">{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export interface BarItem {
  label: string
  value: number
  hint?: string
  color?: string
}

export function BarChart({
  bars,
  summary,
  max: maxProp,
}: {
  bars: BarItem[]
  summary: string
  max?: number
}): React.JSX.Element {
  const max = maxProp ?? Math.max(1, ...bars.map(b => b.value))
  return (
    <div className="wx-chart" role="img" aria-label={summary}>
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
        {bars.map(b => (
          <li
            key={b.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr 64px',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <span
              className="wx-body-sm"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {b.label}
            </span>
            <span
              style={{
                height: 10,
                borderRadius: 999,
                background: 'var(--surface-active)',
                overflow: 'hidden',
              }}
            >
              <span
                tabIndex={0}
                role="img"
                aria-label={`${b.label}: ${b.value.toLocaleString()}${b.hint ? ` · ${b.hint}` : ''}`}
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${Math.round((b.value / max) * 100)}%`,
                  background: b.color ?? 'var(--accent-primary)',
                  borderRadius: 999,
                }}
              >
                <title>{`${b.label}: ${b.value.toLocaleString()}${b.hint ? ` · ${b.hint}` : ''}`}</title>
              </span>
            </span>
            <span className="wx-label" style={{ textAlign: 'right' }}>
              {b.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      <div style={srOnlyStyle()}>
        <p>{summary}</p>
      </div>
    </div>
  )
}

export function DonutChart({
  segments,
  summary,
  centerLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  summary: string
  centerLabel: string
}): React.JSX.Element {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const R = 54
  const C = 2 * Math.PI * R
  const arcs = segments.reduce<Array<(typeof segments)[number] & { frac: number; start: number }>>(
    (out, s, i) => {
      const frac = total === 0 ? 0 : s.value / total
      const start = i === 0 ? 0 : (out[i - 1]?.start ?? 0) + (out[i - 1]?.frac ?? 0) * 360
      return [...out, { ...s, frac, start }]
    },
    []
  )
  return (
    <div
      className="wx-chart"
      role="img"
      aria-label={summary}
      style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
    >
      <svg
        viewBox="0 0 140 140"
        width={140}
        height={140}
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <circle cx={70} cy={70} r={R} fill="none" stroke="var(--surface-active)" strokeWidth={18} />
        {arcs.map(s => {
          const dash = `${(s.frac * C).toFixed(1)} ${(C - s.frac * C).toFixed(1)}`
          return (
            <circle
              key={s.label}
              cx={70}
              cy={70}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={18}
              strokeDasharray={dash}
              transform={`rotate(${-90 + s.start} 70 70)`}
            >
              <title>{`${s.label}: ${s.value.toLocaleString()}`}</title>
            </circle>
          )
        })}
        <text
          x={70}
          y={66}
          textAnchor="middle"
          fontSize={16}
          fontWeight={700}
          fill="var(--text-primary)"
        >
          {total.toLocaleString()}
        </text>
        <text x={70} y={84} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
          {centerLabel}
        </text>
      </svg>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {segments.map(s => (
          <li
            key={s.label}
            className={cx('wx-body-sm')}
            style={{ display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <span
              aria-hidden="true"
              style={{ width: 10, height: 10, borderRadius: 3, background: s.color }}
            />
            {s.label}:{' '}
            <strong>{total === 0 ? '0%' : `${Math.round((s.value / total) * 100)}%`}</strong>
            <span className="wx-caption">({s.value.toLocaleString()})</span>
          </li>
        ))}
      </ul>
      <div style={srOnlyStyle()}>
        <p>{summary}</p>
      </div>
    </div>
  )
}
