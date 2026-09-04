import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Percent,
  Crown,
  Sparkles,
  LineChart as LineChartIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { fetchDashboardStats, fetchDashboardCharts } from '../api/invoiceService'
import { formatCurrency, formatNumber } from '../lib/formatters'
import AddInvoiceButton from '../components/layout/AddInvoiceButton'
import { useTheme } from '../context/useTheme'

const CARD_CONFIG = [
  {
    key: 'totalInvoices',
    label: 'Total Invoices',
    icon: FileText,
    iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    format: formatNumber,
  },
  {
    key: 'paidInvoices',
    label: 'Paid Invoices',
    icon: CheckCircle2,
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    format: formatNumber,
  },
  {
    key: 'pendingAmount',
    label: 'Pending Amount',
    icon: Clock,
    iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    format: (v) => formatCurrency(v),
  },
  {
    key: 'overdueInvoices',
    label: 'Overdue Invoices',
    icon: AlertTriangle,
    iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    format: formatNumber,
  },
]

const EXCELLENCE_CARDS = [
  {
    key: 'totalRevenue',
    label: 'Total Revenue Collected',
    icon: TrendingUp,
    gradient: 'from-indigo-500 via-indigo-600 to-blue-700',
    render: (data) => formatCurrency(data.totalRevenue),
  },
  {
    key: 'averageInvoiceValue',
    label: 'Average Invoice Value',
    icon: BarChart3,
    gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
    render: (data) => formatCurrency(data.averageInvoiceValue),
  },
  {
    key: 'collectionRate',
    label: 'Collection Rate',
    icon: Percent,
    gradient: 'from-amber-500 via-orange-500 to-orange-600',
    render: (data) => `${data.collectionRate.toFixed(1)}%`,
  },
  {
    key: 'topCustomer',
    label: 'Top Client',
    icon: Crown,
    gradient: 'from-rose-500 via-pink-600 to-fuchsia-700',
    render: (data) => data.topCustomer?.company ?? '—',
    sub: (data) => (data.topCustomer ? `${formatCurrency(data.topCustomer.revenue)} billed` : 'No data yet'),
  },
]

const STATUS_COLORS = {
  paid: '#10b981',
  pending: '#f59e0b',
  overdue: '#f43f5e',
  draft: '#94a3b8',
}

export default function DashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const gridColor = isDark ? '#1e293b' : '#e2e8f0'
  const axisColor = isDark ? '#94a3b8' : '#64748b'
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    borderRadius: 8,
    color: isDark ? '#e2e8f0' : '#0f172a',
    fontSize: 12,
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: fetchDashboardCharts,
  })

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Overview of your invoice activity</p>
        </div>
        <AddInvoiceButton />
      </div>

      {isError && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          Failed to load dashboard stats: {error.message}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARD_CONFIG.map(({ key, label, icon: Icon, iconClass, format }) => (
          <div
            key={key}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {isLoading ? (
                  <span className="inline-block h-6 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                ) : (
                  format(data[key])
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Business Excellence
          </h3>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXCELLENCE_CARDS.map(({ key, label, icon: Icon, gradient, render, sub }) => (
            <div
              key={key}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl`}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-medium text-white/80">{label}</p>
                <p className="mt-1 truncate text-2xl font-bold tracking-tight">
                  {isLoading ? (
                    <span className="inline-block h-7 w-24 animate-pulse rounded bg-white/20" />
                  ) : (
                    render(data)
                  )}
                </p>
                {sub && !isLoading && <p className="mt-1 text-xs text-white/70">{sub(data)}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <LineChartIcon className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Analytics
          </h3>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Revenue Trend</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Invoiced amount over the last 6 months</p>
            <div className="mt-4 h-64">
              {chartsLoading ? (
                <div className="h-full w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.monthlyRevenue}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke={axisColor}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatNumber(v)}
                    />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Invoice Status Mix</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Share of invoices by status</p>
            <div className="mt-4 h-64">
              {chartsLoading ? (
                <div className="h-full w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {charts.statusBreakdown.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatNumber(value), name]} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="capitalize">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top Customers by Revenue</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your highest billed clients</p>
            <div className="mt-4 h-72">
              {chartsLoading ? (
                <div className="h-full w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.topCustomers} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis
                      type="number"
                      stroke={axisColor}
                      fontSize={12}
                      tickFormatter={(v) => formatNumber(v)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="company"
                      stroke={axisColor}
                      fontSize={12}
                      width={170}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
