import type { ReactNode } from 'react'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

type AppAlertProps = {
  variant: AlertVariant
  title?: string
  message: ReactNode
  onClose?: () => void
}

export function AppAlert({ variant, title, message, onClose }: AppAlertProps) {
  return (
    <div className={`app-alert ${variant}`} role="status" aria-live="polite">
      <div className="app-alert-body">
        {title ? <p className="app-alert-title">{title}</p> : null}
        <p className="app-alert-message">{message}</p>
      </div>
      {onClose ? (
        <button type="button" className="app-alert-close" onClick={onClose} aria-label="Dismiss alert">
          Close
        </button>
      ) : null}
    </div>
  )
}

export type { AlertVariant }
