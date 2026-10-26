import type { ReleaseForm } from '../types'

export type FormErrors = Partial<Record<keyof ReleaseForm, string>>

export function validateReleaseForm(form: ReleaseForm): FormErrors {
  const errors: FormErrors = {}
  const releaseId = form.releaseId.trim()
  const artifactName = form.artifactName.trim()
  const artifactVersion = form.artifactVersion.trim()
  const sbomUrl = form.sbomUrl.trim()
  const maxFindings = Number(form.maxFindings)

  if (!releaseId) errors.releaseId = 'Release ID is required.'
  else if (releaseId.length > 200)
    errors.releaseId = 'Release ID must be 200 characters or fewer.'

  if (!artifactName) errors.artifactName = 'Artifact name is required.'
  else if (artifactName.length > 200)
    errors.artifactName = 'Artifact name must be 200 characters or fewer.'

  if (!artifactVersion) errors.artifactVersion = 'Version is required.'
  else if (artifactVersion.length > 100)
    errors.artifactVersion = 'Version must be 100 characters or fewer.'

  if (!sbomUrl.startsWith('https://'))
    errors.sbomUrl = 'Use a public HTTPS SBOM URL.'
  else if (sbomUrl.length > 1000)
    errors.sbomUrl = 'SBOM URL must be 1,000 characters or fewer.'

  if (
    !form.maxFindings.trim() ||
    !Number.isInteger(maxFindings) ||
    maxFindings < 0 ||
    maxFindings > 100
  ) {
    errors.maxFindings = 'Use a whole number from 0 to 100.'
  }

  return errors
}

export function validateReleaseId(releaseId: string): string | null {
  const normalized = releaseId.trim()
  if (!normalized) return 'Enter a release ID to inspect.'
  if (normalized.length > 200) return 'Release ID is too long.'
  return null
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0
}
