interface LeaderReceipt {
  execution_result?: string
  genvm_result?: {
    raw_error?: string | null
    error_description?: string | null
    stderr?: string | null
  }
}

export interface ReceiptLike {
  txExecutionResultName?: string
  txExecutionResult?: number | string
  result_name?: string
  resultName?: string
  consensus_data?: {
    leader_receipt?: LeaderReceipt | LeaderReceipt[] | null
  }
}

const EXECUTION_RESULT_NUMBER_TO_NAME: Record<string, string> = {
  '0': 'NOT_VOTED',
  '1': 'FINISHED_WITH_RETURN',
  '2': 'FINISHED_WITH_ERROR',
}

function leaderReceipts(receipt: ReceiptLike): LeaderReceipt[] {
  const leader = receipt.consensus_data?.leader_receipt
  if (!leader) return []
  return Array.isArray(leader) ? leader : [leader]
}

/**
 * Resolves a transaction receipt into the GenLayer execution-result name used
 * by the UI. Non-Studio networks expose `txExecutionResultName` directly, while
 * StudioNet reports the leader receipt's `execution_result` ("SUCCESS" /
 * "ERROR") and only exposes a consensus result at the top level.
 */
export function resolveExecutionResult(
  receipt: ReceiptLike,
): string | undefined {
  if (receipt.txExecutionResultName) return receipt.txExecutionResultName

  if (
    receipt.txExecutionResult !== undefined &&
    receipt.txExecutionResult !== null
  ) {
    const mapped = EXECUTION_RESULT_NUMBER_TO_NAME[String(receipt.txExecutionResult)]
    if (mapped) return mapped
  }

  for (const leader of leaderReceipts(receipt)) {
    const raw = leader.execution_result?.trim().toUpperCase()
    if (!raw) continue
    if (raw === 'SUCCESS') return 'FINISHED_WITH_RETURN'
    if (raw === 'ERROR' || raw === 'FAILURE') return 'FINISHED_WITH_ERROR'
    if (raw === 'NOT_VOTED') return 'NOT_VOTED'
    return raw
  }

  const consensus = (receipt.result_name ?? receipt.resultName ?? '').toUpperCase()
  if (consensus === 'TIMEOUT') return 'TIMEOUT'
  if (
    consensus === 'DISAGREE' ||
    consensus === 'NO_MAJORITY' ||
    consensus === 'MAJORITY_DISAGREE' ||
    consensus === 'DETERMINISTIC_VIOLATION'
  ) {
    return 'NONDET_DISAGREE'
  }

  return undefined
}

/** Extracts a human-readable contract error from a leader receipt, if any. */
export function executionErrorMessage(
  receipt: ReceiptLike,
): string | undefined {
  for (const leader of leaderReceipts(receipt)) {
    const genvm = leader.genvm_result
    const message =
      genvm?.error_description || genvm?.raw_error || genvm?.stderr
    if (message && String(message).trim()) return String(message).trim()
  }
  return undefined
}
