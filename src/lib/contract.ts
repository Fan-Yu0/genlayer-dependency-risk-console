import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import {
  ExecutionResult,
  TransactionStatus,
} from 'genlayer-js/types'
import type { CalldataEncodable } from 'genlayer-js/types'
import { CONTRACT_ADDRESS, GENLAYER_RPC_URL } from '../config'
import type {
  ReleaseForm,
  Screening,
  TransactionPhase,
} from '../types'
import { normalizeScreening } from './normalize'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

const readClient = createClient({
  chain: studionet,
  endpoint: GENLAYER_RPC_URL,
})

function getProvider(): EthereumProvider {
  if (!window.ethereum) {
    throw new Error(
      'No browser wallet found. Install MetaMask or another EIP-1193 wallet.',
    )
  }
  return window.ethereum
}

function createWriteClient(address: string) {
  return createClient({
    chain: studionet,
    endpoint: GENLAYER_RPC_URL,
    account: address as `0x${string}`,
    provider: getProvider() as never,
  })
}

export async function connectWallet(): Promise<string> {
  const provider = getProvider()
  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[]
  if (!accounts[0]) throw new Error('The wallet did not return an account.')

  const client = createWriteClient(accounts[0])
  await (client as unknown as { connect: (chain: string) => Promise<void> }).connect(
    'studionet',
  )
  return accounts[0]
}

export async function getConnectedAccounts(): Promise<string[]> {
  if (!window.ethereum) return []
  return (await window.ethereum.request({ method: 'eth_accounts' })) as string[]
}

export async function readScreening(
  releaseId: string,
): Promise<Screening | null> {
  const result = await readClient.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: 'get_screening',
    args: [releaseId.trim().toLowerCase()],
  })
  return normalizeScreening(result)
}

async function submitTransaction(
  account: string,
  action: 'register' | 'screen',
  functionName: 'register_release' | 'screen',
  args: CalldataEncodable[],
  onPhase: (phase: TransactionPhase, message: string, hash?: string) => void,
) {
  const client = createWriteClient(account)
  onPhase('signing', 'Confirm the transaction in your wallet.')

  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args,
    value: 0n,
  })

  onPhase('submitted', `${action === 'register' ? 'Registration' : 'Screening'} submitted. Waiting for consensus.`, hash)

  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 120,
    interval: 3000,
  })

  const resultName = receipt.txExecutionResultName as string | undefined
  if (!resultName) {
    throw new Error('The transaction finalized without an execution result.')
  }
  if (resultName === ExecutionResult.FINISHED_WITH_ERROR) {
    throw new Error('The transaction finalized with a contract execution error.')
  }
  if (resultName === 'TIMEOUT') {
    throw new Error('The transaction timed out during GenLayer execution.')
  }
  if (resultName === 'NONDET_DISAGREE') {
    throw new Error('Validators could not agree on the external evidence.')
  }
  if (resultName === ExecutionResult.NOT_VOTED) {
    throw new Error('The transaction finalized without an execution result.')
  }
  if (resultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    throw new Error(`Unexpected GenLayer execution result: ${resultName}`)
  }

  onPhase('finalized', 'Finalized on GenLayer Studio.', hash)
  return hash
}

export async function registerRelease(
  account: string,
  form: ReleaseForm,
  onPhase: (phase: TransactionPhase, message: string, hash?: string) => void,
) {
  return submitTransaction(
    account,
    'register',
    'register_release',
    [
      form.releaseId.trim().toLowerCase(),
      form.artifactName.trim(),
      form.artifactVersion.trim(),
      form.sbomUrl.trim(),
      Number(form.maxFindings),
    ],
    onPhase,
  )
}

export async function screenRelease(
  account: string,
  releaseId: string,
  onPhase: (phase: TransactionPhase, message: string, hash?: string) => void,
) {
  return submitTransaction(
    account,
    'screen',
    'screen',
    [releaseId.trim().toLowerCase()],
    onPhase,
  )
}

export function transactionUrl(hash: string): string {
  return `https://explorer-studio.genlayer.com/tx/${hash}`
}
