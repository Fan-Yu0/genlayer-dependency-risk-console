import {
  AlertTriangle,
  Boxes,
  Check,
  CircleDashed,
  ExternalLink,
  FileWarning,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { CONTRACT_URL, DECISION_META } from '../config'
import type { Screening } from '../types'

function shorten(value: string, start = 8, end = 6) {
  if (!value) return 'Unknown'
  if (value.length <= start + end + 3) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

function DecisionIcon({ decision }: { decision: number }) {
  if (decision === 1) return <ShieldCheck size={28} aria-hidden="true" />
  if (decision === 2) return <AlertTriangle size={28} aria-hidden="true" />
  if (decision === 3) return <ShieldAlert size={28} aria-hidden="true" />
  return <CircleDashed size={28} aria-hidden="true" />
}

export function ScreeningResult({
  result,
  reading,
}: {
  result: Screening | null
  reading: boolean
}) {
  if (reading) {
    return (
      <section className="result-panel loading-state" aria-live="polite">
        <CircleDashed className="spin" size={24} aria-hidden="true" />
        Reading the accepted contract state.
      </section>
    )
  }

  if (!result) {
    return (
      <section className="result-panel empty-state">
        <div className="empty-icon">
          <FileWarning size={26} aria-hidden="true" />
        </div>
        <div>
          <h2>No screening loaded</h2>
          <p>
            Read an existing release ID or run the live sample to inspect the
            deployed contract.
          </p>
        </div>
      </section>
    )
  }

  const decision =
    DECISION_META[result.decision as keyof typeof DECISION_META] ??
    DECISION_META[0]

  return (
    <section
      className={`result-panel decision-${decision.tone}`}
      aria-labelledby="result-title"
    >
      <div className="decision-hero">
        <div className="decision-icon">
          <DecisionIcon decision={result.decision} />
        </div>
        <div className="decision-copy">
          <p className="eyebrow">On-chain decision</p>
          <h2 id="result-title">{decision.label}</h2>
          <p>{result.summary || decision.description}</p>
        </div>
        <div className="decision-release">
          <span>{result.artifactName}</span>
          <strong>{result.artifactVersion}</strong>
          <code>{result.releaseId}</code>
        </div>
      </div>

      <div className="metric-strip">
        <div>
          <span>OSV advisories</span>
          <strong>{result.findingCount}</strong>
          <small>Limit {result.maxFindings}</small>
        </div>
        <div>
          <span>Components</span>
          <strong>{result.queriedComponents}</strong>
          <small>{result.componentCount} discovered</small>
        </div>
        <div>
          <span>Affected</span>
          <strong>{result.affectedComponents}</strong>
          <small>components</small>
        </div>
        <div>
          <span>Coverage</span>
          <strong className={result.osvComplete ? 'metric-ok' : 'metric-warn'}>
            {result.osvComplete ? 'Complete' : 'Incomplete'}
          </strong>
          <small>OSV response</small>
        </div>
        <div>
          <span>Round</span>
          <strong>{result.round}</strong>
          <small>latest screening</small>
        </div>
      </div>

      <div className="result-grid">
        <div className="result-section">
          <div className="section-title-row">
            <h3>Advisory evidence</h3>
            <span>{result.findingIds.length} shown</span>
          </div>
          {result.findingIds.length > 0 ? (
            <div className="finding-list">
              {result.findingIds.map((finding) => (
                <code key={finding}>{finding}</code>
              ))}
            </div>
          ) : (
            <p className="muted-copy">No advisory IDs were returned.</p>
          )}
          {result.findingIdsTruncated && (
            <p className="muted-copy">
              The on-chain record stores a truncated advisory list.
            </p>
          )}
        </div>

        <div className="result-section">
          <div className="section-title-row">
            <h3>Evidence checks</h3>
            <span>Policy inputs</span>
          </div>
          <dl className="evidence-list">
            <div>
              <dt>Artifact identity</dt>
              <dd className={result.identityMatch ? 'ok' : 'warn'}>
                {result.identityMatch ? <Check size={15} /> : <AlertTriangle size={15} />}
                {result.identityMatch ? 'Matched' : 'Mismatch'}
              </dd>
            </div>
            <div>
              <dt>Unsupported components</dt>
              <dd>{result.unsupportedComponents}</dd>
            </div>
            <div>
              <dt>Coverage truncated</dt>
              <dd>{result.truncated ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt>Publisher</dt>
              <dd title={result.publisher}>{shorten(result.publisher)}</dd>
            </div>
          </dl>
          <div className="result-links">
            <a href={result.sbomUrl} target="_blank" rel="noreferrer">
              <Boxes size={14} aria-hidden="true" />
              Open SBOM
              <ExternalLink size={13} aria-hidden="true" />
            </a>
            <a href={CONTRACT_URL} target="_blank" rel="noreferrer">
              Contract
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
