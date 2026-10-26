import type { Screening } from '../types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value instanceof Map) {
    return Object.fromEntries(value.entries()) as Record<string, unknown>
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (value instanceof Map) return Array.from(value.values(), String)
  return []
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeScreening(raw: unknown): Screening | null {
  const record = asRecord(raw)
  if (!record) return null
  const releaseId = String(record.release_id ?? record.releaseId ?? '')
  if (!releaseId) return null

  return {
    releaseId,
    artifactName: String(record.artifact_name ?? record.artifactName ?? ''),
    artifactVersion: String(
      record.artifact_version ?? record.artifactVersion ?? '',
    ),
    publisher: String(record.publisher ?? ''),
    sbomUrl: String(record.sbom_url ?? record.sbomUrl ?? ''),
    maxFindings: asNumber(record.max_findings ?? record.maxFindings),
    state: asNumber(record.state),
    decision: asNumber(record.decision),
    identityMatch: Boolean(record.identity_match ?? record.identityMatch),
    componentCount: asNumber(record.component_count ?? record.componentCount),
    queriedComponents: asNumber(
      record.queried_components ?? record.queriedComponents,
    ),
    unsupportedComponents: asNumber(
      record.unsupported_components ?? record.unsupportedComponents,
    ),
    truncated: Boolean(record.truncated),
    osvComplete: Boolean(record.osv_complete ?? record.osvComplete),
    findingCount: asNumber(record.finding_count ?? record.findingCount),
    affectedComponents: asNumber(
      record.affected_components ?? record.affectedComponents,
    ),
    findingIds: asStringArray(record.finding_ids ?? record.findingIds),
    findingIdsTruncated: Boolean(
      record.finding_ids_truncated ?? record.findingIdsTruncated,
    ),
    summary: String(record.summary ?? ''),
    round: asNumber(record.round),
  }
}
