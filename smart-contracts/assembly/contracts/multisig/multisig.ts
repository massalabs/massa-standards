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
  Contract,
  Coins,
  generateEvent,
  Storage,
  createEvent,
  callerHasWriteAccess,
} from '@massalabs/massa-as-sdk';

import {
  Args,
  Result,
  u8toByte,
  u64ToBytes,
  stringToBytes,
  bytesToString,
  bytesToU64,
  byteToU8,
  boolToByte,
  bytesToSerializableObjectArray,
  serializableObjectsArrayToBytes,
} from '@massalabs/as-types';

const DEPOSIT_EVENT_NAME = 'DEPOSIT';
const SUBMIT_TRANSACTION_EVENT_NAME = 'SUBMIT_TRANSACTION';
const SUBMIT_CALL_EVENT_NAME = 'SUBMIT_CALL';
const CONFIRM_OPERATION_EVENT_NAME = 'CONFIRM_OPERATION';
const EXECUTE_OPERATION_EVENT_NAME = 'EXECUTE_OPERATION';
const REVOKE_OPERATION_EVENT_NAME = 'REVOKE_OPERATION';
const RETRIEVE_OPERATION_EVENT_NAME = 'RETRIEVE_OPERATION';
const GET_OWNERS_EVENT_NAME = 'GET_OWNERS';

export const OPERATION_INDEX_PREFIX_KEY = '00';
export const OWNER_PREFIX_KEY = '01';

export const NB_CONFIRMATIONS_REQUIRED_KEY = stringToBytes(
  'NB CONFIRMATIONS REQUIRED',
);
export const OWNERS_ADDRESSES_KEY = stringToBytes('OWNERS ADDRESSES');
export const OPERATION_INDEX_KEY = stringToBytes('OPERATION INDEX');

// ======================================================== //
// ====             HELPER FUNCTIONS & TYPES           ==== //
// ======================================================== //

function makeOperationKey(opIndex: u64): StaticArray<u8> {
  return stringToBytes(
    OPERATION_INDEX_PREFIX_KEY + bytesToString(u64ToBytes(opIndex)),
  );
}

function makeOwnerKey(address: Address): StaticArray<u8> {
  return stringToBytes(OWNER_PREFIX_KEY + bytesToString(address.serialize()));
}

/**
 * Operation represent either a transfer of coins to a given address (a "transaction"),
 * or a call to a smart contract.
 *
 * When the name is empty, the operation is a simple transaction. The amount is
 * credited to the given address.
 *
 * When the name is not empty, the operation is a call to the function of that
 * name, from the smart contract at the given address. Amount can be used to
 * transfer coin as part of the call. The list of arguments to the call can be
 * specified in 'args'
 *
 */
export class Operation {
  address: Address; // the destination address (the recipient of coins or the smart contract to call)
  amount: u64; // the amount
  name: string; // the function call name, if any ("" means the operation is a simple coin transfer)
  args: Args; // the args of the function call, if any
  confirmedOwnerList: Array<Address>; // the Array listing the owners who have already signed
  confirmationWeightedSum: u8; // the confirmation total weight sum, for easy check

  constructor(
    address: Address = new Address(),
    amount: u64 = 0,
    name: string = '',
    args: Args = new Args(),
  ) {
    this.address = address;
    this.amount = amount;
    this.name = name;
    this.args = args;
    this.confirmedOwnerList = new Array<Address>(0);
    this.confirmationWeightedSum = 0;
  }

  serialize(): StaticArray<u8> {
    // create a serializable Operation record to store in Storage
    // Here we store some redundant information, like the confirmation
    // total weight sum, trading some Storage space for Compute space,
    // knowing that the Operation will be erased from Storage once executed
    const argOperation = new Args()
      .add<Address>(this.address)
      .add<u64>(this.amount)
      .add<string>(this.name)
      .add<StaticArray<u8>>(this.args.serialize())
      .addSerializableObjectArray<Array<Address>>(this.confirmedOwnerList)
      .add<u8>(this.confirmationWeightedSum);
    return argOperation.serialize();
  }

  deserialize(data: StaticArray<u8>): void {
    const args = new Args(data);

    this.address = args
      .nextSerializable<Address>()
      .expect('Error while deserializing Operation address');
    this.amount = args
      .nextU64()
      .expect('Error while deserializing Operation amount');
    this.name = args
      .nextString()
      .expect('Error while deserializing Operation name');
    let argData = args
      .nextBytes()
      .expect('Error while deserializing Operation args');
    this.args = new Args(argData);
    this.confirmedOwnerList = args
      .nextSerializableObjectArray<Address>()
      .expect('Error while deserializing Operation confirmedOwnerList');
    this.confirmationWeightedSum = args
      .nextU8()
      .expect('Error while deserializing Operation confirmationWeightedSum');
  }

  isAlreadyConfirmed(owner: Address): bool {
    return this.confirmedOwnerList.includes(owner);
  }

  confirm(owner: Address, weight: u8): void {
    this.confirmedOwnerList.push(owner);
    this.confirmationWeightedSum += weight;
  }

  revoke(owner: Address, weight: u8): void {
    let newConfirmedOwnerList = new Array<Address>(0);
    for (let i = 0; i < this.confirmedOwnerList.length; i++) {
      let address = this.confirmedOwnerList[i];
      if (address != owner) newConfirmedOwnerList.push(address);
    }
    this.confirmedOwnerList = newConfirmedOwnerList;
    assert(
      this.confirmationWeightedSum >= weight,
      'fatal error: confirmationWeightedSum is less than revoked weight!',
    );
    this.confirmationWeightedSum -= weight;
  }

  isValidated(): bool {
    let nbConfirmationsRequired = byteToU8(
      Storage.get(NB_CONFIRMATIONS_REQUIRED_KEY),
    );
    return this.confirmationWeightedSum >= nbConfirmationsRequired;
  }

  execute(): void {
    if (this.name.length == 0)
      // we have a transaction
      Coins.transferCoinsOf(Context.callee(), this.address, this.amount);
    // We have a call operation
    else Contract.call(this.address, this.name, this.args, this.amount);
  }
}

export function storeOperation(opIndex: u64, operation: Operation): void {
  // we simply use the Operation index as a key to store it
  Storage.set(makeOperationKey(opIndex), operation.serialize());
}

export function retrieveOperation(opIndex: u64): Result<Operation> {
  const operationKey = makeOperationKey(opIndex);

  if (Storage.has(operationKey)) {
    let operation = new Operation();
    operation.deserialize(Storage.get(operationKey));
    return new Result(operation);
  }

  return new Result(
    new Operation(),
    'unknown or already executed Operation index',
  );
}

export function hasOperation(opIndex: u64): bool {
  return Storage.has(makeOperationKey(opIndex));
}

function deleteOperation(opIndex: u64): void {
  const operationKey = makeOperationKey(opIndex);
  Storage.del(operationKey);
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
  const MAX_OWNERS: i32 = 255;

  // initialize nb of confirmations required
  const nbConfirmationsRequired = args
    .nextU8()
    .expect('Error while initializing nbConfirmationsRequired');

  assert(
    nbConfirmationsRequired > 0,
    'The number of confirmations required must be at least 1',
  );

  Storage.set(NB_CONFIRMATIONS_REQUIRED_KEY, u8toByte(nbConfirmationsRequired));

  // initialize array of owners addresses
  const ownerStringAddresses: Array<string> = args
    .nextStringArray()
    .expect('Error while initializing owners addresses array');

  // convert to actual Addresses
  const ownerAddresses: Array<Address> = [];
  for (let i = 0; i < ownerStringAddresses.length; i++)
    ownerAddresses.push(new Address(ownerStringAddresses[i]));

  assert(
    ownerAddresses.length > 0 && ownerAddresses.length <= MAX_OWNERS,
    'The multisig must have between one and 255 owners',
  );

  assert(
    (nbConfirmationsRequired as i32) <= ownerAddresses.length,
    'The number of confirmations cannot exceed the number of owners of the multisig',
  );

  let ownerWeight = new Map<string, u8>();
  for (let i = 0; i < ownerAddresses.length; i++) {
    let address = ownerAddresses[i].toString();
    assert(address, 'null address is not a valid owner');
    let currentWeight: u8 = 0;
    if (ownerWeight.has(address)) currentWeight = ownerWeight.get(address);
    ownerWeight.set(address, currentWeight + 1);
  }

  for (let i = 0; i < ownerAddresses.length; i++) {
    let address = ownerAddresses[i];
    // we store directly each address weight in the Storage
    Storage.set(
      makeOwnerKey(address),
      u8toByte(ownerWeight.get(address.toString())),
    );
  }

  // We store the list of owners to be queries later if needed
  Storage.set(
    OWNERS_ADDRESSES_KEY,
    serializableObjectsArrayToBytes(ownerAddresses),
  );

  // initialize operation index
  Storage.set(OPERATION_INDEX_KEY, u64ToBytes(0));
}

/**
 * Returns the version of this smart contract.
 * This versioning is following the best practices defined in https://semver.org/.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns contract version
 */
export function ms1_version(_: StaticArray<u8>): StaticArray<u8> {
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
export function ms1_deposit(_: StaticArray<u8>): void {
  generateEvent(
    createEvent(DEPOSIT_EVENT_NAME, [
      Context.caller().toString(),
      Context.transferredCoins().toString(),
      Coins.balance().toString(),
    ]),
  );
}

// ======================================================== //
// ====                 OPERATIONS                     ==== //
// ======================================================== //

/**
 * Submit a transaction operation and generate an event with its index number
 *
 * @example
 * ```typescript
 *   ms1_submitTransaction(
 *   new Args()
 *     .add<Address>(new Address("...")) // destination address
 *     .add(150000) // amount
 *     .serialize()
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the destination address for the transfert (Address)
 * - the amount of the operation (u64).
 * @returns operation index.
 */
export function ms1_submitTransaction(stringifyArgs: StaticArray<u8>): u64 {
  const args = new Args(stringifyArgs);

  // initialize address
  const address = args
    .nextSerializable<Address>()
    .expect('Error while initializing transaction operation address');

  // initialize amount
  const amount = args
    .nextU64()
    .expect('Error while initializing transaction operation amount');

  let opIndex = bytesToU64(Storage.get(OPERATION_INDEX_KEY));
  opIndex++;

  storeOperation(opIndex, new Operation(address, amount));

  // update the new opIndex value for the next operation
  Storage.set(OPERATION_INDEX_KEY, u64ToBytes(opIndex));

  generateEvent(
    createEvent(SUBMIT_TRANSACTION_EVENT_NAME, [
      Context.caller().toString(),
      opIndex.toString(),
      address.toString(),
      amount.toString(),
    ]),
  );

  return opIndex;
}

/**
 * Submit a call operation and generate an event with its index number
 *
 * @example
 * ```typescript
 *   ms1_submitCall(
 *   new Args()
 *     .add<Address>(new Address("...")) // smart contract address for the call
 *     .add(150000) // amount to transfer as part of the call
 *     .add<string>("fun_name") // the name of the function to call
 *     .add<Args>(new Args()...) // the arguments to the call
 *     .serialize()
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the smart contract address for the operation (Address)
 * - the transfered amount attached to the call (u64).
 * - the name of the function to call (string).
 * - the function arguments (Args).
 * @returns operation index.
 */
export function ms1_submitCall(stringifyArgs: StaticArray<u8>): u64 {
  const args = new Args(stringifyArgs);

  // initialize address
  const address = args
    .nextSerializable<Address>()
    .expect('Error while initializing call operation address');

  // initialize amount
  const amount = args
    .nextU64()
    .expect('Error while initializing call operation amount');

  // initialize amount
  const name = args
    .nextString()
    .expect('Error while initializing call operation function name');

  // initialize amount
  const callArgsData = args
    .nextBytes()
    .expect('Error while initializing call operation function args');
  const callArgs = new Args(callArgsData);

  let opIndex = bytesToU64(Storage.get(OPERATION_INDEX_KEY));
  opIndex++;

  storeOperation(opIndex, new Operation(address, amount, name, callArgs));

  // update the new opIndex value for the next operation
  Storage.set(OPERATION_INDEX_KEY, u64ToBytes(opIndex));

  generateEvent(
    createEvent(SUBMIT_CALL_EVENT_NAME, [
      Context.caller().toString(),
      opIndex.toString(),
      address.toString(),
      amount.toString(),
      name,
    ]),
  );

  return opIndex;
}

/**
 * Confirms an operation by an owner, and generate an event
 *
 * @example
 * ```typescript
 *   ms1_confirmOperation(
 *   new Args()
 *     .add(index) // the operation index
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the operation index (u64)
 */
export function ms1_confirmOperation(stringifyArgs: StaticArray<u8>): void {
  const args = new Args(stringifyArgs);

  // initialize operation index
  const opIndex = args
    .nextU64()
    .expect('Error while initializing operation index');

  let owner = Context.caller();

  // check owner is legit and retrieve the weight
  let ownerKey = makeOwnerKey(owner);
  assert(Storage.has(ownerKey), 'Caller address is not an owner');
  let weight = byteToU8(Storage.get(ownerKey));

  // check the operation exists and retrieve it from Storage
  let operation = retrieveOperation(opIndex).unwrap();

  // did we already confirm it?
  assert(
    !operation.isAlreadyConfirmed(owner),
    'The caller address has already confirmed this operation',
  );

  // confirm it and update the Storage
  operation.confirm(owner, weight);
  storeOperation(opIndex, operation);

  generateEvent(
    createEvent(CONFIRM_OPERATION_EVENT_NAME, [
      owner.toString(),
      opIndex.toString(),
    ]),
  );
}

/**
 * Execute an operation and generate an event in case of success
 *
 * @example
 * ```typescript
 *   ms1_executeOperation(
 *   new Args()
 *     .add(index) // the operation index
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the operation index (u64)
 */
export function ms1_executeOperation(stringifyArgs: StaticArray<u8>): void {
  const args = new Args(stringifyArgs);

  // initialize operation index
  const opIndex = args
    .nextU64()
    .expect('Error while initializing operation index');

  // check the operation exists and retrieve it from Storage
  let operation = retrieveOperation(opIndex).unwrap();

  // if the operation is sufficiently confirmed, execute it
  assert(
    operation.isValidated(),
    'The operation is unsufficiently confirmed, cannot execute',
  );
  operation.execute();

  // clean up Storage and remove executed operation
  // NB: we could decide to keep it for archive purposes but then the
  // Storage cost would increase forever.
  deleteOperation(opIndex);

  generateEvent(
    createEvent(EXECUTE_OPERATION_EVENT_NAME, [
      Context.caller().toString(),
      opIndex.toString(),
      operation.address.toString(),
      operation.amount.toString(),
    ]),
  );
}

/**
 * Revoke an operation confirmation by an owner, and generate an event
 *
 * @example
 * ```typescript
 *   ms1_revokeConfirmation(
 *   new Args()
 *     .add(index) // the operation index
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the operation index (u64)
 */
export function ms1_revokeConfirmation(stringifyArgs: StaticArray<u8>): void {
  const args = new Args(stringifyArgs);

  // initialize operation index
  const opIndex = args
    .nextU64()
    .expect('Error while initializing operation index');

  let owner = Context.caller();

  // check owner is legit and retrieve the weight
  let ownerKey = makeOwnerKey(owner);
  assert(Storage.has(ownerKey), 'Caller address is not an owner');
  let weight = byteToU8(Storage.get(ownerKey));

  // check the operation exists and retrieve it from Storage
  let operation = retrieveOperation(opIndex).unwrap();

  // did we actually already confirmed it?
  assert(
    operation.isAlreadyConfirmed(owner),
    'The caller address has not yet confirmed this operation',
  );

  // revoke it and update the Storage
  operation.revoke(owner, weight);
  storeOperation(opIndex, operation);

  generateEvent(
    createEvent(REVOKE_OPERATION_EVENT_NAME, [
      owner.toString(),
      opIndex.toString(),
    ]),
  );
}

/**
 * Retrieve the list of the multisig owners addresses as strings and emit an event
 *
 * @example
 * ```typescript
 *   let owners = bytesToSerializableObjectArray<Address>(ms1_getOwners()).unwrap();
 * ```
 *
 */
export function ms1_getOwners(_: StaticArray<u8>): StaticArray<u8> {
  let serializedOwnerAddresses = Storage.get(OWNERS_ADDRESSES_KEY);
  let owners = bytesToSerializableObjectArray<Address>(
    serializedOwnerAddresses,
  ).unwrap();

  // generate the event with the list of owners
  let eventPayLoad: Array<string> = [];
  for (let i = 0; i < owners.length; i++)
    eventPayLoad.push(owners[i].toString());
  generateEvent(createEvent(GET_OWNERS_EVENT_NAME, eventPayLoad));

  return serializedOwnerAddresses;
}

/**
 * Retrieve a currently stored operation and generate an event
 *
 * @example
 * ```typescript
 *   let operation = new Operation();
 *   operation.deserialize(ms1_getOperation(
 *     new Args()
 *       .add(index) // the operation index
 *       .serialize()
 *     ));
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the operation index (u64)
 */
export function ms1_getOperation(
  stringifyArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(stringifyArgs);

  // initialize operation index
  const opIndex = args
    .nextU64()
    .expect('Error while initializing operation index');

  // check the operation exists and retrieve it from Storage
  let operation = retrieveOperation(opIndex).unwrap();

  // generate the event with the list of confirmed owners
  let eventPayLoad: Array<string> = [
    opIndex.toString(),
    operation.address.toString(),
    operation.amount.toString(),
    operation.confirmationWeightedSum.toString(),
  ];
  for (let i = 0; i < operation.confirmedOwnerList.length; i++)
    eventPayLoad.push(operation.confirmedOwnerList[i].toString());
  generateEvent(createEvent(RETRIEVE_OPERATION_EVENT_NAME, eventPayLoad));

  return operation.serialize();
}

/**
 * Check if the operation defined by its index is a currently stored
 * operation.
 * @example
 * ```typescript
 *   ms1_hasOperation(
 *   new Args()
 *     .add(index) // the operation index
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the operation index (u64)
 */
export function ms1_hasOperation(
  stringifyArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(stringifyArgs);

  // initialize operation index
  const opIndex = args
    .nextU64()
    .expect('Error while initializing operation index');

  return boolToByte(hasOperation(opIndex));
}
