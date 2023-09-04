import {
  generateEvent,
  Storage,
  createEvent,
  Context,
} from '@massalabs/massa-as-sdk';
import { Args, boolToByte } from '@massalabs/as-types';
import { onlyOwner } from './ownership';
import { _hasRole, _members, _roleKey } from './accessControl-internal';
import { _isOwner } from './ownership-internal';

export const ROLES_KEY = '_ROLES';

export const ROLE_GRANTED_EVENT = 'ROLE_GRANTED_EVENT';

/**
 *  Set the role for account
 *
 * @param role - role name string
 * @param account - account address string
 */
export function grantRole(binaryArgs: StaticArray<u8>): void {
  onlyOwner();
  const args = new Args(binaryArgs);
  const role = args.nextString().expect('role argument is missing or invalid');
  const account = args
    .nextString()
    .expect('account argument is missing or invalid');

  assert(!_hasRole(role, account), `Account already has ${role} role`);

  const membersList = _members(role);
  membersList.push(account);
  Storage.set(_roleKey(role), new Args().add(membersList).serialize());

  generateEvent(createEvent(ROLE_GRANTED_EVENT, [role, account]));
}

/**
 *  get the members for a role
 *
 * @param role - role name string
 */
export function members(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const role = args.nextString().expect('role argument is missing or invalid');
  return new Args().add(_members(role)).serialize();
}

/**
 *  Returns true if the account has the role.
 *
 * @param role - role name string
 * @param account - account address string
 * @returns boolean
 */
export function hasRole(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const role = args.nextString().expect('role argument is missing or invalid');

  const account = args
    .nextString()
    .expect('account argument is missing or invalid');

  return boolToByte(_hasRole(role, account));
}

/**
 *  Revoke role for account. Must be called by the role owner or the contract admin.
 *
 * @param role - role name string
 * @param account - account address string
 */
export function revokeRole(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const role = args.nextString().expect('role argument is missing or invalid');
  const account = args
    .nextString()
    .expect('account argument is missing or invalid');

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

  return [];
}

/**
 *  Assert that caller has the role.
 *
 * @param role - role name string
 * @returns boolean
 */
export function onlyRole(binaryArgs: StaticArray<u8>): void {
  const role = new Args(binaryArgs)
    .nextString()
    .expect('role argument is missing or invalid');
  assert(
    _hasRole(role, Context.caller().toString()),
    `Caller does not have ${role} role`,
  );
}
