import { describe, expect, it } from 'vitest'
import { executionErrorMessage, resolveExecutionResult } from './receipt'

describe('resolveExecutionResult', () => {
  it('reads the simplified non-Studio field', () => {
    expect(
      resolveExecutionResult({ txExecutionResultName: 'FINISHED_WITH_RETURN' }),
    ).toBe('FINISHED_WITH_RETURN')
  })

  it('maps numeric execution results', () => {
    expect(resolveExecutionResult({ txExecutionResult: 2 })).toBe(
      'FINISHED_WITH_ERROR',
    )
  })

  it('maps StudioNet leader receipt results', () => {
    expect(
      resolveExecutionResult({
        result_name: 'MAJORITY_AGREE',
        consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }] },
      }),
    ).toBe('FINISHED_WITH_RETURN')

    expect(
      resolveExecutionResult({
        result_name: 'MAJORITY_AGREE',
        consensus_data: { leader_receipt: { execution_result: 'ERROR' } },
      }),
    ).toBe('FINISHED_WITH_ERROR')
  })

  it('maps consensus-level timeouts and disagreements', () => {
    expect(resolveExecutionResult({ result_name: 'TIMEOUT' })).toBe('TIMEOUT')
    expect(resolveExecutionResult({ result_name: 'NO_MAJORITY' })).toBe(
      'NONDET_DISAGREE',
    )
  })

  it('returns undefined when no execution signal is present', () => {
    expect(resolveExecutionResult({})).toBeUndefined()
  })
})

describe('executionErrorMessage', () => {
  it('extracts a GenVM error description', () => {
    expect(
      executionErrorMessage({
        consensus_data: {
          leader_receipt: [
            {
              execution_result: 'ERROR',
              genvm_result: { error_description: 'boom' },
            },
          ],
        },
      }),
    ).toBe('boom')
  })

  it('returns undefined when no error text is present', () => {
    expect(executionErrorMessage({})).toBeUndefined()
  })
})
