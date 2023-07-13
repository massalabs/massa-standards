import { Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';

export const ROLES_KEY = '_ROLES';

export const ROLE_GRANTED_EVENT = 'ROLE_GRANTED_EVENT';

export function _roleKey(role: string): StaticArray<u8> {
  return stringToBytes(ROLES_KEY + role);
}

export function _members(role: string): string[] {
  const key = _roleKey(role);
  if (!Storage.has(key)) {
    return [];
  }
  return new Args(Storage.get(key)).nextStringArray().unwrap();
}

export function _hasRole(role: string, account: string): bool {
  return _members(role).includes(account);
}
