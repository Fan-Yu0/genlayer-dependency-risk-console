import {
  BookOpen,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  GitBranch,
  Info,
  ShieldCheck,
  TerminalSquare,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { RegisterPanel } from './components/RegisterPanel'
import { ScreenPanel } from './components/ScreenPanel'
import { ScreeningResult } from './components/ScreeningResult'
import { TransactionBanner } from './components/TransactionBanner'
import {
  CONTRACT_ADDRESS,
  CONTRACT_URL,
  SAMPLE_FORM,
  SAMPLE_RELEASE_ID,
  SOURCE_URL,
} from './config'
import { useWallet } from './hooks/useWallet'
import {
  readScreening,
  registerRelease,
  screenRelease,
} from './lib/contract'
import {
  hasErrors,
  validateReleaseForm,
  validateReleaseId,
  type FormErrors,
} from './lib/validation'
import type {
  Notice,
  ReleaseForm,
  Screening,
  TransactionState,
} from './types'
import './App.css'

function App() {
  const wallet = useWallet()
  const [registerForm, setRegisterForm] = useState<ReleaseForm>(SAMPLE_FORM)
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({})
  const [screenId, setScreenId] = useState(SAMPLE_RELEASE_ID)
  const [screenError, setScreenError] = useState<string>()
  const [screening, setScreening] = useState<Screening | null>(null)
  const [reading, setReading] = useState(true)
  const [transaction, setTransaction] = useState<TransactionState>({
    phase: 'idle',
  })
  const [notice, setNotice] = useState<Notice | null>(null)

  const busy =
    transaction.phase === 'preparing' ||
    transaction.phase === 'signing' ||
    transaction.phase === 'submitted'

  async function loadRecord(releaseId: string, announce = true) {
    const error = validateReleaseId(releaseId)
    if (error) {
      setScreenError(error)
      return
    }

    setScreenError(undefined)
    setReading(true)
    if (announce) setNotice(null)
    try {
      const result = await readScreening(releaseId)
      setScreening(result)
      if (!result && announce) {
        setNotice({ tone: 'info', message: 'No release record was found.' })
      }
    } catch (cause) {
      setNotice({
        tone: 'error',
        message:
          cause instanceof Error
            ? cause.message
            : 'Could not read the contract state.',
      })
    } finally {
      setReading(false)
    }
  }

  useEffect(() => {
    let active = true
    readScreening(SAMPLE_RELEASE_ID)
      .then((result) => {
        if (active) setScreening(result)
      })
      .catch((cause) => {
        if (!active) return
        setNotice({
          tone: 'error',
          message:
            cause instanceof Error
              ? cause.message
              : 'Could not read the sample release.',
        })
      })
      .finally(() => {
        if (active) setReading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function updateForm(field: keyof ReleaseForm, value: string) {
    setRegisterForm((current) => ({ ...current, [field]: value }))
    setRegisterErrors((current) => ({ ...current, [field]: undefined }))
  }

  function phaseHandler(action: 'register' | 'screen') {
    return (
      phase: TransactionState['phase'],
      message: string,
      hash?: string,
    ) => {
      setTransaction({ phase, action, message, hash })
    }
  }

  async function handleRegister() {
    const errors = validateReleaseForm(registerForm)
    setRegisterErrors(errors)
    if (hasErrors(errors)) return
    if (!wallet.address) {
      setNotice({ tone: 'error', message: 'Connect a wallet first.' })
      return
    }

    setNotice(null)
    setTransaction({ phase: 'preparing', action: 'register', message: 'Preparing registration.' })
    try {
      await registerRelease(
        wallet.address,
        registerForm,
        phaseHandler('register'),
      )
      const normalizedId = registerForm.releaseId.trim().toLowerCase()
      setScreenId(normalizedId)
      setNotice({
        tone: 'success',
        message: 'Release registered. Run screening when ready.',
      })
      await loadRecord(normalizedId, false)
    } catch (cause) {
      setTransaction({
        phase: 'error',
        action: 'register',
        message: cause instanceof Error ? cause.message : 'Registration failed.',
      })
    }
  }

  async function handleScreen() {
    const error = validateReleaseId(screenId)
    setScreenError(error ?? undefined)
    if (error) return
    if (!wallet.address) {
      setNotice({ tone: 'error', message: 'Connect a wallet first.' })
      return
    }

    setNotice(null)
    setTransaction({ phase: 'preparing', action: 'screen', message: 'Preparing screening.' })
    try {
      await screenRelease(wallet.address, screenId, phaseHandler('screen'))
      setNotice({
        tone: 'success',
        message: 'Screening finalized and recorded on GenLayer.',
      })
      await loadRecord(screenId, false)
    } catch (cause) {
      setTransaction({
        phase: 'error',
        action: 'screen',
        message: cause instanceof Error ? cause.message : 'Screening failed.',
      })
    }
  }

  async function handleConnect() {
    try {
      await wallet.connect()
      setNotice({ tone: 'success', message: 'Wallet connected. Reads are ready; writes will ask for GenLayer signing.' })
    } catch (cause) {
      setNotice({
        tone: 'error',
        message: cause instanceof Error ? cause.message : 'Wallet connection failed.',
      })
    }
  }

  async function copyContract() {
    await navigator.clipboard.writeText(CONTRACT_ADDRESS)
    setNotice({ tone: 'success', message: 'Contract address copied.' })
  }

  return (
    <div className="app-shell">
      <Header
        address={wallet.address}
        connecting={wallet.connecting}
        hasProvider={wallet.hasProvider}
        onConnect={handleConnect}
        onDisconnect={wallet.disconnect}
      />

      <div className="contract-strip">
        <div className="contract-inner">
          <span className="strip-label">Deployed contract</span>
          <code>{CONTRACT_ADDRESS}</code>
          <button type="button" onClick={copyContract} title="Copy contract address">
            <Clipboard size={14} aria-hidden="true" />
          </button>
          <a href={CONTRACT_URL} target="_blank" rel="noreferrer">
            Explorer
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </div>

      {notice && (
        <div className={`notice notice-${notice.tone}`} role="status">
          {notice.tone === 'success' ? (
            <CheckCircle2 size={17} aria-hidden="true" />
          ) : notice.tone === 'error' ? (
            <Info size={17} aria-hidden="true" />
          ) : (
            <Info size={17} aria-hidden="true" />
          )}
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <main className="main-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Release admission workbench</p>
            <h1>Dependency Risk Console</h1>
            <p>
              Register a CycloneDX SBOM, run live OSV screening, and inspect the
              finalized GenLayer decision.
            </p>
          </div>
          <div className="heading-meta">
            <span>
              <ShieldCheck size={16} aria-hidden="true" />
              Consensus-backed
            </span>
            <span>
              <TerminalSquare size={16} aria-hidden="true" />
              Real contract writes
            </span>
          </div>
        </section>

        <TransactionBanner state={transaction} />

        <div className="workbench-grid">
          <RegisterPanel
            form={registerForm}
            errors={registerErrors}
            busy={busy}
            connected={Boolean(wallet.address)}
            onChange={updateForm}
            onReset={() => {
              setRegisterForm(SAMPLE_FORM)
              setRegisterErrors({})
            }}
            onSubmit={handleRegister}
          />
          <ScreenPanel
            releaseId={screenId}
            error={screenError}
            busy={busy}
            reading={reading}
            connected={Boolean(wallet.address)}
            result={screening}
            onChange={(value) => {
              setScreenId(value)
              setScreenError(undefined)
            }}
            onRead={() => void loadRecord(screenId)}
            onScreen={handleScreen}
            onSample={() => {
              setScreenId(SAMPLE_RELEASE_ID)
              void loadRecord(SAMPLE_RELEASE_ID)
            }}
          />
        </div>

        <ScreeningResult result={screening} reading={reading} />

        <section className="reference-band">
          <div className="reference-intro">
            <p className="eyebrow">How the gate decides</p>
            <h2>One record, three admission states.</h2>
            <p>
              The contract fetches the SBOM and OSV data in a validator-backed
              nondeterministic block. The final decision is deterministic.
            </p>
          </div>
          <div className="policy-list">
            <div>
              <span className="policy-dot clear" />
              <div>
                <strong>Clear</strong>
                <p>Identity matches, coverage is complete, findings stay within policy.</p>
              </div>
            </div>
            <div>
              <span className="policy-dot review" />
              <div>
                <strong>Review required</strong>
                <p>Coverage is incomplete, truncated, unsupported, or identity does not match.</p>
              </div>
            </div>
            <div>
              <span className="policy-dot blocked" />
              <div>
                <strong>Blocked</strong>
                <p>The advisory count exceeds the publisher limit.</p>
              </div>
            </div>
          </div>
          <div className="reference-links">
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">
              <GitBranch size={16} aria-hidden="true" />
              Contract source
            </a>
            <a href="https://docs.genlayer.com/" target="_blank" rel="noreferrer">
              <BookOpen size={16} aria-hidden="true" />
              GenLayer docs
            </a>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <span>Dependency Risk Console</span>
        <span>Built on GenLayer StudioNet</span>
      </footer>
    </div>
  )
}

export default App

