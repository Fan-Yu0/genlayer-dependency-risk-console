import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import {
  ExecutionResult,
  TransactionStatus,
} from 'genlayer-js/types'
import type { CalldataEncodable } from 'genlayer-js/types'
import { CONTRACT_ADDRESS, EXPLORER_URL, GENLAYER_RPC_URL } from '../config'
import type {
  ReleaseForm,
  Screening,
  TransactionPhase,
} from '../types'
import { normalizeScreening } from './normalize'
import {
  executionErrorMessage,
  resolveExecutionResult,
  type ReceiptLike,
} from './receipt'

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

/**
 * EIP-1193 wallets reject with plain objects ({ code, message }) instead of
 * Error instances, so `instanceof Error` checks in the UI would otherwise
 * collapse every wallet problem into a generic "Wallet connection failed".
 */
export function normalizeWalletError(cause: unknown): Error {
  if (cause instanceof Error) return cause
  const detail = cause as
    | { code?: number; message?: string; data?: { message?: string } }
    | undefined
  if (detail?.code === 4001) {
    return new Error('You rejected the request in your wallet.')
  }
  if (detail?.code === -32002) {
    return new Error(
      'A wallet request is already pending. Open your wallet to continue.',
    )
  }
  const message = detail?.data?.message || detail?.message
  return new Error(message || 'The wallet request failed.')
}

/**
 * Connects the injected wallet for identity / read-only use. Only account
 * access is requested so any EIP-1193 wallet can connect. Switching to
 * StudioNet is deferred to `ensureSigningReady`, which runs only when a write
 * transaction is actually submitted.
 */
export async function connectWallet(): Promise<string> {
  const provider = getProvider()
  let accounts: string[]
  try {
    accounts = (await provider.request({
      method: 'eth_requestAccounts',
    })) as string[]
  } catch (cause) {
    throw normalizeWalletError(cause)
  }
  if (!accounts[0]) throw new Error('The wallet did not return an account.')
  return accounts[0]
}

const STUDIONET_CHAIN_ID = `0x${studionet.id.toString(16)}`

function studioNetChainParams() {
  return {
    chainId: STUDIONET_CHAIN_ID,
    chainName: studionet.name,
    rpcUrls: [GENLAYER_RPC_URL],
    nativeCurrency: studionet.nativeCurrency,
    blockExplorerUrls: [EXPLORER_URL],
  }
}

function walletErrorCode(cause: unknown): number | undefined {
  return (cause as { code?: number } | undefined)?.code
}

/**
 * Makes sure the injected wallet is on StudioNet. This uses the plain EIP-1193
 * chain APIs (add + switch) instead of genlayer-js `connect`, which requests
 * the MetaMask Snaps plugin. StudioNet accepts ordinary EVM transactions, so
 * any wallet that can add a custom chain can sign writes without a snap.
 */
async function switchToStudioNet(provider: EthereumProvider): Promise<void> {
  const chainId = STUDIONET_CHAIN_ID
  const current = (await provider
    .request({ method: 'eth_chainId' })
    .catch(() => undefined)) as string | undefined
  if (typeof current === 'string' && current.toLowerCase() === chainId) return

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
    return
  } catch (cause) {
    if (walletErrorCode(cause) === 4001) throw normalizeWalletError(cause)
    const message = String(
      (cause as { message?: string } | undefined)?.message ?? '',
    ).toLowerCase()
    const unknownChain =
      walletErrorCode(cause) === 4902 ||
      message.includes('unrecognized') ||
      message.includes('not added') ||
      message.includes('unknown chain')
    if (!unknownChain) throw normalizeWalletError(cause)
  }

  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [studioNetChainParams()],
    })
  } catch (cause) {
    throw normalizeWalletError(cause)
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  } catch (cause) {
    if (walletErrorCode(cause) === 4001) throw normalizeWalletError(cause)
  }
}

/**
 * Prepares the injected wallet to sign GenLayer transactions by switching it to
 * StudioNet. Called lazily before the first write so connecting and every
 * read-only flow work without a wallet or a MetaMask snap.
 */
export async function ensureSigningReady(): Promise<void> {
  await switchToStudioNet(getProvider())
}

export async function getConnectedAccounts(): Promise<string[]> {
  if (!window.ethereum) return []
  try {
    return (await window.ethereum.request({
      method: 'eth_accounts',
    })) as string[]
  } catch {
    return []
  }
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
  await ensureSigningReady()
  const client = createWriteClient(account)
  onPhase('signing', 'Confirm the transaction in your wallet.')

  const hash = await client
    .writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName,
      args,
      value: 0n,
    })
    .catch((cause: unknown) => {
      throw normalizeWalletError(cause)
    })

  onPhase('submitted', `${action === 'register' ? 'Registration' : 'Screening'} submitted. Waiting for consensus.`, hash)

  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 120,
    interval: 3000,
  })

  const receiptLike = receipt as unknown as ReceiptLike
  const resultName = resolveExecutionResult(receiptLike)
  if (!resultName) {
    throw new Error('The transaction finalized without an execution result.')
  }
  if (resultName === ExecutionResult.FINISHED_WITH_ERROR) {
    const detail = executionErrorMessage(receiptLike)
    throw new Error(
      detail
        ? `The transaction finalized with a contract execution error: ${detail}`
        : 'The transaction finalized with a contract execution error.',
    )
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

