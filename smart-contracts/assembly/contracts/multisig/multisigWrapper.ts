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
 * multisig.confirmOperation(opIndex);
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
   * Submit an operation, and retrieve its index to be used by
   * the multisig owners to confirm it.
   *
   * @param address - recipient address
   * @param amount - amount to transfer
   *
   * @returns the operation index
   */
  submitOperation(address: Address, amount: u64): u64 {
    return bytesToU64(
      call(this._origin,
           'ms1_submitOperation',
           new Args().add<Address>(address).add(amount).serialize(),
           0));
  }

  /**
   * Confirm an operation identified by its index.
   *
   * @param opIndex - the operation index
   */
  confirmOperation(opIndex: u64): void {
    call(this._origin,
         'ms1_confirmOperation',
         new Args().add(opIndex).serialize(),
         0);
  }

  /**
   * Execute an operation if it has enough validation from owners
   *
   * @param opIndex - the operation index
   */
  executeOperation(opIndex: u64): void {
    call(this._origin,
         'ms1_executeOperation',
         new Args().add(opIndex).serialize(),
         0);
  }

  /**
   * Revoke a operation identified by its index.
   *
   * @param opIndex - the operation index
   */
  revokeOperation(opIndex: u64): void {
    call(this._origin,
         'ms1_revokeOperation',
         new Args().add(opIndex).serialize(),
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
   * Get an operation identified by its index.
   * Will throw if the operation index does not exist.
   *
   * @returns the operation
   */
  getOperation(opIndex: u64): Operation {
    let operation = new Operation();
    operation.deserialize(
      call(this._origin,
          'ms1_getOperation',
          new Args().add(opIndex).serialize(),
          0));

    return operation;
  }

  /**
   * Check if an operation identified by its index is pending.
   *
   * @returns true if the operation is defined and pending execution.
   */
  hasOperation(opIndex: u64): bool {
    return byteToBool (
      call(this._origin,
          'ms1_hasOperation',
          new Args().add(opIndex).serialize(),
          0));
  }
}
