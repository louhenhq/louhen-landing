import React from 'react'

export const dynamic = 'force-static'

type TileProps = { name: string; className?: string; children?: React.ReactNode }
function Tile({ name, className = '', children }: TileProps) {
  return (
    <div className={`rounded-md border border-border bg-bg p-md ${className}`}>
      <div className="text-meta text-text-muted mb-xs normal-case tracking-normal">{name}</div>
      {children}
    </div>
  )
}

type SwatchProps = { name: string; cls: string; labelClass?: string }
function Swatch({ name, cls, labelClass }: SwatchProps) {
  return (
    <Tile name={name}>
      <div className={`h-10 rounded-md ${cls}`} />
      <code className={`mt-xs block text-body-sm ${labelClass ?? 'text-text'}`}>{cls}</code>
    </Tile>
  )
}

export default function TokensPage() {
  const bg = ['bg-bg', 'bg-bg-card']
  const text = ['text-text', 'text-text-muted', 'text-text-inverse']
  const border = ['border-border']
  const status = ['bg-status-success', 'bg-status-warning', 'bg-status-info']
  const brand = ['bg-brand-primary', 'bg-brand-secondary', 'bg-brand-teal', 'bg-brand-mint', 'bg-brand-coral']

  return (
    <main className="mx-auto max-w-6xl px-md py-lg">
      <h1 className="mb-lg text-display-lg text-text">Design Tokens Playground</h1>

      {/* Backgrounds */}
      <section className="mt-lg">
        <h2 className="mb-sm text-h3 text-text">Background</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {bg.map((c) => (
            <Swatch key={c} name={c} cls={c} />
          ))}
        </div>
      </section>

      {/* Text */}
      <section className="mt-lg">
        <h2 className="mb-sm text-h3 text-text">Text</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {text.map((c) => (
            <Tile key={c} name={c}>
              <p className={`text-body font-medium ${c}`}>The quick brown fox jumps over the lazy dog.</p>
              <p className="mt-xs text-body-sm text-text-muted">0123456789 • A/a • ÄÖÜ äöü</p>
            </Tile>
          ))}
        </div>
      </section>

      {/* Borders */}
      <section className="mt-lg">
        <h2 className="mb-sm text-h3 text-text">Borders</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {border.map((b) => (
            <div key={b} className={`rounded-md p-md bg-bg border ${b}`}>
              <code className="text-body-sm text-text">{b}</code>
              <div className="mt-sm h-10 rounded-md bg-bg-card" />
            </div>
          ))}
        </div>
      </section>

      {/* Status */}
      <section className="mt-lg">
        <h2 className="mb-sm text-h3 text-text">Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {status.map((s) => (
            <Swatch key={s} name={s} cls={s} />
          ))}
        </div>
      </section>

      {/* Brand */}
      <section className="mt-lg">
        <h2 className="mb-sm text-h3 text-text">Brand</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
          {brand.map((s) => (
            <Swatch key={s} name={s} cls={s} />
          ))}
        </div>
      </section>

      {/* Spacing */}
      <section className="mt-lg">
        <h2 className="mb-sm text-h3 text-text">Spacing</h2>
        <div className="space-y-sm">
          {['xs','sm','md','lg','xl','xxl','xxxl','gutter'].map((k) => (
            <div key={k} className="flex items-center gap-sm">
              <div className="h-2 rounded-sm bg-brand-secondary" style={{ width: `var(--spacing-${k})` }} />
              <code className="text-body-sm text-text">--spacing-{k}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Radii */}
      <section className="mt-lg">
        <h2 className="mb-sm text-h3 text-text">Radii</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {['sm','md','lg','pill'].map((k) => (
            <Tile key={k} name={`--radii-${k}`}>
              <div className="h-10 bg-bg-card" style={{ borderRadius: `var(--radii-${k})` }} />
            </Tile>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section className="mt-lg">
        <h2 className="mb-sm text-h3 text-text">Shadows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          <Tile name="shadow-card">
            <div className="h-12 rounded-md bg-bg-card shadow-card" />
          </Tile>
        </div>
      </section>
    </main>
  )
}
