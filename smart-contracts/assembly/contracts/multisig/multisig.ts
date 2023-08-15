// ======================================================== //
//                  MULTISIG CONTRACT                       //
//                                                          //
// Accepts funds in a smart contract locked by a multisig   //
// mechanism. Owners can be registered several times,       //
// implementing a simple weighted signature scheme.         //
//                                                          //
// Inspired by the solidity multisig contract here:         //
// https://solidity-by-example.org/app/multi-sig-wallet     //
//                                                          //
// ======================================================== //

import {
  Address,
  Context,
  Coins,
  generateEvent,
  Storage,
  createEvent,
  callerHasWriteAccess,
} from '@massalabs/massa-as-sdk';

import { Args,
         Result,
         u8toByte,
         u64ToBytes,
         stringToBytes,
         bytesToString,
         bytesToU64,
         byteToU8,
         bytesToSerializableObjectArray,
         serializableObjectsArrayToBytes } from '@massalabs/as-types';

const DEPOSIT_EVENT_NAME = 'DEPOSIT';
const SUBMIT_TRANSACTION_EVENT_NAME = 'SUBMIT_TRANSACTION';
const CONFIRM_TRANSACTION_EVENT_NAME = 'CONFIRM_TRANSACTION';
const EXECUTE_TRANSACTION_EVENT_NAME = 'EXECUTE_TRANSACTION';
const REVOKE_TRANSACTION_EVENT_NAME = 'REVOKE_TRANSACTION';
const RETRIEVE_TRANSACTION_EVENT_NAME = 'RETRIEVE_TRANSACTION';
const GET_OWNERS_EVENT_NAME = 'GET_OWNERS';

export const TRANSACTION_INDEX_PREFIX_KEY = '00';
export const OWNER_PREFIX_KEY = '01';

export const NB_CONFIRMATIONS_REQUIRED_KEY = stringToBytes('NB CONFIRMATIONS REQUIRED');
export const OWNERS_ADDRESSES_KEY = stringToBytes('OWNERS ADDRESSES');
export const TRANSACTION_INDEX_KEY = stringToBytes('TRANSACTION INDEX');


// ======================================================== //
// ====             HELPER FUNCTIONS & TYPES           ==== //
// ======================================================== //

function makeTransactionKey(txIndex: u64) : StaticArray<u8> {

    return stringToBytes(TRANSACTION_INDEX_PREFIX_KEY +
                         bytesToString(u64ToBytes(txIndex)));
}

function makeOwnerKey(address: Address) : StaticArray<u8> {

    return stringToBytes(OWNER_PREFIX_KEY +
                         bytesToString(address.serialize()));
}

class Transaction {
    toAddress: Address; // the destination address
    amount: u64; // the amount
    confirmedOwnerList: Array<Address>; // the Array listing the owners who have already signed
    confirmationWeightedSum: u8; // the confirmation total weight sum, for easy check

    constructor(toAddress: Address = new Address(), amount: u64 = 0) {
        this.toAddress = toAddress;
        this.amount = amount;
        this.confirmedOwnerList = new Array<Address>();
        this.confirmationWeightedSum = 0;
    }

    serialize() : StaticArray<u8> {

        // create a serializable transaction record to store in Storage
        // Here we store some redundant information, like the confirmation
        // total weight sum, trading some Storage space for Compute space,
        // knowing that the transaction will be erased from Storage once executed
        const argTransaction = new Args()
          .add<Address>(this.toAddress)
          .add<u64>(this.amount)
          .addSerializableObjectArray<Array<Address>>(this.confirmedOwnerList)
          .add<u8>(this.confirmationWeightedSum);
        return argTransaction.serialize();
    }

    deserialize(data: StaticArray<u8>) : void {

        const args = new Args(data);

        this.toAddress = args
          .nextSerializable<Address>()
          .expect('Error while deserializing transaction toAddress');
        this.amount = args
          .nextU64()
          .expect('Error while deserializing transaction amount');
        this.confirmedOwnerList = args
          .nextSerializableObjectArray<Address>()
          .expect('Error while deserializing transaction confirmedOwnerList');
        this.confirmationWeightedSum = args
          .nextU8()
          .expect('Error while deserializing transaction confirmationWeightedSum');
    }

    isAlreadyConfirmed(owner: Address) : bool {
        return this.confirmedOwnerList.includes(owner);
    }

    confirm(owner: Address, weight: u8) : void {
        this.confirmedOwnerList.push(owner);
        this.confirmationWeightedSum += weight;
    }

    revoke(owner: Address, weight: u8) : void {
        let newConfirmedOwnerList = new Array<Address>();
        for (let i = 0; i < this.confirmedOwnerList.length; i++) {
            let address = this.confirmedOwnerList[i];
            if (address != owner)
               newConfirmedOwnerList.push(address);
        }
        this.confirmedOwnerList = newConfirmedOwnerList;
        assert(this.confirmationWeightedSum >= weight,
          "fatal error: confirmationWeightedSum is less than revoked weight!");
        this.confirmationWeightedSum -= weight;
    }

    isValidated() : bool {
        let nbConfirmationsRequired = byteToU8(Storage.get(NB_CONFIRMATIONS_REQUIRED_KEY));
        return this.confirmationWeightedSum >= nbConfirmationsRequired;
    }
}

function storeTransaction(txIndex: u64,
                          transaction: Transaction): void {

  // we simply use the transaction index as a key to store it
  Storage.set(makeTransactionKey(txIndex), transaction.serialize());
}

function retrieveTransaction(txIndex: u64): Result<Transaction> {

  const transactionKey = makeTransactionKey(txIndex);

  if (Storage.has(transactionKey)) {
      let transaction = new Transaction();
      transaction.deserialize(Storage.get(transactionKey));
      return new Result(transaction);
  }

  return new Result(new Transaction(), "unknown or already executed transaction index")
}

function deleteTransaction(txIndex: u64): void {

  const transactionKey = makeTransactionKey(txIndex);
  Storage.del(transactionKey);
}

// ======================================================== //
// ====                 CONSTRUCTOR                    ==== //
// ======================================================== //


/**
 * Initialize the multisig wallet
 * Can be called only once
 *
 * @example
 * ```typescript
 *   constructor(
 *   new Args()
 *     .add(3) // nb of confirmations required
 *     .add<Array<string>>("Owner1Address", "Owner2Address", ..., "OwnerNAddress"])
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the number of confirmations required (u8)
 * - the Array of addresses for each owner of the multisig (Array<string>).
 */
export function constructor(stringifyArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(callerHasWriteAccess());

  const args = new Args(stringifyArgs);
  const MAX_OWNERS : i32 = 255;

  // initialize nb of confirmations required
  const nbConfirmationsRequired = args
    .nextU8()
    .expect('Error while initializing nbConfirmationsRequired');

  assert(nbConfirmationsRequired > 0 ,
    'The number of confirmations required must be at least 1');

  Storage.set(NB_CONFIRMATIONS_REQUIRED_KEY, u8toByte(nbConfirmationsRequired));

  // initialize array of owners addresses
  const ownerStringAddresses : Array<string> = args
    .nextStringArray()
    .expect('Error while initializing owners addresses array');

  // convert to actual Addresses
  const ownerAddresses : Array<Address> = [];
  for (let i = 0; i < ownerStringAddresses.length; i++)
    ownerAddresses.push(new Address(ownerStringAddresses[i]));

  assert(ownerAddresses.length > 0 && ownerAddresses.length <= MAX_OWNERS,
    'The multisig must have between one and 255 owners');

  assert(nbConfirmationsRequired as i32 <= ownerAddresses.length,
    'The number of confirmations cannot exceed the number of owners of the multisig');

  let ownerWeight = new Map<Address, u8>();
  for (let i = 0; i < ownerAddresses.length; i++) {
      let address = ownerAddresses[i];
      assert(address.toString(), "null address is not a valid owner");
      let currentWeight : u8 = 0;
      if (ownerWeight.has(address))
        currentWeight = ownerWeight.get(address);
      ownerWeight.set(address, currentWeight + 1);
  }

  for (let i = 0; i < ownerAddresses.length; i++) {
      let address = ownerAddresses[i];
      // we store directly each address weight in the Storage
      Storage.set(makeOwnerKey(address), u8toByte(ownerWeight.get(address)));
  }

  // We store the list of owners to be queries later if needed
  Storage.set(OWNERS_ADDRESSES_KEY, serializableObjectsArrayToBytes(ownerAddresses));

  // initialize transaction index
  Storage.set(TRANSACTION_INDEX_KEY, u64ToBytes(0));
}

/**
 * Returns the version of this smart contract.
 * This versioning is following the best practices defined in https://semver.org/.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns contract version
 */
export function version(_: StaticArray<u8>): StaticArray<u8> {
  return stringToBytes('0.0.0');
}

// ======================================================== //
// ====                 COIN DEPOSIT                   ==== //
// ======================================================== //

/**
 * Accepts funds to credit the multisig wallet
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns token name.
 */
export function deposit(_: StaticArray<u8>): void {

  generateEvent(
    createEvent(DEPOSIT_EVENT_NAME, [
      Context.caller().toString(),
      Context.transferredCoins().toString(),
      Coins.balance().toString(),
    ]),
  );
}

// ======================================================== //
// ====                 TRANSACTIONS                   ==== //
// ======================================================== //

/**
 * Submit a transaction and generate an event with its index number
 *
 * @example
 * ```typescript
 *   submitTransaction(
 *   new Args()
 *     .add<Address>(Address("...")) // destination address
 *     .add(150000) // amount
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the destination address for the transfert (Address)
 * - the amount of the transaction (u64).
 * @returns transaction index.
 */
export function submitTransaction(stringifyArgs: StaticArray<u8>): u64 {

  const args = new Args(stringifyArgs);

  // initialize address
  const toAddress = args
    .nextSerializable<Address>()
    .expect('Error while initializing transaction address');

  // initialize amount
  const amount = args
    .nextU64()
    .expect('Error while initializing transaction amount');

  let txIndex = bytesToU64(Storage.get(TRANSACTION_INDEX_KEY));
  txIndex++;

  storeTransaction(txIndex, new Transaction(toAddress, amount));

  // update the new txIndex value for the next transaction
  Storage.set(TRANSACTION_INDEX_KEY, u64ToBytes(txIndex));

  generateEvent(
    createEvent(SUBMIT_TRANSACTION_EVENT_NAME, [
      Context.caller().toString(),
      txIndex.toString(),
      toAddress.toString(),
      amount.toString(),
    ]),
  );

  return txIndex;
}

/**
 * Confirms a transaction by an owner, and generate an event
 *
 * @example
 * ```typescript
 *   confirmTransaction(
 *   new Args()
 *     .add(index) // the transaction index
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the transaction index (u64)
 */
export function confirmTransaction(stringifyArgs: StaticArray<u8>): void {

  const args = new Args(stringifyArgs);

  // initialize transaction index
  const txIndex = args
    .nextU64()
    .expect('Error while initializing transaction index');

  let owner = Context.caller();

  // check owner is legit and retrieve the weight
  let ownerKey = makeOwnerKey(owner);
  assert(Storage.has(ownerKey), "Caller address is not an owner");
  let weight = byteToU8(Storage.get(ownerKey));

  // check the transaction exists and retrieve it from Storage
  let transaction = retrieveTransaction(txIndex).unwrap();

  // did we already confirm it?
  assert(!transaction.isAlreadyConfirmed(owner),
    "The caller address has already confirmed this transaction");

  // confirm it and update the Storage
  transaction.confirm(owner, weight);
  storeTransaction(txIndex, transaction);

  generateEvent(
    createEvent(CONFIRM_TRANSACTION_EVENT_NAME, [
      owner.toString(),
      txIndex.toString()
    ]),
  );
}

/**
 * Execute a transaction and generate an event in case of success
 *
 * @example
 * ```typescript
 *   executeTransaction(
 *   new Args()
 *     .add(index) // the transaction index
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the transaction index (u64)
 */
export function executeTransaction(stringifyArgs: StaticArray<u8>): void {

  const args = new Args(stringifyArgs);

  // initialize transaction index
  const txIndex = args
    .nextU64()
    .expect('Error while initializing transaction index');

  // check the transaction exists and retrieve it from Storage
  let transaction = retrieveTransaction(txIndex).unwrap();

  // if the transaction is sufficiently confirmed, execute it
  assert(transaction.isValidated(),
    "The transaction is unsufficiently confirmed, cannot execute");
  Coins.transferCoins(transaction.toAddress, transaction.amount);

  // clean up Storage and remove executed transaction
  // NB: we could decide to keep it for archive purposes but then the
  // Storage cost would increase forever.
  deleteTransaction(txIndex);

  generateEvent(
    createEvent(EXECUTE_TRANSACTION_EVENT_NAME, [
      Context.caller().toString(),
      txIndex.toString(),
      transaction.toAddress.toString(),
      transaction.amount.toString(),
    ]),
  );
}

/**
 * Revoke a transaction confirmation by an owner, and generate an event
 *
 * @example
 * ```typescript
 *   revokeConfirmation(
 *   new Args()
 *     .add(index) // the transaction index
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the transaction index (u64)
 */
export function revokeConfirmation(stringifyArgs: StaticArray<u8>): void {

  const args = new Args(stringifyArgs);

  // initialize transaction index
  const txIndex = args
    .nextU64()
    .expect('Error while initializing transaction index');

  let owner = Context.caller();

  // check owner is legit and retrieve the weight
  let ownerKey = makeOwnerKey(owner);
  assert(Storage.has(ownerKey), "Caller address is not an owner");
  let weight = byteToU8(Storage.get(ownerKey));

  // check the transaction exists and retrieve it from Storage
  let transaction = retrieveTransaction(txIndex).unwrap();

  // did we actually already confirmed it?
  assert(transaction.isAlreadyConfirmed(owner),
    "The caller address has not yet confirmed this transaction");

  // revoke it and update the Storage
  transaction.revoke(owner, weight);
  storeTransaction(txIndex, transaction);

  generateEvent(
    createEvent(REVOKE_TRANSACTION_EVENT_NAME, [
      owner.toString(),
      txIndex.toString()
    ]),
  );
}

/**
 * Retrieve the list of the multisig owners Addresses and emit an event
 *
 * @example
 * ```typescript
 *   let owners = bytesToSerializableObjectArray<Address>(getOwners()).unwrap();
 * ```
 *
 */
export function getOwners(_ : StaticArray<u8>) : StaticArray<u8> {

  let serializedOwnerAddresses = Storage.get(OWNERS_ADDRESSES_KEY)
  let owners = bytesToSerializableObjectArray<Address>(serializedOwnerAddresses).unwrap();

  // generate the event with the list of owners
  let eventPayLoad : Array<string> = [];
  for (let i = 0; i < owners.length; i++)
      eventPayLoad.push(owners[i].toString());
  generateEvent(createEvent(GET_OWNERS_EVENT_NAME, eventPayLoad));

  return serializedOwnerAddresses;
}

/**
 * Retrieve a currently stored transaction and generate an event
 *
 * @example
 * ```typescript
 *   let transaction = new Transaction();
 *   transaction.deserialize(getTransaction(
 *     new Args()
 *       .add(index) // the transaction index
 *       .serialize()
 *     ));
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the transaction index (u64)
 */
export function getTransaction(stringifyArgs : StaticArray<u8>) : StaticArray<u8> {

  const args = new Args(stringifyArgs);

  // initialize transaction index
  const txIndex = args
    .nextU64()
    .expect('Error while initializing transaction index');

  // check the transaction exists and retrieve it from Storage
  let transaction = retrieveTransaction(txIndex).unwrap();

  // generate the event with the list of confirmed owners
  let eventPayLoad : Array<string> = [
      txIndex.toString(),
      transaction.toAddress.toString(),
      transaction.amount.toString(),
      transaction.confirmationWeightedSum.toString()];
  for (let i = 0; i < transaction.confirmedOwnerList.length; i++)
      eventPayLoad.push(transaction.confirmedOwnerList[i].toString());
  generateEvent(createEvent(RETRIEVE_TRANSACTION_EVENT_NAME, eventPayLoad));

  return transaction.serialize();
}
