import { useMemo, useState } from 'react'
import { AuthContext } from './auth-context'

const ROLES = {
  admin: { label: 'Admin', canEdit: true, canDelete: true, canExport: true, canBulkAction: true },
  finance: { label: 'Finance', canEdit: true, canDelete: false, canExport: true, canBulkAction: true },
  viewer: { label: 'Viewer', canEdit: false, canDelete: false, canExport: false, canBulkAction: false },
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState('admin')

  const value = useMemo(
    () => ({
      role,
      setRole,
      permissions: ROLES[role],
      roles: ROLES,
    }),
    [role],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
