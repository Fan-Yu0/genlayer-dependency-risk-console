import {
  ExternalLink,
  GitBranch,
  LogOut,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { CONTRACT_URL, SOURCE_URL } from '../config'

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface HeaderProps {
  address: string | null
  connecting: boolean
  hasProvider: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function Header({
  address,
  connecting,
  hasProvider,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <a className="brand" href="./" aria-label="Dependency Risk Console home">
          <span className="brand-mark">
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <span>
            <strong>Dependency Risk</strong>
            <small>GenLayer release console</small>
          </span>
        </a>

        <div className="header-actions">
          <span className="network-chip">
            <span className="network-dot" />
            StudioNet
          </span>
          <a
            className="icon-link"
            href={CONTRACT_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Open deployed contract"
            title="Open deployed contract"
          >
            <ExternalLink size={18} aria-hidden="true" />
          </a>
          <a
            className="icon-link"
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Open source repository"
            title="Open source repository"
          >
            <GitBranch size={18} aria-hidden="true" />
          </a>
          {address ? (
            <button
              className="wallet-button connected"
              type="button"
              onClick={onDisconnect}
              title="Disconnect wallet in this app"
            >
              <span className="wallet-address">{shortenAddress(address)}</span>
              <LogOut size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              className="wallet-button"
              type="button"
              onClick={onConnect}
              disabled={connecting}
            >
              <Wallet size={17} aria-hidden="true" />
              {connecting ? 'Checking wallet' : 'Connect wallet'}
            </button>
          )}
        </div>
      </div>
      {!hasProvider && (
        <div className="wallet-hint">
          Wallet not detected. Reads stay public; install an EIP-1193 wallet to
          register or screen releases.
        </div>
      )}
    </header>
  )
}
