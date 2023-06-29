import {
  Storage,
  Address,
  generateEvent,
  createEvent,
} from '@massalabs/massa-as-sdk';
import { Args, bytesToU256, u256ToBytes } from '@massalabs/as-types';
import { totalSupply, TOTAL_SUPPLY_KEY } from './token';
import { _balance, _setBalance } from './token-commons';
import { onlyOwner } from '../utils/ownership';
import { u256 } from 'as-bignum/assembly';

const MINT_EVENT_NAME = 'MINT';

/**
 *  Mint tokens on the recipient address
 *
 * @param binaryArgs - `Args` serialized StaticArray<u8> containing:
 * - the recipient's account (address)
 * - the amount of tokens to mint (u256).
 */
export function mint(binaryArgs: StaticArray<u8>): void {
  onlyOwner();
  const args = new Args(binaryArgs);
  const recipient = new Address(
    args.nextString().expect('recipient argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('amount argument is missing or invalid');

  _increaseTotalSupply(amount);

  _mint(recipient, amount);

  generateEvent(
    createEvent(MINT_EVENT_NAME, [recipient.toString(), amount.toString()]),
  );
}

/**
 * Adds amount of token to recipient.
 *
 * @param recipient -
 * @param amount -
 * @returns true if the token has been minted
 */
function _mint(recipient: Address, amount: u256): void {
  const oldRecipientBalance = _balance(recipient);
  // @ts-ignore

  const newRecipientBalance = oldRecipientBalance + amount;

  // Check overflow
  assert(
    oldRecipientBalance < newRecipientBalance,
    'Requested mint amount causes an overflow',
  );

  _setBalance(recipient, newRecipientBalance);
}

/**
 * Increases the total supply of the token.
 *
 * @param amount - how much you want to increase the total supply
 * @returns true if the total supply has been increased
 */
function _increaseTotalSupply(amount: u256): void {
  const oldTotalSupply = bytesToU256(totalSupply([]));
  // @ts-ignore
  const newTotalSupply = oldTotalSupply + amount;

  // Check overflow
  assert(
    oldTotalSupply < newTotalSupply,
    'Requested mint amount causes an overflow',
  );

  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(newTotalSupply));
}
