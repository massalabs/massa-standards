import {
  Context,
  createEvent,
  generateEvent,
  Storage,
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';
import { onlyOwner } from './ownership';
import { _isOwner } from './ownership-internal';

export const ROLES_KEY = '_ROLES';

export const ROLE_GRANTED_EVENT = 'ROLE_GRANTED_EVENT';
export const ROLE_REVOKED_EVENT = 'ROLE_REVOKED_EVENT';

export function _grantRole(role: string, account: string): void {
  onlyOwner();

  assert(!_hasRole(role, account), `Account already has ${role} role`);

  const membersList = _members(role);
  membersList.push(account);
  Storage.set(_roleKey(role), new Args().add(membersList).serialize());

  generateEvent(createEvent(ROLE_GRANTED_EVENT, [role, account]));
}

export function _revokeRole(role: string, account: string): void {
  const caller = Context.caller().toString();

  if (!_isOwner(caller)) {
    assert(
      Context.caller().toString() === account,
      `Caller is not ${account} or admin`,
    );
    assert(_hasRole(role, account), `Account does not have ${role} role`);
  }

  let membersList = _members(role);
  if (membersList.length > 1) {
    membersList[membersList.indexOf(account)] =
      membersList[membersList.length - 1];
    membersList.pop();
  } else {
    membersList = [];
  }
  Storage.set(_roleKey(role), new Args().add(membersList).serialize());
  generateEvent(createEvent(ROLE_REVOKED_EVENT, [role, account]));
}

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

export function _onlyRole(role: string): void {
  assert(
    _hasRole(role, Context.caller().toString()),
    `Caller does not have ${role} role`,
  );
}
