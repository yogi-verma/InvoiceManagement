import { useCallback, useMemo, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { ToastContext } from './toast-context'

const ICONS = {
  success: { Icon: CheckCircle2, className: 'text-emerald-600' },
  error: { Icon: XCircle, className: 'text-rose-600' },
  info: { Icon: Info, className: 'text-indigo-600' },
}

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, { type = 'info', duration = 3000 } = {}) => {
      idCounter += 1
      const id = idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismissToast(id), duration)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => {
          const { Icon, className } = ICONS[toast.type] ?? ICONS.info
          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Icon className={`h-5 w-5 shrink-0 ${className}`} />
              <p className="flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
