import type { ReleaseForm } from './types'

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  '0x7493ED2C2DD1bBc81Fd05Dfdb47864cD67F91A2f'

export const GENLAYER_RPC_URL =
  import.meta.env.VITE_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api'

export const EXPLORER_URL = 'https://explorer-studio.genlayer.com'
export const CONTRACT_URL = `${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`
export const SOURCE_URL =
  'https://github.com/Fan-Yu0/genlayer-dependency-risk-gate'

export const SAMPLE_RELEASE_ID = 'payments-api-1.4.0'

export const SAMPLE_FORM: ReleaseForm = {
  releaseId: SAMPLE_RELEASE_ID,
  artifactName: 'payments-api',
  artifactVersion: '1.4.0',
  sbomUrl:
    'https://raw.githubusercontent.com/Fan-Yu0/genlayer-dependency-risk-gate/main/examples/payments-api-1.4.0.cdx.json',
  maxFindings: '10',
}

export const DECISION_META = {
  0: {
    label: 'Not screened',
    tone: 'neutral',
    description: 'This release has no completed screening result yet.',
  },
  1: {
    label: 'Clear',
    tone: 'clear',
    description: 'Coverage is complete and advisories are within policy.',
  },
  2: {
    label: 'Review required',
    tone: 'review',
    description: 'Evidence is incomplete, unsupported, or does not match.',
  },
  3: {
    label: 'Blocked',
    tone: 'blocked',
    description: 'The release exceeds the publisher advisory limit.',
  },
} as const
