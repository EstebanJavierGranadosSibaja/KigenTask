import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppAlert } from '../components/AppAlert'
import { useAuth } from '../context/useAuth'

type AuthMode = 'login' | 'register'

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,50}$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/

export function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<AuthMode>('login')
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerFullName, setRegisterFullName] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  const isRegisterMode = mode === 'register'

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError(null)
  }

  function mapErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }
    return fallback
  }

  const handleGoogleCredential = useCallback(
    async (credential?: string) => {
      if (!credential) {
        setError('Google sign-in did not return a valid credential')
        return
      }

      setError(null)
      setIsGoogleSubmitting(true)

      try {
        await loginWithGoogle(credential)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        setError(mapErrorMessage(err, 'Unable to sign in with Google right now'))
      } finally {
        setIsGoogleSubmitting(false)
      }
    },
    [loginWithGoogle, navigate],
  )

  useEffect(() => {
    if (!googleClientId) {
      return
    }

    let active = true

    const tryRenderGoogleButton = () => {
      if (!active) {
        return true
      }

      const container = googleButtonRef.current
      const googleAccounts = window.google?.accounts?.id
      if (!container || !googleAccounts) {
        return false
      }

      googleAccounts.initialize({
        client_id: googleClientId,
        callback: (response) => {
          void handleGoogleCredential(response.credential)
        },
      })

      container.innerHTML = ''
      googleAccounts.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 320,
      })

      return true
    }

    if (tryRenderGoogleButton()) {
      return () => {
        active = false
      }
    }

    const intervalId = window.setInterval(() => {
      if (tryRenderGoogleButton()) {
        window.clearInterval(intervalId)
      }
    }, 250)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [googleClientId, handleGoogleCredential])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setIsSubmitting(true)

    try {
      if (!isRegisterMode) {
        if (!usernameOrEmail.trim() || !password.trim()) {
          setError('Enter your username or email, and password')
          return
        }

        await login(usernameOrEmail.trim(), password)
        navigate('/dashboard', { replace: true })
        return
      }

      const normalizedUsername = registerUsername.trim()
      const normalizedEmail = registerEmail.trim()
      const normalizedFullName = registerFullName.trim()

      if (!normalizedUsername || !normalizedEmail || !registerPassword.trim()) {
        setError('Username, email, and password are required')
        return
      }

      if (!USERNAME_PATTERN.test(normalizedUsername)) {
        setError('Username must be 3-50 characters and use only letters, numbers, or underscore')
        return
      }

      if (!PASSWORD_PATTERN.test(registerPassword)) {
        setError('Password must include uppercase, lowercase, number, and symbol')
        return
      }

      if (registerPassword !== registerConfirmPassword) {
        setError('Password confirmation does not match')
        return
      }

      await register({
        username: normalizedUsername,
        email: normalizedEmail,
        password: registerPassword,
        fullName: normalizedFullName || undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(mapErrorMessage(err, isRegisterMode ? 'Unable to create your account' : 'Unable to sign in'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="screen login-screen">
      <div className="login-orb orb-a" aria-hidden="true" />
      <div className="login-orb orb-b" aria-hidden="true" />

      <section className="panel login-shell glass-panel">
        <aside className="login-aside">
          <p className="eyebrow">KigenTask Workspace</p>
          <h1>Organize work that actually moves</h1>
          <p className="hint">
            Plan projects, track tasks, and share progress updates from one clean workspace.
          </p>
          <ul className="feature-list">
            <li>Secure access with credentials or Google</li>
            <li>Project, task, and comment workflow in one place</li>
            <li>Built for desktop and mobile productivity</li>
          </ul>
          <div className="trust-strip">
            <span className="trust-chip">JWT secured</span>
            <span className="trust-chip">Google ready</span>
            <span className="trust-chip">Fast workspace UI</span>
          </div>
        </aside>

        <section className="login-panel">
          <div className="brand-block">
            <h2>{isRegisterMode ? 'Create your account' : 'Sign in to your workspace'}</h2>
            <p className="hint">
              {isRegisterMode
                ? 'Register with username, email and password to access the app.'
                : 'Use your username or email and password to continue.'}
            </p>
          </div>

          <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={`mode-button ${!isRegisterMode ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`mode-button ${isRegisterMode ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Register
            </button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            {isRegisterMode ? (
              <>
                <label className="field">
                  <span>Username</span>
                  <input
                    type="text"
                    value={registerUsername}
                    onChange={(event) => setRegisterUsername(event.target.value)}
                    placeholder="esteban"
                    autoComplete="username"
                  />
                </label>

                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="esteban@email.com"
                    autoComplete="email"
                  />
                </label>

                <label className="field">
                  <span>Full name (optional)</span>
                  <input
                    type="text"
                    value={registerFullName}
                    onChange={(event) => setRegisterFullName(event.target.value)}
                    placeholder="Esteban Granados"
                    autoComplete="name"
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    placeholder="Password123!"
                    autoComplete="new-password"
                  />
                </label>

                <p className="hint compact">
                  Use at least 8 characters including uppercase, lowercase, number, and symbol.
                </p>

                <label className="field">
                  <span>Confirm password</span>
                  <input
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                    placeholder="Password123!"
                    autoComplete="new-password"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="field">
                  <span>Username or email</span>
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(event) => setUsernameOrEmail(event.target.value)}
                    placeholder="esteban"
                    autoComplete="username"
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password123!"
                    autoComplete="current-password"
                  />
                </label>
              </>
            )}

            {error ? <AppAlert variant="error" title="Action required" message={error} onClose={() => setError(null)} /> : null}

            <button className="primary-button" type="submit" disabled={isSubmitting || isGoogleSubmitting}>
              {isSubmitting ? (isRegisterMode ? 'Creating account...' : 'Signing in...') : isRegisterMode ? 'Create account' : 'Sign in'}
            </button>

            <button
              className="secondary-button auth-switch-cta"
              type="button"
              onClick={() => switchMode(isRegisterMode ? 'login' : 'register')}
              disabled={isSubmitting || isGoogleSubmitting}
            >
              {isRegisterMode ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>

            <div className="oauth-divider">
              <span>or continue with</span>
            </div>

            {googleClientId ? (
              <div className="google-signin-block">
                <div ref={googleButtonRef} className="google-button-slot" />
                {isGoogleSubmitting ? <p className="hint">Signing in with Google...</p> : null}
                <AppAlert
                  variant="info"
                  title="Google sign-in setup"
                  message={
                    <>
                      If Google shows <strong>invalid_client</strong> or <strong>no registered origin</strong>,
                      add <span className="mono-inline">{currentOrigin}</span> to Authorized JavaScript origins.
                    </>
                  }
                />
              </div>
            ) : (
              <AppAlert
                variant="warning"
                title="Google login disabled"
                message="Set VITE_GOOGLE_CLIENT_ID in your frontend environment to enable Google sign-in."
              />
            )}
          </form>
        </section>
      </section>
    </main>
  )
}