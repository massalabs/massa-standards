import {
  Address,
  Context,
  generateEvent,
  Storage,
  createEvent,
  callerHasWriteAccess,
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, u256ToBytes } from '@massalabs/as-types';
import { _balance, _setBalance, _approve, _allowance } from './token-internals';
import { setOwner } from '../utils/ownership';
import { u256 } from 'as-bignum/assembly';

const TRANSFER_EVENT_NAME = 'TRANSFER';
const APPROVAL_EVENT_NAME = 'APPROVAL';

export const NAME_KEY = stringToBytes('NAME');
export const SYMBOL_KEY = stringToBytes('SYMBOL');
export const TOTAL_SUPPLY_KEY = stringToBytes('TOTAL_SUPPLY');
export const DECIMALS_KEY = stringToBytes('DECIMALS');

/**
 * Initialize the ERC20 contract
 * Can be called only once
 *
 * @example
 * ```typescript
 *   constructor(
 *   new Args()
 *     .add('TOKEN_NAME')
 *     .add('TOKEN_SYMBOL')
 *     .add(3) // decimals
 *     .add(1000) // total supply
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the token name (string)
 * - the token symbol (string).
 * - the decimals (u8).
 * - the totalSupply (u256)
 * - first owner (address)e
 */
export function constructor(stringifyArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(callerHasWriteAccess());

  const args = new Args(stringifyArgs);

  // initialize token name
  const name = args.nextString().expect('Error while initializing tokenName');
  Storage.set(NAME_KEY, stringToBytes(name));

  // initialize token symbol
  const symbol = args
    .nextString()
    .expect('Error while initializing tokenSymbol');
  Storage.set(SYMBOL_KEY, stringToBytes(symbol));

  // initialize token decimals
  const decimals = args
    .nextU8()
    .expect('Error while initializing tokenDecimals');
  Storage.set(DECIMALS_KEY, [decimals]);

  // initialize totalSupply
  const totalSupply = args
    .nextU256()
    .expect('Error while initializing totalSupply');
  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(totalSupply));

  setOwner(new Args().add(Context.caller().toString()).serialize());
  _setBalance(Context.caller(), totalSupply);
}

/**
 * Returns the version of this smart contract.
 * This versioning is following the best practices defined in https://semver.org/.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns token version
 */
export function ft1_version(_: StaticArray<u8>): StaticArray<u8> {
  return stringToBytes('0.0.0');
}

// ======================================================== //
// ====                 TOKEN ATTRIBUTES               ==== //
// ======================================================== //

/**
 * Returns the name of the token.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns token name.
 */
export function ft1_name(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(NAME_KEY);
}

/** Returns the symbol of the token.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns token symbol.
 */
export function ft1_symbol(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(SYMBOL_KEY);
}

/**
 * Returns the total token supply.
 *
 * The number of tokens that were initially minted.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns u256
 */
export function ft1_totalSupply(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(TOTAL_SUPPLY_KEY);
}

/**
 * Returns the maximum number of digits being part of the fractional part
 * of the token when using a decimal representation.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns
 */
export function ft1_decimals(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(DECIMALS_KEY);
}

// ==================================================== //
// ====                 BALANCE                    ==== //
// ==================================================== //

/**
 * Returns the balance of an account.
 *
 * @param binaryArgs - Args object serialized as a string containing an owner's account (Address).
 */
export function ft1_balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const addr = new Address(
    args.nextString().expect('Address argument is missing or invalid'),
  );

  return u256ToBytes(_balance(addr));
}

// ==================================================== //
// ====                 TRANSFER                   ==== //
// ==================================================== //

/**
 * Transfers tokens from the caller's account to the recipient's account.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the recipient's account (address)
 * - the number of tokens (u256).
 */
export function ft1_transfer(binaryArgs: StaticArray<u8>): void {
  const owner = Context.caller();

  const args = new Args(binaryArgs);
  const toAddress = new Address(
    args.nextString().expect('receiverAddress argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  _transfer(owner, toAddress, amount);

  generateEvent(
    createEvent(TRANSFER_EVENT_NAME, [
      owner.toString(),
      toAddress.toString(),
      amount.toString(),
    ]),
  );
}

/**
 * Transfers tokens from the caller's account to the recipient's account.
 *
 * @param from - sender address
 * @param to - recipient address
 * @param amount - number of token to transfer
 *
 * @returns true if the transfer is successful
 */
function _transfer(from: Address, to: Address, amount: u256): void {
  const currentFromBalance = _balance(from);
  const currentToBalance = _balance(to);
  // @ts-ignore
  const newToBalance = currentToBalance + amount;

  assert(currentFromBalance >= amount, 'Transfer failed: insufficient funds');
  assert(newToBalance >= currentToBalance, 'Transfer failed: overflow');
  // @ts-ignore
  _setBalance(from, currentFromBalance - amount);
  _setBalance(to, newToBalance);
}

// ==================================================== //
// ====                 ALLOWANCE                  ==== //
// ==================================================== //

/**
 * Returns the allowance set on the owner's account for the spender.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the owner's account (address)
 * - the spender's account (address).
 */
export function ft1_allowance(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const owner = new Address(
    args.nextString().expect('owner argument is missing or invalid'),
  );
  const spenderAddress = new Address(
    args.nextString().expect('spenderAddress argument is missing or invalid'),
  );

  return u256ToBytes(_allowance(owner, spenderAddress));
}

/**
 * Increases the allowance of the spender on the owner's account by the amount.
 *
 * This function can only be called by the owner.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the spender's account (address);
 * - the amount (u256).
 */
export function ft1_increaseAllowance(binaryArgs: StaticArray<u8>): void {
  const owner = Context.caller();

  const args = new Args(binaryArgs);
  const spenderAddress = new Address(
    args.nextString().expect('spenderAddress argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  // @ts-ignore
  let newAllowance = _allowance(owner, spenderAddress) + amount;
  if (newAllowance < amount) {
    newAllowance = u256.Max;
  }

  _approve(owner, spenderAddress, newAllowance);

  generateEvent(
    createEvent(APPROVAL_EVENT_NAME, [
      owner.toString(),
      spenderAddress.toString(),
      newAllowance.toString(),
    ]),
  );
}

/**
 * Decreases the allowance of the spender the on owner's account by the amount.
 *
 * This function can only be called by the owner.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the spender's account (address);
 * - the amount (u256).
 */
export function ft1_decreaseAllowance(binaryArgs: StaticArray<u8>): void {
  const owner = Context.caller();

  const args = new Args(binaryArgs);
  const spenderAddress = new Address(
    args.nextString().expect('spenderAddress argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  const current = _allowance(owner, spenderAddress);

  let newAllowance = u256.Zero;

  if (current > amount) {
    // @ts-ignore
    newAllowance = current - amount;
  }

  _approve(owner, spenderAddress, newAllowance);

  generateEvent(
    createEvent(APPROVAL_EVENT_NAME, [
      owner.toString(),
      spenderAddress.toString(),
      newAllowance.toString(),
    ]),
  );
}

/**
 * Transfers token ownership from the owner's account to the recipient's account
 * using the spender's allowance.
 *
 * This function can only be called by the spender.
 * This function is atomic:
 * - both allowance and transfer are executed if possible;
 * - or if allowance or transfer is not possible, both are discarded.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the owner's account (address);
 * - the recipient's account (address);
 * - the amount (u256).
 */
export function ft1_transferFrom(binaryArgs: StaticArray<u8>): void {
  const spenderAddress = Context.caller();

  const args = new Args(binaryArgs);
  const owner = new Address(
    args.nextString().expect('ownerAddress argument is missing or invalid'),
  );
  const recipient = new Address(
    args.nextString().expect('recipientAddress argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  const spenderAllowance = _allowance(owner, spenderAddress);

  assert(
    spenderAllowance >= amount,
    'transferFrom failed: insufficient allowance',
  );

  _transfer(owner, recipient, amount);

  // @ts-ignore
  _approve(owner, spenderAddress, spenderAllowance - amount);

  generateEvent(
    createEvent(TRANSFER_EVENT_NAME, [
      owner.toString(),
      recipient.toString(),
      amount.toString(),
    ]),
  );
}
