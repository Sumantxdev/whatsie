import { PageHeader } from './shell/PageHeader'

/* Routing-verification placeholder with real shell patterns. No product UI. */

export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}): React.JSX.Element {
  return (
    <section
      aria-labelledby="page-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <PageHeader title={title} description={description} />
      <p className="wx-caption">
        Placeholder route — verifies navigation, active state, contextual tabs, header, and
        responsive shell. Feature implementation lands in later stages.
      </p>
    </section>
  )
}
