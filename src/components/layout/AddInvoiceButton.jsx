import { useEffect, useRef, useState } from 'react'
import { Plus, ChevronDown, FilePlus2, UploadCloud } from 'lucide-react'
import SingleInvoiceModal from '../SingleInvoiceModal'
import BulkInvoiceModal from '../BulkInvoiceModal'
import { useAuth } from '../../context/useAuth'

export default function AddInvoiceButton() {
  const { permissions } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [singleOpen, setSingleOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const containerRef = useRef(null)
  const closeTimeoutRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function openMenu() {
    clearTimeout(closeTimeoutRef.current)
    setMenuOpen(true)
  }

  function scheduleClose() {
    closeTimeoutRef.current = setTimeout(() => setMenuOpen(false), 150)
  }

  if (!permissions.canEdit) return null

  return (
    <>
      <div
        ref={containerRef}
        className="relative"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Invoice
          <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setSingleOpen(true)
              }}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <FilePlus2 className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Add Single Invoice
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  Create one invoice manually
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setBulkOpen(true)
              }}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <UploadCloud className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Add Bulk Invoice
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  Import invoices from a JSON file
                </span>
              </span>
            </button>
          </div>
        )}
      </div>

      <SingleInvoiceModal open={singleOpen} onClose={() => setSingleOpen(false)} />
      <BulkInvoiceModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </>
  )
}
