const CUSTOMERS = [
  { name: 'Meera Nair', company: 'Atlas Freight Logistics', email: 'billing@atlasfreight.com' },
  { name: 'Rahul Verma', company: 'BlueLane Shipping Co.', email: 'accounts@bluelane.com' },
  { name: 'Sarah Chen', company: 'Continental Cargo Partners', email: 'finance@continentalcargo.com' },
  { name: 'James Okafor', company: 'Delta Route Transport', email: 'ap@deltaroute.com' },
  { name: 'Priya Sharma', company: 'Everest Supply Chain', email: 'billing@everestsc.com' },
  { name: 'Tom Becker', company: 'Falcon Express Freight', email: 'accounts@falconexpress.com' },
  { name: 'Lisa Wong', company: 'Gateway Intermodal', email: 'ap@gatewayintermodal.com' },
  { name: 'David Kim', company: 'Horizon Trucking Ltd.', email: 'billing@horizontrucking.com' },
]

const SERVICE_ITEMS = [
  'Freight Charges - FTL',
  'Freight Charges - LTL',
  'Fuel Surcharge',
  'Detention Charges',
  'Loading & Unloading',
  'Toll & Permit Charges',
  'Warehousing Fee',
  'Customs Clearance',
  'Insurance Premium',
  'Handling Fee',
]

const STATUSES = ['paid', 'pending', 'draft']

// Small deterministic PRNG so the generated dataset is stable across reloads/tests.
function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)]
}

function generateInvoices(count = 130) {
  const rand = seededRandom(42)
  const today = new Date()
  const invoices = []

  for (let i = 0; i < count; i += 1) {
    const id = `INV-${2000 + i}`
    const customer = pick(rand, CUSTOMERS)

    const itemCount = 1 + Math.floor(rand() * 4)
    const lineItems = Array.from({ length: itemCount }, (_, idx) => {
      const quantity = 1 + Math.floor(rand() * 10)
      const unitPrice = Math.round((50 + rand() * 950) * 100) / 100
      return {
        id: `${id}-LI-${idx + 1}`,
        description: pick(rand, SERVICE_ITEMS),
        quantity,
        unitPrice,
      }
    })

    const total = Math.round(
      lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100,
    ) / 100

    const daysAgo = Math.floor(rand() * 180)
    const issueDate = new Date(today)
    issueDate.setDate(issueDate.getDate() - daysAgo)
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30)

    invoices.push({
      id,
      customer,
      issueDate: issueDate.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      status: pick(rand, STATUSES),
      currency: 'INR',
      lineItems,
      total,
      notes: 'Thank you for your business.',
    })
  }

  return invoices
}

export const MOCK_INVOICES = generateInvoices()
