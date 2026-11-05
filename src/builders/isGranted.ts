export function declareIsGranted<
  RoleType extends string,
  RoleHierarchy extends Record<RoleType, RoleType[]>,
>(hierarchy: RoleHierarchy) {
  const parentsOf = new Map<RoleType, RoleType[]>()

  for (const [parent, children] of Object.entries<RoleType[]>(hierarchy)) {
    for (const child of children) {
      const parents = parentsOf.get(child)

      if (parents)
        parents.push(parent as RoleType)
      else
        parentsOf.set(child, [parent as RoleType])
    }
  }

  return (role: RoleType, userRoles: RoleType[]): boolean => {
    if (userRoles.includes(role))
      return true

    const seen = new Set<RoleType>([role])
    const pending = [role]

    for (const current of pending) {
      for (const parent of parentsOf.get(current) ?? []) {
        if (userRoles.includes(parent))
          return true

        if (!seen.has(parent)) {
          seen.add(parent)
          pending.push(parent)
        }
      }
    }

    return false
  }
}
