import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/useTheme'
import RoleSwitcher from './RoleSwitcher'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="relative z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div>
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Invoice Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage, track and export your invoices</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <RoleSwitcher />
      </div>
    </header>
  )
}
