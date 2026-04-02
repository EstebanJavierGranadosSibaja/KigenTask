import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppAlert, type AlertVariant } from '../components/AppAlert'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../context/useAuth'
import { apiRequest } from '../lib/api'
import type { Project, Task, TaskComment, TaskPriority, TaskStatus } from '../types/api'

const TASK_STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']
const TASK_PRIORITY_OPTIONS: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

type NoticeState = {
  variant: AlertVariant
  title?: string
  message: string
} | null

type ConfirmState = {
  kind: 'project' | 'task'
  id: number
  title: string
  message: string
} | null

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return 'No due date'
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString()
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Just now'
  }
  return date.toLocaleString()
}

function mapErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

export function DashboardPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const [projectName, setProjectName] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [projectSubmitting, setProjectSubmitting] = useState(false)
  const [projectActionId, setProjectActionId] = useState<number | null>(null)

  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskActionId, setTaskActionId] = useState<number | null>(null)

  const [comments, setComments] = useState<TaskComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const initials = useMemo(() => {
    if (!user?.username) {
      return 'KT'
    }
    return user.username.slice(0, 2).toUpperCase()
  }, [user?.username])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  )

  const openTasksCount = useMemo(
    () => tasks.filter((task) => task.status !== 'DONE' && task.status !== 'CANCELLED').length,
    [tasks],
  )

  const doneTasksCount = useMemo(
    () => tasks.filter((task) => task.status === 'DONE').length,
    [tasks],
  )

  const isEditingProject = editingProjectId !== null

  function showNotice(variant: AlertVariant, message: string, title?: string) {
    setNotice({ variant, message, title })
  }

  useEffect(() => {
    if (!notice) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null)
    }, 4200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [notice])

  function resetProjectForm() {
    setProjectName('')
    setProjectKey('')
    setProjectDescription('')
    setEditingProjectId(null)
  }

  const loadProjects = useCallback(async () => {
    if (!token) {
      return
    }

    setProjectsLoading(true)
    setProjectsError(null)

    try {
      const result = await apiRequest<Project[]>('/projects', { method: 'GET' }, token)
      setProjects(result)
      setSelectedProjectId((current) => {
        if (result.length === 0) {
          return null
        }

        if (current && result.some((project) => project.id === current)) {
          return current
        }

        return result[0].id
      })
    } catch (err) {
      setProjectsError(mapErrorMessage(err, 'We could not load your projects. Please refresh.'))
    } finally {
      setProjectsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const loadTasks = useCallback(async () => {
    if (!token || !selectedProjectId) {
      setTasks([])
      setSelectedTaskId(null)
      setTasksLoading(false)
      return
    }

    setTasksLoading(true)
    setTasksError(null)

    try {
      const result = await apiRequest<Task[]>(`/tasks?projectId=${selectedProjectId}`, { method: 'GET' }, token)
      setTasks(result)
      setSelectedTaskId((current) => {
        if (result.length === 0) {
          return null
        }

        if (current && result.some((task) => task.id === current)) {
          return current
        }

        return result[0].id
      })
    } catch (err) {
      setTasksError(mapErrorMessage(err, 'We could not load project tasks. Please refresh.'))
    } finally {
      setTasksLoading(false)
    }
  }, [selectedProjectId, token])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const loadComments = useCallback(async () => {
    if (!token || !selectedTaskId) {
      setComments([])
      setCommentsLoading(false)
      return
    }

    setCommentsLoading(true)
    setCommentsError(null)

    try {
      const result = await apiRequest<TaskComment[]>(`/tasks/${selectedTaskId}/comments`, { method: 'GET' }, token)
      setComments(result)
    } catch (err) {
      setCommentsError(mapErrorMessage(err, 'We could not load comments for this task.'))
    } finally {
      setCommentsLoading(false)
    }
  }, [selectedTaskId, token])

  useEffect(() => {
    void loadComments()
  }, [loadComments])

  async function handleSubmitProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    const normalizedName = projectName.trim()
    const normalizedKey = projectKey.trim().toUpperCase()

    if (!normalizedName || !normalizedKey) {
      setProjectsError('Project name and key are required')
      return
    }

    setProjectSubmitting(true)
    setProjectsError(null)

    try {
      if (isEditingProject && editingProjectId) {
        const updated = await apiRequest<Project>(
          `/projects/${editingProjectId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              name: normalizedName,
              projectKey: normalizedKey,
              description: projectDescription.trim() || null,
            }),
          },
          token,
        )

        setProjects((current) => current.map((project) => (project.id === updated.id ? updated : project)))
        setSelectedProjectId(updated.id)
        resetProjectForm()
        showNotice('success', 'Project updated successfully')
      } else {
        const created = await apiRequest<Project>(
          '/projects',
          {
            method: 'POST',
            body: JSON.stringify({
              name: normalizedName,
              projectKey: normalizedKey,
              description: projectDescription.trim() || null,
            }),
          },
          token,
        )

        setProjects((current) => [created, ...current])
        setSelectedProjectId(created.id)
        resetProjectForm()
        showNotice('success', 'Project created successfully')
      }
    } catch (err) {
      setProjectsError(
        mapErrorMessage(err, isEditingProject ? 'Unable to update this project' : 'Unable to create this project'),
      )
    } finally {
      setProjectSubmitting(false)
    }
  }

  function handleStartProjectEdit(project: Project) {
    setEditingProjectId(project.id)
    setProjectName(project.name)
    setProjectKey(project.projectKey)
    setProjectDescription(project.description ?? '')
    setProjectsError(null)
  }

  async function handleDeleteProject(projectId: number) {
    const target = projects.find((project) => project.id === projectId)
    const targetName = target?.name ?? 'this project'
    setConfirmState({
      kind: 'project',
      id: projectId,
      title: 'Delete project',
      message: `Delete ${targetName}? This action will also remove related tasks and comments.`,
    })
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !selectedProjectId) {
      return
    }

    const normalizedTitle = taskTitle.trim()

    if (!normalizedTitle) {
      setTasksError('Task title is required')
      return
    }

    setTaskSubmitting(true)
    setTasksError(null)

    try {
      const created = await apiRequest<Task>(
        '/tasks',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: selectedProjectId,
            title: normalizedTitle,
            description: taskDescription.trim() || null,
            priority: taskPriority,
            dueDate: taskDueDate || null,
          }),
        },
        token,
      )

      setTasks((current) => [created, ...current])
      setSelectedTaskId(created.id)
      setTaskTitle('')
      setTaskDescription('')
      setTaskPriority('MEDIUM')
      setTaskDueDate('')
      showNotice('success', 'Task created successfully')
    } catch (err) {
      setTasksError(mapErrorMessage(err, 'Unable to create this task'))
    } finally {
      setTaskSubmitting(false)
    }
  }

  async function patchTask(taskId: number, payload: Partial<Pick<Task, 'status' | 'priority'>>) {
    if (!token) {
      return
    }

    setTaskActionId(taskId)
    setTasksError(null)

    try {
      const updated = await apiRequest<Task>(
        `/tasks/${taskId}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        },
        token,
      )

      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)))
      showNotice('info', 'Task updated')
    } catch (err) {
      setTasksError(mapErrorMessage(err, 'Unable to update this task'))
    } finally {
      setTaskActionId(null)
    }
  }

  async function handleDeleteTask(taskId: number) {
    const target = tasks.find((task) => task.id === taskId)
    const targetTitle = target?.title ?? 'this task'
    setConfirmState({
      kind: 'task',
      id: taskId,
      title: 'Delete task',
      message: `Delete ${targetTitle}? This action cannot be undone.`,
    })
  }

  async function handleAddComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !selectedTaskId) {
      return
    }

    const normalizedContent = commentContent.trim()
    if (!normalizedContent) {
      setCommentsError('Comment content is required')
      return
    }

    setCommentSubmitting(true)
    setCommentsError(null)

    try {
      const created = await apiRequest<TaskComment>(
        `/tasks/${selectedTaskId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content: normalizedContent }),
        },
        token,
      )

      setComments((current) => [...current, created])
      setCommentContent('')
      showNotice('success', 'Comment added')
    } catch (err) {
      setCommentsError(mapErrorMessage(err, 'Unable to add your comment'))
    } finally {
      setCommentSubmitting(false)
    }
  }

  async function handleConfirmAction() {
    if (!token || !confirmState) {
      return
    }

    const action = confirmState
    setConfirmSubmitting(true)
    setProjectsError(null)
    setTasksError(null)

    try {
      if (action.kind === 'project') {
        setProjectActionId(action.id)
        await apiRequest<void>(`/projects/${action.id}`, { method: 'DELETE' }, token)
        setProjects((current) => current.filter((project) => project.id !== action.id))
        setSelectedProjectId((current) => (current === action.id ? null : current))

        if (editingProjectId === action.id) {
          resetProjectForm()
        }

        showNotice('success', 'Project deleted successfully')
      } else {
        setTaskActionId(action.id)
        await apiRequest<void>(`/tasks/${action.id}`, { method: 'DELETE' }, token)
        setTasks((current) => current.filter((task) => task.id !== action.id))
        setSelectedTaskId((current) => (current === action.id ? null : current))
        showNotice('success', 'Task deleted successfully')
      }

      setConfirmState(null)
    } catch (err) {
      const message = mapErrorMessage(err, action.kind === 'project' ? 'Unable to delete this project' : 'Unable to delete this task')
      if (action.kind === 'project') {
        setProjectsError(message)
      } else {
        setTasksError(message)
      }
    } finally {
      setConfirmSubmitting(false)
      setProjectActionId(null)
      setTaskActionId(null)
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
              <p className="eyebrow">Team workspace</p>
              <h1>{user?.fullName || user?.username || 'Welcome'}</h1>
              <p className="hint">{user?.email}</p>
            </div>
          </div>
          <button className="secondary-button" onClick={handleLogout}>
            Sign out
          </button>
        </header>

        {notice ? (
          <AppAlert
            variant={notice.variant}
            title={notice.title}
            message={notice.message}
            onClose={() => setNotice(null)}
          />
        ) : null}

        <section className="stats-grid">
          <article className="stat-card">
            <p className="stat-label">Projects</p>
            <p className="stat-value">{projects.length}</p>
            <p className="hint">Owned by your account</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">Open tasks</p>
            <p className="stat-value">{openTasksCount}</p>
            <p className="hint">{selectedProject ? `In ${selectedProject.projectKey}` : 'Select a project'}</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">Completed tasks</p>
            <p className="stat-value">{doneTasksCount}</p>
            <p className="hint">{selectedProject ? `In ${selectedProject.projectKey}` : 'Select a project'}</p>
          </article>
        </section>

        <section className="content-grid">
          <article className="card">
            <h2>{isEditingProject ? 'Edit project' : 'Create project'}</h2>
            <p className="hint">Manage project details and keep your workspace organized.</p>

            <form className="form" onSubmit={handleSubmitProject}>
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
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
                  value={projectDescription}
                  onChange={(event) => setProjectDescription(event.target.value)}
                  placeholder="Optional description"
                  maxLength={3000}
                  rows={4}
                />
              </label>

              <div className="action-row">
                <button className="primary-button" type="submit" disabled={projectSubmitting}>
                  {projectSubmitting
                    ? isEditingProject
                      ? 'Saving...'
                      : 'Creating...'
                    : isEditingProject
                      ? 'Save changes'
                      : 'Create project'}
                </button>
                {isEditingProject ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={resetProjectForm}
                    disabled={projectSubmitting}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          <article className="card">
            <div className="card-title-row">
              <h2>Projects</h2>
              <button className="secondary-button" onClick={() => void loadProjects()}>
                Refresh
              </button>
            </div>

            {projectsError ? (
              <AppAlert
                variant="error"
                title="Project action failed"
                message={projectsError}
                onClose={() => setProjectsError(null)}
              />
            ) : null}

            {projectsLoading ? <p className="hint">Loading projects...</p> : null}

            {!projectsLoading && projects.length === 0 ? <p className="hint">No projects yet, create your first one.</p> : null}

            <ul className="project-list">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className={`project-item ${selectedProjectId === project.id ? 'selected' : ''}`}
                >
                  <button
                    className="item-main-button"
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <p className="project-key">{project.projectKey}</p>
                    <p className="project-name">{project.name}</p>
                    <p className="project-description">{project.description || 'No description provided'}</p>
                  </button>

                  <div className="item-actions">
                    <button
                      className="secondary-button small"
                      type="button"
                      onClick={() => handleStartProjectEdit(project)}
                      disabled={projectActionId === project.id || projectSubmitting}
                    >
                      Edit
                    </button>
                    <button
                      className="secondary-button small danger"
                      type="button"
                      onClick={() => void handleDeleteProject(project.id)}
                      disabled={projectActionId === project.id || projectSubmitting}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="content-grid task-grid">
          <article className="card">
            <div className="card-title-row">
              <h2>Tasks</h2>
              {selectedProject ? <p className="hint project-tag">{selectedProject.projectKey}</p> : null}
            </div>

            {!selectedProject ? <p className="hint">Select a project to manage tasks.</p> : null}

            {selectedProject ? (
              <form className="form" onSubmit={handleCreateTask}>
                <label className="field">
                  <span>Title</span>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="Implement project filters"
                    maxLength={200}
                  />
                </label>

                <div className="split-fields">
                  <label className="field">
                    <span>Priority</span>
                    <select
                      className="field-control"
                      value={taskPriority}
                      onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                    >
                      {TASK_PRIORITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {PRIORITY_LABEL[option]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Due date</span>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(event) => setTaskDueDate(event.target.value)}
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Description</span>
                  <textarea
                    value={taskDescription}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    placeholder="Optional task details"
                    maxLength={5000}
                    rows={3}
                  />
                </label>

                <button className="primary-button" type="submit" disabled={taskSubmitting}>
                  {taskSubmitting ? 'Creating task...' : 'Create task'}
                </button>
              </form>
            ) : null}

            {tasksError ? (
              <AppAlert
                variant="error"
                title="Task action failed"
                message={tasksError}
                onClose={() => setTasksError(null)}
              />
            ) : null}

            {tasksLoading ? <p className="hint">Loading tasks...</p> : null}

            {!tasksLoading && selectedProject && tasks.length === 0 ? (
              <p className="hint">No tasks for this project yet.</p>
            ) : null}

            <ul className="project-list">
              {tasks.map((task) => (
                <li key={task.id} className={`project-item ${selectedTaskId === task.id ? 'selected' : ''}`}>
                  <button
                    className="item-main-button"
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <p className="project-name">{task.title}</p>
                    <p className="project-description">{task.description || 'No description provided'}</p>
                    <div className="chip-row">
                      <span className="chip">{STATUS_LABEL[task.status]}</span>
                      <span className="chip">{PRIORITY_LABEL[task.priority]}</span>
                      <span className="chip">{formatDateLabel(task.dueDate)}</span>
                    </div>
                  </button>

                  <div className="item-actions task-actions">
                    <select
                      className="inline-select"
                      value={task.status}
                      onChange={(event) => void patchTask(task.id, { status: event.target.value as TaskStatus })}
                      disabled={taskActionId === task.id}
                    >
                      {TASK_STATUS_OPTIONS.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {STATUS_LABEL[statusOption]}
                        </option>
                      ))}
                    </select>

                    <select
                      className="inline-select"
                      value={task.priority}
                      onChange={(event) =>
                        void patchTask(task.id, {
                          priority: event.target.value as TaskPriority,
                        })
                      }
                      disabled={taskActionId === task.id}
                    >
                      {TASK_PRIORITY_OPTIONS.map((priorityOption) => (
                        <option key={priorityOption} value={priorityOption}>
                          {PRIORITY_LABEL[priorityOption]}
                        </option>
                      ))}
                    </select>

                    <button
                      className="secondary-button small danger"
                      type="button"
                      onClick={() => void handleDeleteTask(task.id)}
                      disabled={taskActionId === task.id}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="card">
            <div className="card-title-row">
              <h2>Comments</h2>
              {selectedTask ? <p className="hint project-tag">{STATUS_LABEL[selectedTask.status]}</p> : null}
            </div>

            {!selectedTask ? <p className="hint">Select a task to read and add comments.</p> : null}

            {selectedTask ? (
              <>
                <p className="project-name">{selectedTask.title}</p>
                <p className="hint">{selectedTask.description || 'No details were added for this task yet'}</p>

                {commentsError ? (
                  <AppAlert
                    variant="error"
                    title="Comment action failed"
                    message={commentsError}
                    onClose={() => setCommentsError(null)}
                  />
                ) : null}
                {commentsLoading ? <p className="hint">Loading comments...</p> : null}

                {!commentsLoading && comments.length === 0 ? (
                  <p className="hint">No comments yet for this task.</p>
                ) : null}

                <ul className="comment-list">
                  {comments.map((comment) => (
                    <li key={comment.id} className="comment-item">
                      <p className="comment-content">{comment.content}</p>
                      <p className="hint mono">{formatDateTimeLabel(comment.createdAt)}</p>
                    </li>
                  ))}
                </ul>

                <form className="form" onSubmit={handleAddComment}>
                  <label className="field">
                    <span>New comment</span>
                    <textarea
                      value={commentContent}
                      onChange={(event) => setCommentContent(event.target.value)}
                      placeholder="Write your update for this task"
                      rows={3}
                      maxLength={3000}
                    />
                  </label>

                  <button className="primary-button" type="submit" disabled={commentSubmitting}>
                    {commentSubmitting ? 'Posting comment...' : 'Add comment'}
                  </button>
                </form>
              </>
            ) : null}
          </article>
        </section>
      </section>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? 'Confirm action'}
        message={confirmState?.message ?? ''}
        confirmLabel="Delete"
        cancelLabel="Keep"
        loading={confirmSubmitting}
        onConfirm={() => {
          void handleConfirmAction()
        }}
        onCancel={() => {
          if (!confirmSubmitting) {
            setConfirmState(null)
          }
        }}
      />
    </main>
  )
}