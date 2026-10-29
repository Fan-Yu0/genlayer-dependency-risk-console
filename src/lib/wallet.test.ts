import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureSigningReady } from './contract'

type Handler = (params?: unknown[]) => unknown

function mockProvider(handlers: Record<string, Handler>) {
  const calls: { method: string; params?: unknown[] }[] = []
  const request = vi.fn(
    async ({ method, params }: { method: string; params?: unknown[] }) => {
      calls.push({ method, params })
      const handler = handlers[method]
      if (!handler) {
        throw Object.assign(new Error(`unhandled ${method}`), { code: -32601 })
      }
      return handler(params)
    },
  )
  window.ethereum = { request } as never
  return { calls, request }
}

afterEach(() => {
  delete window.ethereum
})

describe('ensureSigningReady', () => {
  it('does nothing when the wallet is already on StudioNet', async () => {
    const { calls } = mockProvider({ eth_chainId: () => '0xf22f' })
    await ensureSigningReady()
    expect(calls.map((call) => call.method)).toEqual(['eth_chainId'])
  })

  it('adds StudioNet when the wallet does not know the chain', async () => {
    let added = false
    const { calls } = mockProvider({
      eth_chainId: () => '0x1',
      wallet_switchEthereumChain: () => {
        if (!added) {
          throw Object.assign(new Error('Unrecognized chain ID'), { code: 4902 })
        }
        return null
      },
      wallet_addEthereumChain: () => {
        added = true
        return null
      },
    })

    await ensureSigningReady()

    expect(calls.map((call) => call.method)).toEqual([
      'eth_chainId',
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain',
      'wallet_switchEthereumChain',
    ])
    expect(calls.some((call) => call.method === 'wallet_getSnaps')).toBe(false)
    const addCall = calls.find((call) => call.method === 'wallet_addEthereumChain')
    expect(addCall?.params?.[0]).toMatchObject({ chainId: '0xf22f' })
  })

  it('surfaces a rejected switch request', async () => {
    mockProvider({
      eth_chainId: () => '0x1',
      wallet_switchEthereumChain: () => {
        throw Object.assign(new Error('User rejected'), { code: 4001 })
      },
    })

    await expect(ensureSigningReady()).rejects.toThrow(/rejected/i)
  })
})
