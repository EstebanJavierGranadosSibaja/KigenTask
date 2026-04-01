import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, bootstrapping } = useAuth()

  if (bootstrapping) {
    return (
      <main className="screen">
        <section className="panel loading-panel">
          <p>Loading session...</p>
        </section>
      </main>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}