import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { API_BASE_URL, apiRequest } from '../lib/api'
import type { Project } from '../types/api'

export function DashboardPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const initials = useMemo(() => {
    if (!user?.username) {
      return 'KT'
    }
    return user.username.slice(0, 2).toUpperCase()
  }, [user?.username])

  const loadProjects = useCallback(async () => {
    if (!token) {
      return
    }

    setProjectsLoading(true)
    setProjectsError(null)

    try {
      const result = await apiRequest<Project[]>('/projects', { method: 'GET' }, token)
      setProjects(result)
    } catch (err) {
      if (err instanceof Error) {
        setProjectsError(err.message)
      } else {
        setProjectsError('Could not load projects')
      }
    } finally {
      setProjectsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    const normalizedName = name.trim()
    const normalizedKey = projectKey.trim().toUpperCase()

    if (!normalizedName || !normalizedKey) {
      setProjectsError('Name and key are required')
      return
    }

    setCreating(true)
    setProjectsError(null)

    try {
      const created = await apiRequest<Project>(
        '/projects',
        {
          method: 'POST',
          body: JSON.stringify({
            name: normalizedName,
            projectKey: normalizedKey,
            description: description.trim() || null,
          }),
        },
        token,
      )

      setProjects((current) => [created, ...current])
      setName('')
      setProjectKey('')
      setDescription('')
    } catch (err) {
      if (err instanceof Error) {
        setProjectsError(err.message)
      } else {
        setProjectsError('Could not create project')
      }
    } finally {
      setCreating(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="screen">
      <section className="panel dashboard-panel">
        <header className="dashboard-header">
          <div className="identity">
            <div className="avatar">{initials}</div>
            <div>
              <p className="eyebrow">Workspace console</p>
              <h1>{user?.fullName || user?.username || 'KigenTask User'}</h1>
              <p className="hint">{user?.email}</p>
            </div>
          </div>
          <button className="secondary-button" onClick={handleLogout}>
            Sign out
          </button>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <p className="stat-label">Projects</p>
            <p className="stat-value">{projects.length}</p>
            <p className="hint">Total linked to your account</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">User status</p>
            <p className="stat-value">{user?.active ? 'Active' : 'Inactive'}</p>
            <p className="hint">Permission to create and edit</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">API base URL</p>
            <p className="stat-value mono">{API_BASE_URL}</p>
            <p className="hint">Current environment endpoint</p>
          </article>
        </section>

        <section className="content-grid">
          <article className="card">
            <h2>Create project</h2>
            <p className="hint">Quick action to validate backend connectivity from UI.</p>

            <form className="form" onSubmit={handleCreateProject}>
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Task Platform"
                  maxLength={120}
                />
              </label>

              <label className="field">
                <span>Key</span>
                <input
                  type="text"
                  value={projectKey}
                  onChange={(event) => setProjectKey(event.target.value)}
                  placeholder="TP"
                  maxLength={20}
                />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional description"
                  maxLength={3000}
                  rows={4}
                />
              </label>

              <button className="primary-button" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create project'}
              </button>
            </form>
          </article>

          <article className="card">
            <div className="card-title-row">
              <h2>Projects</h2>
              <button className="secondary-button" onClick={() => void loadProjects()}>
                Refresh
              </button>
            </div>

            {projectsError ? <p className="error-banner">{projectsError}</p> : null}

            {projectsLoading ? <p className="hint">Loading projects...</p> : null}

            {!projectsLoading && projects.length === 0 ? <p className="hint">No projects yet, create the first one from this dashboard.</p> : null}

            <ul className="project-list">
              {projects.map((project) => (
                <li key={project.id} className="project-item">
                  <p className="project-key">{project.projectKey}</p>
                  <p className="project-name">{project.name}</p>
                  <p className="project-description">{project.description || 'No description'}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </section>
    </main>
  )
}