import { describe, expect, test as it } from 'bun:test'
import { declareIsGranted } from '../src/isGrantedUtils'

describe('declareIsGranted function', () => {
  type RoleType = 'ROLE_ADMIN' | 'ROLE_USER'

  const RoleHierarchy: Record<RoleType, RoleType[]> = {
    ROLE_ADMIN: ['ROLE_USER'],
    ROLE_USER: [],
  }

  const isGranted = declareIsGranted<RoleType, typeof RoleHierarchy>(RoleHierarchy)

  it('should return true if the user has the exact role', () => {
    expect(isGranted('ROLE_USER', ['ROLE_USER'])).toBe(true)
    expect(isGranted('ROLE_ADMIN', ['ROLE_ADMIN'])).toBe(true)
  })

  it('should return true if the user has a parent role in the hierarchy', () => {
    expect(isGranted('ROLE_USER', ['ROLE_ADMIN'])).toBe(true)
  })

  it('should return false if the user does not have the required role or parent role', () => {
    expect(isGranted('ROLE_ADMIN', ['ROLE_USER'])).toBe(false)
  })

  it('should handle cases with an empty userRoles array', () => {
    expect(isGranted('ROLE_USER', [])).toBe(false)
    expect(isGranted('ROLE_ADMIN', [])).toBe(false)
  })

  it('should return false for roles that do not exist in userRoles or hierarchy', () => {
    const isGrantedCustom = declareIsGranted({
      ROLE_ADMIN: ['ROLE_USER'],
      ROLE_SUPERADMIN: ['ROLE_ADMIN'],
      ROLE_USER: [],
    })
    expect(isGrantedCustom('ROLE_SUPERADMIN', ['ROLE_USER'])).toBe(false)
  })

  it('should handle nested hierarchy with multiple levels', () => {
    type ExtendedRoleType = 'ROLE_SUPERADMIN' | 'ROLE_ADMIN' | 'ROLE_USER'

    const ExtendedRoleHierarchy: Record<ExtendedRoleType, ExtendedRoleType[]> = {
      ROLE_ADMIN: ['ROLE_USER'],
      ROLE_SUPERADMIN: ['ROLE_ADMIN'],
      ROLE_USER: [],
    }

    const isGrantedExtended = declareIsGranted<ExtendedRoleType, typeof ExtendedRoleHierarchy>(ExtendedRoleHierarchy)

    expect(isGrantedExtended('ROLE_ADMIN', ['ROLE_SUPERADMIN'])).toBe(true)
    expect(isGrantedExtended('ROLE_USER', ['ROLE_SUPERADMIN'])).toBe(true)
    expect(isGrantedExtended('ROLE_USER', ['ROLE_ADMIN'])).toBe(true)
    expect(isGrantedExtended('ROLE_SUPERADMIN', ['ROLE_ADMIN'])).toBe(false)
  })
})
