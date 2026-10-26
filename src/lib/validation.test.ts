import { describe, expect, it } from 'vitest'
import { SAMPLE_FORM } from '../config'
import { normalizeScreening } from './normalize'
import { validateReleaseForm } from './validation'

describe('validateReleaseForm', () => {
  it('accepts the published sample', () => {
    expect(validateReleaseForm(SAMPLE_FORM)).toEqual({})
  })

  it('rejects non-HTTPS SBOM URLs', () => {
    expect(
      validateReleaseForm({ ...SAMPLE_FORM, sbomUrl: 'http://example.com/sbom' })
        .sbomUrl,
    ).toMatch(/HTTPS/)
  })

  it('rejects out-of-range advisory limits', () => {
    expect(
      validateReleaseForm({ ...SAMPLE_FORM, maxFindings: '101' }).maxFindings,
    ).toMatch(/0 to 100/)
  })
})

describe('normalizeScreening', () => {
  it('normalizes the live contract response shape', () => {
    const result = normalizeScreening({
      release_id: 'payments-api-1.4.0',
      artifact_name: 'payments-api',
      artifact_version: '1.4.0',
      state: 1,
      decision: 1,
      identity_match: true,
      component_count: 2,
      queried_components: 2,
      osv_complete: true,
      finding_count: 8,
      finding_ids: ['GHSA-1', 'PYSEC-2'],
      max_findings: 10,
      summary: '8 advisories within policy',
    })

    expect(result).toMatchObject({
      releaseId: 'payments-api-1.4.0',
      decision: 1,
      findingCount: 8,
      osvComplete: true,
      findingIds: ['GHSA-1', 'PYSEC-2'],
    })
  })

  it('returns null for an empty contract response', () => {
    expect(normalizeScreening({})).toBeNull()
  })
})
