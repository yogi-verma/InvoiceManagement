function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function csvEscape(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function downloadInvoicesCsv(invoices, filename = 'invoices.csv') {
  const headers = ['Invoice ID', 'Customer', 'Company', 'Issue Date', 'Due Date', 'Status', 'Total']
  const rows = invoices.map((inv) => [
    inv.id,
    inv.customer.name,
    inv.customer.company,
    inv.issueDate,
    inv.dueDate,
    inv.status,
    inv.total,
  ])
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  triggerDownload(csv, filename, 'text/csv;charset=utf-8;')
}

export function downloadInvoiceDetails(invoice) {
  const lines = [
    `Invoice ${invoice.id}`,
    `Status: ${invoice.status}`,
    `Bill To: ${invoice.customer.name} (${invoice.customer.company})`,
    `Email: ${invoice.customer.email}`,
    `Issue Date: ${invoice.issueDate}`,
    `Due Date: ${invoice.dueDate}`,
    '',
    'Line Items:',
    ...invoice.lineItems.map(
      (item) =>
        `- ${item.description} | Qty: ${item.quantity} | Unit Price: ${item.unitPrice} | Line Total: ${(
          item.quantity * item.unitPrice
        ).toFixed(2)}`,
    ),
    '',
    `Total: ${invoice.currency} ${invoice.total}`,
    '',
    invoice.notes ?? '',
  ]
  triggerDownload(lines.join('\n'), `${invoice.id}.txt`, 'text/plain;charset=utf-8;')
}

const SAMPLE_BULK_INVOICES = [
  {
    customer: { name: 'Jane Doe', company: 'Acme Logistics', email: 'billing@acmelogistics.com' },
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    status: 'pending',
    currency: 'INR',
    lineItems: [
      { description: 'Freight Charges - FTL', quantity: 2, unitPrice: 450.5 },
      { description: 'Fuel Surcharge', quantity: 1, unitPrice: 75 },
    ],
    notes: 'Thank you for your business.',
  },
]

export function downloadBulkInvoiceTemplate() {
  triggerDownload(
    JSON.stringify(SAMPLE_BULK_INVOICES, null, 2),
    'invoice-bulk-template.json',
    'application/json;charset=utf-8;',
  )
}
