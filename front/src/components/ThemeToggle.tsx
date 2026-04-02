import { useTheme } from '../context/useTheme'

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleMode}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className={`theme-toggle-thumb ${isDark ? 'is-dark' : 'is-light'}`} />
      </span>
      <span className="theme-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}
