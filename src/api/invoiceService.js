import { simulateRequest } from './client'
import { MOCK_INVOICES } from '../data/mockInvoices'

function computeStatus(invoice) {
  if (invoice.status === 'paid' || invoice.status === 'draft') return invoice.status
  const isOverdue = new Date(invoice.dueDate) < new Date()
  return isOverdue ? 'overdue' : 'pending'
}

function getField(invoice, field) {
  if (field === 'customer') return invoice.customer.company
  return invoice[field]
}

function withComputedStatus(invoice) {
  return { ...invoice, status: computeStatus(invoice) }
}

export async function fetchInvoices({
  page = 1,
  pageSize = 10,
  search = '',
  status = 'all',
  dateFrom,
  dateTo,
  sortBy = 'issueDate',
  sortDir = 'desc',
} = {}) {
  let results = MOCK_INVOICES.map(withComputedStatus)

  const query = search.trim().toLowerCase()
  if (query) {
    results = results.filter(
      (inv) =>
        inv.id.toLowerCase().includes(query) ||
        inv.customer.name.toLowerCase().includes(query) ||
        inv.customer.company.toLowerCase().includes(query),
    )
  }

  if (status !== 'all') {
    results = results.filter((inv) => inv.status === status)
  }

  if (dateFrom) {
    results = results.filter((inv) => new Date(inv.issueDate) >= new Date(dateFrom))
  }
  if (dateTo) {
    results = results.filter((inv) => new Date(inv.issueDate) <= new Date(dateTo))
  }

  results = [...results].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    const aVal = getField(a, sortBy)
    const bVal = getField(b, sortBy)
    if (aVal < bVal) return -1 * dir
    if (aVal > bVal) return 1 * dir
    return 0
  })

  const total = results.length
  const start = (page - 1) * pageSize
  const paginated = results.slice(start, start + pageSize)

  return simulateRequest({ data: paginated, total, page, pageSize })
}

export async function fetchInvoiceById(id) {
  const invoice = MOCK_INVOICES.find((inv) => inv.id === id)
  if (!invoice) {
    return simulateRequest(true).then(() => {
      throw new Error(`Invoice ${id} not found`)
    })
  }
  return simulateRequest(withComputedStatus(invoice))
}

// Returns every invoice matching the current filters, ignoring pagination (used for CSV export).
export async function fetchAllFilteredInvoices({
  search = '',
  status = 'all',
  dateFrom,
  dateTo,
  sortBy = 'issueDate',
  sortDir = 'desc',
} = {}) {
  const { data } = await fetchInvoices({
    page: 1,
    pageSize: MOCK_INVOICES.length,
    search,
    status,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
  })
  return data
}

export async function deleteInvoices(ids) {
  const idSet = new Set(ids)
  for (let i = MOCK_INVOICES.length - 1; i >= 0; i -= 1) {
    if (idSet.has(MOCK_INVOICES[i].id)) {
      MOCK_INVOICES.splice(i, 1)
    }
  }
  return simulateRequest({ deleted: ids })
}

function nextInvoiceId() {
  let maxNum = 1999
  for (const inv of MOCK_INVOICES) {
    const match = /^INV-(\d+)$/.exec(inv.id)
    if (match) maxNum = Math.max(maxNum, Number(match[1]))
  }
  return `INV-${maxNum + 1}`
}

function buildInvoiceRecord(input, id) {
  const lineItems = input.lineItems.map((item, idx) => ({
    id: `${id}-LI-${idx + 1}`,
    description: item.description,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
  }))
  const total = Math.round(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100

  return {
    id,
    customer: {
      name: input.customer.name,
      company: input.customer.company,
      email: input.customer.email,
    },
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    status: input.status ?? 'pending',
    currency: input.currency ?? 'INR',
    lineItems,
    total,
    notes: input.notes ?? '',
  }
}

export async function addInvoice(input) {
  const record = buildInvoiceRecord(input, nextInvoiceId())
  MOCK_INVOICES.unshift(record)
  return simulateRequest(withComputedStatus(record))
}

export async function addInvoicesBulk(inputs) {
  const created = inputs.map((input) => {
    const record = buildInvoiceRecord(input, nextInvoiceId())
    MOCK_INVOICES.unshift(record)
    return record
  })
  return simulateRequest({ created: created.length })
}

export async function fetchDashboardStats() {
  const all = MOCK_INVOICES.map(withComputedStatus)
  const paid = all.filter((inv) => inv.status === 'paid')

  const revenueByCompany = new Map()
  for (const inv of all) {
    revenueByCompany.set(inv.customer.company, (revenueByCompany.get(inv.customer.company) ?? 0) + inv.total)
  }
  const topCustomer = [...revenueByCompany.entries()].sort((a, b) => b[1] - a[1])[0]

  const stats = {
    totalInvoices: all.length,
    paidInvoices: paid.length,
    overdueInvoices: all.filter((inv) => inv.status === 'overdue').length,
    pendingAmount: all
      .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0),
    totalRevenue: paid.reduce((sum, inv) => sum + inv.total, 0),
    averageInvoiceValue: all.length ? all.reduce((sum, inv) => sum + inv.total, 0) / all.length : 0,
    collectionRate: all.length ? (paid.length / all.length) * 100 : 0,
    topCustomer: topCustomer ? { company: topCustomer[0], revenue: topCustomer[1] } : null,
  }

  return simulateRequest(stats)
}

const STATUS_LIST = ['paid', 'pending', 'overdue', 'draft']

// Aggregated data used to power the dashboard charts (status mix, revenue trend, top customers).
export async function fetchDashboardCharts() {
  const all = MOCK_INVOICES.map(withComputedStatus)

  const statusBreakdown = STATUS_LIST.map((status) => ({
    status,
    count: all.filter((inv) => inv.status === status).length,
  })).filter((entry) => entry.count > 0)

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      revenue: 0,
      invoices: 0,
    }
  })
  const monthByKey = new Map(months.map((m) => [m.key, m]))
  for (const inv of all) {
    const d = new Date(inv.issueDate)
    const bucket = monthByKey.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (bucket) {
      bucket.revenue += inv.total
      bucket.invoices += 1
    }
  }

  const revenueByCompany = new Map()
  for (const inv of all) {
    revenueByCompany.set(inv.customer.company, (revenueByCompany.get(inv.customer.company) ?? 0) + inv.total)
  }
  const topCustomers = [...revenueByCompany.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([company, revenue]) => ({ company, revenue: Math.round(revenue * 100) / 100 }))

  return simulateRequest({
    statusBreakdown,
    monthlyRevenue: months.map(({ month, revenue, invoices }) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
      invoices,
    })),
    topCustomers,
  })
}
