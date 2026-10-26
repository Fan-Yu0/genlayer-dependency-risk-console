import { RefreshCw, Search, ShieldCheck, Sparkles } from 'lucide-react'
import type { Screening } from '../types'
import { Field } from './Field'

interface ScreenPanelProps {
  releaseId: string
  error?: string
  busy: boolean
  reading: boolean
  connected: boolean
  result: Screening | null
  onChange: (value: string) => void
  onRead: () => void
  onScreen: () => void
  onSample: () => void
}

export function ScreenPanel({
  releaseId,
  error,
  busy,
  reading,
  connected,
  result,
  onChange,
  onRead,
  onScreen,
  onSample,
}: ScreenPanelProps) {
  return (
    <section className="tool-panel screen-panel" aria-labelledby="screen-title">
      <div className="panel-heading">
        <div className="panel-icon secondary">
          <ShieldCheck size={19} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Public verification</p>
          <h2 id="screen-title">Screen or inspect</h2>
        </div>
        <button className="text-button" type="button" onClick={onSample}>
          <Sparkles size={14} aria-hidden="true" />
          Live sample
        </button>
      </div>

      <Field
        label="Release ID"
        htmlFor="screen-release-id"
        hint="Case-insensitive"
        error={error}
      >
        <input
          id="screen-release-id"
          value={releaseId}
          onChange={(event) => onChange(event.target.value)}
          placeholder="payments-api-1.4.0"
          onKeyDown={(event) => {
            if (event.key === 'Enter') onRead()
          }}
        />
      </Field>

      <div className="screen-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={onRead}
          disabled={reading}
        >
          {reading ? (
            <RefreshCw className="spin" size={16} aria-hidden="true" />
          ) : (
            <Search size={16} aria-hidden="true" />
          )}
          {reading ? 'Reading' : 'Read record'}
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={onScreen}
          disabled={busy || !connected}
        >
          <ShieldCheck size={16} aria-hidden="true" />
          {connected ? 'Run screening' : 'Wallet required'}
        </button>
      </div>

      <div className="read-only-note">
        <Search size={15} aria-hidden="true" />
        Reads are public. Screening requires a wallet because it submits a
        consensus transaction.
      </div>

      <div className="sample-note">
        <span className={result ? 'sample-live' : 'sample-dot'} />
        {result
          ? `Loaded ${result.releaseId} from the deployed contract`
          : 'No on-chain record loaded yet'}
      </div>
    </section>
  )
}
