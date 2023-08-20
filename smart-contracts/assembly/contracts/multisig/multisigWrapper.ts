import { Address, call } from '@massalabs/massa-as-sdk';
import { Args,
         NoArg,
         bytesToString,
         byteToBool,
         bytesToSerializableObjectArray,
         bytesToU64 } from '@massalabs/as-types';

/**
 * The Massa's standard multisig implementation wrapper.
 *
 * @remarks
 * This class can be used to wrap a smart contract implementing
 * Massa standard multisig.
 * All the serialization/deserialization will be handled here.
 *
 * @example
 * ```typescript
 * const multisig = new MultisigWrapper(MultisigAddr);
 * multisig.confirmTransaction(txIndex);
 * ```
 */
export class MultisigWrapper {
  _origin: Address;

  /**
   * Wraps a smart contract exposing standard multisig.
   *
   * @param at - Address of the contract
   */
  constructor(at: Address) {
    this._origin = at;
  }

  /**
   * Deposit tokens in the multisig
   */
  deposit(amount: u64): void {
    call(this._origin, 'ms1_deposit', NoArg, amount);
  }

  /**
   * Submit a transaction, and retrieve its index to be used by
   * the multisig owners to confirm it.
   *
   * @param toAddress - recipient address
   * @param amount - amount to transfer
   *
   * @returns the transaction index
   */
  submitTransaction(toAddress: Address, amount: u64): u64 {
    return bytesToU64(
      call(this._origin,
           'ms1_submitTransaction',
           new Args().add<Address>(toAddress).add(amount).serialize(),
           0));
  }

  /**
   * Confirm a transaction identified by its index.
   *
   * @param txIndex - the transaction index
   */
  confirmTransaction(txIndex: u64): void {
    call(this._origin,
         'ms1_confirmTransaction',
         new Args().add(txIndex).serialize(),
         0);
  }

  /**
   * Execute a transaction if it has enough validation from owners
   *
   * @param txIndex - the transaction index
   */
  executeTransaction(txIndex: u64): void {
    call(this._origin,
         'ms1_executeTransaction',
         new Args().add(txIndex).serialize(),
         0);
  }

  /**
   * Revoke a transaction identified by its index.
   *
   * @param txIndex - the transaction index
   */
  revokeTransaction(txIndex: u64): void {
    call(this._origin,
         'ms1_revokeTransaction',
         new Args().add(txIndex).serialize(),
         0);
  }

  /**
   * Get the list of owners of the multisig.
   *
   * @returns the list of owners addresses
   */
  getOwners(): Array<Address> {
    return bytesToSerializableObjectArray<Address>(
      call(this._origin, 'ms1_getOwners', NoArgs, 0))
    .unwrap();
  }

  /**
   * Get a transaction identified by its index.
   * Will throw if the transaction index does not exist.
   *
   * @returns the transaction
   */
  getTransaction(txIndex: u64): Transaction {
    let transaction = new Transaction();
    transaction.deserialize(
      call(this._origin,
          'ms1_getTransaction',
          new Args().add(txIndex).serialize(),
          0));

    return transaction;
  }

  /**
   * Check if a transaction identified by its index is pending.
   *
   * @returns true if the transaction is defined and pending execution.
   */
  hasTransaction(txIndex: u64): bool {
    return byteToBool (
      call(this._origin,
          'ms1_hasTransaction',
          new Args().add(txIndex).serialize(),
          0));
  }

}
