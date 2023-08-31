import { Context, Address, generateEvent } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { _approve, _allowance } from '../token-internals';
import { _burn, _decreaseTotalSupply } from './burn-internal';

/**
 * Burnable feature for fungible token.
 *
 * Re-export this file in your contract entry file to make it available in the contract.
 *
 */

const BURN_EVENT = 'BURN';

/**
 * Burn tokens from the caller address
 *
 * @param binaryArgs - byte string with the following format:
 * - the amount of tokens to burn obn the caller address (u256).
 */
export function burn(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  _decreaseTotalSupply(amount);

  _burn(Context.caller(), amount);

  generateEvent(
    `${BURN_EVENT}: ${amount.toString()} tokens from ${Context.caller().toString()}`,
  );
}

/**
 * Burn tokens from the caller address
 *
 * @param binaryArgs - byte string with the following format:
 * - the owner of the tokens to be burned (string).
 * - the amount of tokens to burn on the caller address (u256).
 *
 */
export function burnFrom(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const owner = new Address(
    args.nextString().expect('owner argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  const spenderAllowance = _allowance(owner, Context.caller());

  assert(spenderAllowance >= amount, 'burnFrom failed: insufficient allowance');

  _decreaseTotalSupply(amount);

  _burn(owner, amount);

  // @ts-ignore
  _approve(owner, Context.caller(), spenderAllowance - amount);

  generateEvent(
    `${BURN_EVENT}: ${amount.toString()} tokens from ${owner.toString()}`,
  );
}
