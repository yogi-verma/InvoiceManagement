import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import { fetchInvoiceById, deleteInvoices } from '../api/invoiceService'
import { formatCurrency, formatDate } from '../lib/formatters'
import { downloadInvoiceDetails } from '../lib/download'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'

export default function InvoiceDetailsPage() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { permissions } = useAuth()
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => fetchInvoiceById(invoiceId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoices([invoiceId]),
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      showToast(`Invoice ${invoiceId} deleted successfully.`, { type: 'success' })
      navigate('/invoices')
    },
    onError: (err) => {
      setConfirmOpen(false)
      showToast(err.message ?? 'Failed to delete invoice.', { type: 'error' })
    },
  })

  function handleDelete() {
    setConfirmOpen(true)
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">Loading invoice…</div>
  }

  if (isError) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="mb-4 flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </button>
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error.message}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/invoices')}
        className="mb-4 flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Invoice {invoice.id}</h2>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canExport && (
            <button
              type="button"
              onClick={() => downloadInvoiceDetails(invoice)}
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </button>
          )}
          {permissions.canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/40 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-slate-800"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Billed To</p>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.customer.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.customer.company}</p>
          <p className="text-sm text-slate-500 dark:text-slate-500">{invoice.customer.email}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Summary</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Currency: {invoice.currency}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Issue Date: {formatDate(invoice.issueDate)}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Due Date: {formatDate(invoice.dueDate)}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(invoice.total, invoice.currency)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Description</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Qty</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Unit Price</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoice.lineItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.description}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                  {formatCurrency(item.unitPrice, invoice.currency)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                Total
              </td>
              <td className="px-4 py-3 text-right text-base font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(invoice.total, invoice.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.notes && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{invoice.notes}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete invoice ${invoice.id}?`}
        message="This action cannot be undone."
        isConfirming={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
