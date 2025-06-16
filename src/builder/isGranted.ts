export function declareIsGranted<
  RoleType extends string,
  RoleHierarchy extends Record<RoleType, RoleType[]>,
>(hierarchy: RoleHierarchy) {
  return (role: RoleType, userRoles: RoleType[]): boolean => {
    if (userRoles.includes(role))
      return true

    function getIsParent(role: RoleType): boolean {
      for (const [parent, children] of Object.entries<RoleType[]>(hierarchy)) {
        if (children.includes(role)) {
          if (userRoles.includes(parent as RoleType))
            return true

          if (getIsParent(parent as RoleType))
            return true
        }
      }

      return false
    }

    return getIsParent(role)
  }
}
