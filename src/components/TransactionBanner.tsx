import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { transactionUrl } from '../lib/contract'
import type { TransactionState } from '../types'

export function TransactionBanner({ state }: { state: TransactionState }) {
  if (state.phase === 'idle') return null

  const isError = state.phase === 'error'
  const isDone = state.phase === 'finalized'

  return (
    <div
      className={`transaction-banner ${isError ? 'error' : isDone ? 'success' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="transaction-icon">
        {isError ? (
          <AlertCircle size={18} aria-hidden="true" />
        ) : isDone ? (
          <CheckCircle2 size={18} aria-hidden="true" />
        ) : (
          <Loader2 className="spin" size={18} aria-hidden="true" />
        )}
      </span>
      <div>
        <strong>
          {state.action === 'screen'
            ? 'Screening transaction'
            : state.action === 'register'
              ? 'Registration transaction'
              : 'Transaction'}
        </strong>
        <p>{state.message}</p>
      </div>
      {state.hash && (
        <a
          href={transactionUrl(state.hash)}
          target="_blank"
          rel="noreferrer"
          className="transaction-link"
        >
          Explorer
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  )
}
