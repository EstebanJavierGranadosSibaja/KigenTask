import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

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
    <main className="screen">
      <section className="panel login-panel">
        <div className="brand-block">
          <p className="eyebrow">KigenTask Platform</p>
          <h1>Sign in to your workspace</h1>
          <p className="hint">Use your API credentials to load projects, tasks and comments.</p>
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
    </main>
  )
}