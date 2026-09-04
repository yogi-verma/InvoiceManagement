const STATUS_VALUES = ['paid', 'pending', 'draft']

// Validates a plain invoice payload (used for both the manual form and bulk JSON import).
export function validateInvoiceInput(input) {
  const errors = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return ['Invoice entry must be an object']
  }

  const customer = input.customer ?? {}
  if (!customer.name?.trim()) errors.push('customer.name is required')
  if (!customer.company?.trim()) errors.push('customer.company is required')
  if (!customer.email?.trim()) errors.push('customer.email is required')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors.push('customer.email is invalid')

  if (!input.issueDate || Number.isNaN(new Date(input.issueDate).getTime())) {
    errors.push('issueDate is required (YYYY-MM-DD)')
  }
  if (!input.dueDate || Number.isNaN(new Date(input.dueDate).getTime())) {
    errors.push('dueDate is required (YYYY-MM-DD)')
  }

  if (input.status && !STATUS_VALUES.includes(input.status)) {
    errors.push(`status must be one of ${STATUS_VALUES.join(', ')}`)
  }

  if (!Array.isArray(input.lineItems) || input.lineItems.length === 0) {
    errors.push('lineItems must be a non-empty array')
  } else {
    input.lineItems.forEach((item, idx) => {
      if (!item?.description?.trim()) errors.push(`lineItems[${idx}].description is required`)
      if (!(Number(item?.quantity) > 0)) errors.push(`lineItems[${idx}].quantity must be greater than 0`)
      if (!(Number(item?.unitPrice) >= 0)) errors.push(`lineItems[${idx}].unitPrice must be 0 or greater`)
    })
  }

  return errors
}
