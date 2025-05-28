import { Args, boolToByte } from '@massalabs/as-types';
import {
  _grantRole,
  _hasRole,
  _members,
  _onlyRole,
  _revokeRole,
} from './accessControl-internal';
import { balance, transferRemaining } from '@massalabs/massa-as-sdk';

/**
 *  Set the role for account
 *
 * @param role - role name string
 * @param account - account address string
 */
export function grantRole(binaryArgs: StaticArray<u8>): void {
  const initBal = balance();

  const args = new Args(binaryArgs);
  const role = args.nextString().expect('role argument is missing or invalid');
  const account = args
    .nextString()
    .expect('account argument is missing or invalid');

  _grantRole(role, account);

  transferRemaining(initBal);
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
export function revokeRole(binaryArgs: StaticArray<u8>): void {
  const initBal = balance();

  const args = new Args(binaryArgs);
  const role = args.nextString().expect('role argument is missing or invalid');
  const account = args
    .nextString()
    .expect('account argument is missing or invalid');

  _revokeRole(role, account);
  transferRemaining(initBal);
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
  _onlyRole(role);
}
