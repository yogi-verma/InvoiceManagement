import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { fetchInvoices, fetchAllFilteredInvoices, deleteInvoices } from '../api/invoiceService'
import { formatCurrency, formatDate } from '../lib/formatters'
import { downloadInvoicesCsv } from '../lib/download'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'draft', label: 'Draft' },
]

const COLUMNS = [
  { key: 'id', label: 'Invoice ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'issueDate', label: 'Issue Date' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
]

const PAGE_SIZE = 10

export default function InvoiceListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { permissions } = useAuth()
  const { showToast } = useToast()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('issueDate')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(new Map())
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const filters = useMemo(
    () => ({ search, status, dateFrom, dateTo, sortBy, sortDir }),
    [search, status, dateFrom, dateTo, sortBy, sortDir],
  )

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['invoices', { ...filters, page, pageSize: PAGE_SIZE }],
    queryFn: () => fetchInvoices({ ...filters, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const deleteMutation = useMutation({
    mutationFn: deleteInvoices,
    onSuccess: (_, deletedIds) => {
      setSelected(new Map())
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      showToast(`${deletedIds.length} invoice(s) deleted successfully.`, { type: 'success' })
    },
    onError: (err) => {
      setConfirmOpen(false)
      showToast(err.message ?? 'Failed to delete invoices.', { type: 'error' })
    },
  })

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
    setPage(1)
  }

  function toggleRow(invoice) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(invoice.id)) {
        next.delete(invoice.id)
      } else {
        next.set(invoice.id, invoice)
      }
      return next
    })
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Map(prev)
      const allSelected = rows.every((row) => next.has(row.id))
      rows.forEach((row) => {
        if (allSelected) {
          next.delete(row.id)
        } else {
          next.set(row.id, row)
        }
      })
      return next
    })
  }

  async function handleExportCsv() {
    if (selected.size > 0) {
      downloadInvoicesCsv(Array.from(selected.values()), 'invoices-selected.csv')
      return
    }
    const all = await fetchAllFilteredInvoices(filters)
    downloadInvoicesCsv(all, 'invoices.csv')
  }

  function handleBulkDelete() {
    if (selected.size === 0) return
    setConfirmOpen(true)
  }

  const allOnPageSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Invoices</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Browse, search and manage all invoices</p>
        </div>
        {permissions.canExport && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export CSV{selected.size > 0 ? ` (${selected.size} selected)` : ''}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search invoice ID or customer..."
            className="w-64 rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
      </div>

      {permissions.canBulkAction && selected.size > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          <span>{selected.size} invoice(s) selected</span>
          <div className="flex items-center gap-2">
            {permissions.canDelete && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/40 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-slate-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Map())}
              className="rounded-md border border-indigo-300 bg-white px-2 py-1 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {isError && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          Failed to load invoices: {error.message}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950/40">
            <tr>
              {permissions.canBulkAction && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label="Select all invoices on this page"
                  />
                </th>
              )}
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="cursor-pointer select-none px-4 py-3 text-left font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading &&
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  </td>
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No invoices match your filters.
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  {permissions.canBulkAction && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(invoice.id)}
                        onChange={() => toggleRow(invoice)}
                        aria-label={`Select invoice ${invoice.id}`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{invoice.id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{invoice.customer.company}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>
          {total === 0 ? 'No results' : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          {isFetching && !isLoading ? ' · updating…' : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} invoice(s)?`}
        message="This action cannot be undone."
        isConfirming={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(Array.from(selected.keys()))}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
