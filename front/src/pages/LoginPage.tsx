import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { API_BASE_URL } from '../lib/api'

type AuthMode = 'login' | 'register'

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

  const handleGoogleCredential = useCallback(
    async (credential?: string) => {
      if (!credential) {
        setError('Google sign-in did not return a credential')
        return
      }

      setError(null)
      setIsGoogleSubmitting(true)

      try {
        await loginWithGoogle(credential)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Could not sign in with Google')
        }
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
          setError('Username/email and password are required')
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
        setError('Username, email and password are required to register')
        return
      }

      if (registerPassword.length < 8) {
        setError('Password must contain at least 8 characters')
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
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(isRegisterMode ? 'Could not create account' : 'Could not sign in')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="screen login-screen">
      <section className="panel login-shell">
        <aside className="login-aside">
          <p className="eyebrow">KigenTask Platform</p>
          <h1>Workspace control room</h1>
          <p className="hint">
            Manage projects, tasks and comments from a single JWT-secured dashboard connected to the
            API in real time.
          </p>
          <ul className="feature-list">
            <li>JWT authentication and protected routes</li>
            <li>Project creation and listing</li>
            <li>Ready to evolve with tasks and comments</li>
          </ul>
          <p className="api-chip">API {API_BASE_URL}</p>
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

            {error ? <p className="error-banner">{error}</p> : null}

            <button className="primary-button" type="submit" disabled={isSubmitting || isGoogleSubmitting}>
              {isSubmitting ? (isRegisterMode ? 'Creating account...' : 'Signing in...') : isRegisterMode ? 'Create account' : 'Sign in'}
            </button>

            <div className="oauth-divider">
              <span>or continue with</span>
            </div>

            {googleClientId ? (
              <div className="google-signin-block">
                <div ref={googleButtonRef} className="google-button-slot" />
                {isGoogleSubmitting ? <p className="hint">Signing in with Google...</p> : null}
                <p className="hint oauth-help">
                  If Google shows invalid_client or no registered origin, add{' '}
                  <span className="mono-inline">{currentOrigin}</span> to Authorized JavaScript origins
                  in your Google Cloud OAuth client.
                </p>
              </div>
            ) : (
              <p className="hint">
                Google sign-in is disabled in this environment, configure VITE_GOOGLE_CLIENT_ID
                to enable it.
              </p>
            )}
          </form>
        </section>
      </section>
    </main>
  )
}