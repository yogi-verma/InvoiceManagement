import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { addInvoice } from '../api/invoiceService'
import { validateInvoiceInput } from '../lib/invoiceValidation'
import { formatCurrency } from '../lib/formatters'
import { useToast } from '../context/useToast'

const EMPTY_LINE_ITEM = { description: '', quantity: 1, unitPrice: 0 }

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
const labelClass = 'text-xs font-medium text-slate-600 dark:text-slate-400'

function initialForm() {
  return {
    name: '',
    company: '',
    email: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    status: 'pending',
    currency: 'INR',
    notes: '',
  }
}

export default function SingleInvoiceModal({ open, onClose }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm] = useState(initialForm)
  const [lineItems, setLineItems] = useState([{ ...EMPTY_LINE_ITEM }])
  const [errors, setErrors] = useState([])

  const mutation = useMutation({
    mutationFn: addInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      showToast('Invoice created successfully.', { type: 'success' })
      handleClose()
    },
    onError: (err) => {
      showToast(err.message ?? 'Failed to create invoice.', { type: 'error' })
    },
  })

  function handleClose() {
    setForm(initialForm())
    setLineItems([{ ...EMPTY_LINE_ITEM }])
    setErrors([])
    onClose()
  }

  function updateLineItem(index, field, value) {
    setLineItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)))
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { ...EMPTY_LINE_ITEM }])
  }

  function removeLineItem(index) {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev))
  }

  const total = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)

  function handleSubmit(e) {
    e.preventDefault()
    const input = {
      customer: { name: form.name, company: form.company, email: form.email },
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: form.status,
      currency: form.currency,
      lineItems,
      notes: form.notes,
    }
    const validationErrors = validateInvoiceInput(input)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    mutation.mutate(input)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Single Invoice"
      description="Fill in the invoice details below."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.length > 0 && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            <ul className="list-inside list-disc space-y-0.5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Customer Name</span>
            <input
              className={`mt-1 ${inputClass}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Company</span>
            <input
              className={`mt-1 ${inputClass}`}
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              className={`mt-1 ${inputClass}`}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Issue Date</span>
            <input
              type="date"
              className={`mt-1 ${inputClass}`}
              value={form.issueDate}
              onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Due Date</span>
            <input
              type="date"
              className={`mt-1 ${inputClass}`}
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Status</span>
            <select
              className={`mt-1 ${inputClass}`}
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Currency</span>
            <input
              disabled
              value="INR (₹)"
              className={`mt-1 ${inputClass} cursor-not-allowed text-slate-500 dark:text-slate-400`}
            />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className={labelClass}>Line Items</span>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add row
            </button>
          </div>

          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="hidden grid-cols-[1fr_72px_112px_112px_32px] gap-2 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:grid dark:bg-slate-800/50 dark:text-slate-400">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Line Total</span>
              <span />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {lineItems.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_72px_112px_112px_32px] sm:items-center"
                  >
                    <input
                      placeholder="Description"
                      className={inputClass}
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2 sm:contents">
                      <label className="sm:hidden">
                        <span className="text-xs text-slate-400">Qty</span>
                        <input
                          type="number"
                          min="1"
                          className={`${inputClass} text-right`}
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        />
                      </label>
                      <input
                        type="number"
                        min="1"
                        className={`${inputClass} hidden text-right sm:block`}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      />
                      <label className="sm:hidden">
                        <span className="text-xs text-slate-400">Unit Price</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`${inputClass} text-right`}
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                        />
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`${inputClass} hidden text-right sm:block`}
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                      />
                      <div className="flex flex-col justify-center sm:items-end">
                        <span className="text-xs text-slate-400 sm:hidden">Line Total</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {formatCurrency(lineTotal, form.currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      aria-label="Remove line item"
                      className="justify-self-end rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <label className="block">
          <span className={labelClass}>Notes</span>
          <textarea
            rows={2}
            className={`mt-1 ${inputClass}`}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>

        <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
          <span className="text-slate-500 dark:text-slate-400">Total</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(total, form.currency)}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating…' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
