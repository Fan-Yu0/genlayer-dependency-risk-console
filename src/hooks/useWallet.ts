import { useCallback, useEffect, useState } from 'react'
import { connectWallet, getConnectedAccounts } from '../lib/contract'

const DISCONNECT_FLAG = 'dependency-risk-console:disconnected'

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (localStorage.getItem(DISCONNECT_FLAG) === 'true') {
        if (active) setConnecting(false)
        return
      }

      try {
        const accounts = await getConnectedAccounts()
        if (active) setAddress(accounts[0] ?? null)
      } finally {
        if (active) setConnecting(false)
      }
    }

    void restoreSession()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const provider = window.ethereum
    if (!provider?.on || !provider.removeListener) return

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) ?? []
      setAddress(accounts[0] ?? null)
      if (accounts.length > 0) localStorage.removeItem(DISCONNECT_FLAG)
    }

    provider.on('accountsChanged', handleAccountsChanged)
    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged)
    }
  }, [])

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const nextAddress = await connectWallet()
      localStorage.removeItem(DISCONNECT_FLAG)
      setAddress(nextAddress)
      return nextAddress
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.setItem(DISCONNECT_FLAG, 'true')
    setAddress(null)
  }, [])

  return {
    address,
    connecting,
    hasProvider: typeof window !== 'undefined' && Boolean(window.ethereum),
    connect,
    disconnect,
  }
}
