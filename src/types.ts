export interface ReleaseForm {
  releaseId: string
  artifactName: string
  artifactVersion: string
  sbomUrl: string
  maxFindings: string
}

export interface Screening {
  releaseId: string
  artifactName: string
  artifactVersion: string
  publisher: string
  sbomUrl: string
  maxFindings: number
  state: number
  decision: number
  identityMatch: boolean
  componentCount: number
  queriedComponents: number
  unsupportedComponents: number
  truncated: boolean
  osvComplete: boolean
  findingCount: number
  affectedComponents: number
  findingIds: string[]
  findingIdsTruncated: boolean
  summary: string
  round: number
}

export type TransactionPhase =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'submitted'
  | 'finalized'
  | 'error'

export interface TransactionState {
  phase: TransactionPhase
  action?: 'register' | 'screen'
  hash?: string
  message?: string
}

export interface Notice {
  tone: 'success' | 'error' | 'info'
  message: string
}
