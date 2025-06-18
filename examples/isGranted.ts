import { declareIsGranted } from '../index'

type RoleType = 'ROLE_ADMIN' | 'ROLE_USER'

const RoleHierarchy: Record<RoleType, RoleType[]> = {
  ROLE_ADMIN: ['ROLE_USER'],
  ROLE_USER: [],
}

const isGranted = declareIsGranted<RoleType, typeof RoleHierarchy>(RoleHierarchy)

console.log(isGranted('ROLE_ADMIN', ['ROLE_USER'])) // false
console.log(isGranted('ROLE_ADMIN', ['ROLE_ADMIN'])) // true
console.log(isGranted('ROLE_USER', ['ROLE_ADMIN'])) // true
