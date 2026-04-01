import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { API_BASE_URL } from '../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Username/email and password are required')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await login(usernameOrEmail.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Could not sign in')
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
            <h2>Sign in to your workspace</h2>
            <p className="hint">Use your username or email and password to continue.</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
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

            {error ? <p className="error-banner">{error}</p> : null}

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}