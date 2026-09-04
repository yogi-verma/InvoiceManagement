import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UploadCloud, FileJson, Download, CheckCircle2, AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import { addInvoicesBulk } from '../api/invoiceService'
import { validateInvoiceInput } from '../lib/invoiceValidation'
import { downloadBulkInvoiceTemplate } from '../lib/download'
import { useToast } from '../context/useToast'

export default function BulkInvoiceModal({ open, onClose }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [fileName, setFileName] = useState('')
  const [validInvoices, setValidInvoices] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [parseError, setParseError] = useState('')

  const mutation = useMutation({
    mutationFn: addInvoicesBulk,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      showToast(`${result.created} invoice(s) imported successfully.`, { type: 'success' })
      handleClose()
    },
    onError: (err) => {
      showToast(err.message ?? 'Failed to import invoices.', { type: 'error' })
    },
  })

  function resetState() {
    setFileName('')
    setValidInvoices([])
    setFileErrors([])
    setParseError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    resetState()
    onClose()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    resetState()
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      let parsed
      try {
        parsed = JSON.parse(reader.result)
      } catch {
        setParseError('That file is not valid JSON.')
        return
      }
      if (!Array.isArray(parsed)) {
        setParseError('The JSON file must contain an array of invoice objects.')
        return
      }
      if (parsed.length === 0) {
        setParseError('The JSON array is empty.')
        return
      }

      const errors = []
      parsed.forEach((entry, index) => {
        const entryErrors = validateInvoiceInput(entry)
        if (entryErrors.length > 0) {
          errors.push({ index, errors: entryErrors })
        }
      })

      if (errors.length > 0) {
        setFileErrors(errors)
      } else {
        setValidInvoices(parsed)
      }
    }
    reader.readAsText(file)
  }

  function handleImport() {
    if (validInvoices.length === 0) return
    mutation.mutate(validInvoices)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Bulk Invoice"
      description="Upload a JSON file containing an array of invoices."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={downloadBulkInvoiceTemplate}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <Download className="h-4 w-4" />
          Download sample JSON template
        </button>

        <label
          htmlFor="bulk-invoice-file"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
        >
          <UploadCloud className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Click to choose a .json file
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">Array of invoice objects</span>
          <input
            id="bulk-invoice-file"
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {fileName && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <FileJson className="h-4 w-4 shrink-0" />
            {fileName}
          </div>
        )}

        {parseError && (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0 translate-y-0.5" />
            {parseError}
          </div>
        )}

        {fileErrors.length > 0 && (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            <p className="font-medium">Fix the following before importing:</p>
            {fileErrors.map(({ index, errors }) => (
              <div key={index}>
                <p className="font-medium">Invoice #{index + 1}</p>
                <ul className="list-inside list-disc">
                  {errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {validInvoices.length > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {validInvoices.length} invoice(s) ready to import.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={validInvoices.length === 0 || mutation.isPending}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Importing…' : `Import ${validInvoices.length || ''} Invoice(s)`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
