import { FilePlus2, RotateCcw, ShieldPlus } from 'lucide-react'
import type { FormErrors } from '../lib/validation'
import type { ReleaseForm } from '../types'
import { Field } from './Field'

interface RegisterPanelProps {
  form: ReleaseForm
  errors: FormErrors
  busy: boolean
  connected: boolean
  onChange: (field: keyof ReleaseForm, value: string) => void
  onReset: () => void
  onSubmit: () => void
}

export function RegisterPanel({
  form,
  errors,
  busy,
  connected,
  onChange,
  onReset,
  onSubmit,
}: RegisterPanelProps) {
  return (
    <section className="tool-panel register-panel" aria-labelledby="register-title">
      <div className="panel-heading">
        <div className="panel-icon">
          <FilePlus2 size={19} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Publisher action</p>
          <h2 id="register-title">Register a release</h2>
        </div>
        <button className="text-button" type="button" onClick={onReset}>
          <RotateCcw size={14} aria-hidden="true" />
          Sample
        </button>
      </div>

      <div className="form-stack">
        <Field
          label="Release ID"
          htmlFor="release-id"
          hint="Unique key"
          error={errors.releaseId}
        >
          <input
            id="release-id"
            value={form.releaseId}
            onChange={(event) => onChange('releaseId', event.target.value)}
            placeholder="payments-api-1.4.0"
            autoComplete="off"
          />
        </Field>

        <div className="form-grid">
          <Field
            label="Artifact name"
            htmlFor="artifact-name"
            error={errors.artifactName}
          >
            <input
              id="artifact-name"
              value={form.artifactName}
              onChange={(event) => onChange('artifactName', event.target.value)}
              placeholder="payments-api"
            />
          </Field>
          <Field
            label="Version"
            htmlFor="artifact-version"
            error={errors.artifactVersion}
          >
            <input
              id="artifact-version"
              value={form.artifactVersion}
              onChange={(event) =>
                onChange('artifactVersion', event.target.value)
              }
              placeholder="1.4.0"
            />
          </Field>
        </div>

        <Field
          label="CycloneDX SBOM URL"
          htmlFor="sbom-url"
          hint="HTTPS only"
          error={errors.sbomUrl}
        >
          <input
            id="sbom-url"
            value={form.sbomUrl}
            onChange={(event) => onChange('sbomUrl', event.target.value)}
            placeholder="https://example.com/release.cdx.json"
            inputMode="url"
          />
        </Field>

        <Field
          label="Advisory limit"
          htmlFor="max-findings"
          hint="0 to 100"
          error={errors.maxFindings}
        >
          <input
            id="max-findings"
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.maxFindings}
            onChange={(event) => onChange('maxFindings', event.target.value)}
          />
        </Field>
      </div>

      <button
        className="primary-button full-width"
        type="button"
        onClick={onSubmit}
        disabled={busy || !connected}
      >
        <ShieldPlus size={17} aria-hidden="true" />
        {connected ? 'Register on GenLayer' : 'Connect wallet to register'}
      </button>
    </section>
  )
}
