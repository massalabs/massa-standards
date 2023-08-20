import {
  ms1_deposit,
  ms1_submitOperation,
  ms1_confirmOperation,
  ms1_executeOperation,
  ms1_revokeConfirmation,
  ms1_getOwners,
  ms1_getOperation,
  constructor,
  Operation,
  retrieveOperation
} from '../multisig';

import { Storage,
         mockAdminContext,
         Address,
         createEvent,
         Coins,
         generateEvent } from '@massalabs/massa-as-sdk';

import {
  Args,
  byteToBool,
  byteToU8,
  bytesToU64,
  stringToBytes,
  bytesToString,
  serializableObjectsArrayToBytes,
  bytesToSerializableObjectArray,
  Serializable
} from '@massalabs/as-types';

import {
  changeCallStack,
  resetStorage,
} from '@massalabs/massa-as-sdk/assembly/vm-mock/storage';

// address of admin caller set in vm-mock. must match with adminAddress of @massalabs/massa-as-sdk/vm-mock/vm.js
const deployerAddress = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

// nb of confirmations required
const nbConfirmations : u8 = 2;

// the multisig owners
const owners : Array<string> = [
  'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq',
  'AU1qDAxGJ387ETi9JRQzZWSPKYq4YPXrFvdiE4VoXUaiAt38JFEC',
  'AU125TiSrnD2YatYfEyRAWnBdD7TEuVbvGFkFgDuaYc2bdKyqKtb'
];

// where operation funds are sent
const destination = 'AU155TiSrnD2YatYfEyRAWnBdD7TEuVbvGFkFgDuaYc2bdKyqKtb';

const ownerList = [owners[0], owners[0], owners[1], owners[2]];
const ownerWeight : Array<u8> = [2, 1, 1];

export const OPERATION_INDEX_PREFIX_KEY = '00';
export const OWNER_PREFIX_KEY = '01';

export const NB_CONFIRMATIONS_REQUIRED_KEY = stringToBytes('NB CONFIRMATIONS REQUIRED');
export const OWNERS_ADDRESSES_KEY = stringToBytes('OWNERS ADDRESSES');
export const OPERATION_INDEX_KEY = stringToBytes('OPERATION INDEX');

function makeOperationKey(opIndex: u64) : StaticArray<u8> {
    return stringToBytes(OPERATION_INDEX_PREFIX_KEY +
                         bytesToString(u64ToBytes(opIndex)));
}

function makeOwnerKey(owner: string) : StaticArray<u8> {
    return stringToBytes(OWNER_PREFIX_KEY +
              bytesToString(new Args().add(owner).serialize()));
}

class SerializableString implements Serializable {
  s: string;

  constructor(s: string = '') {
    this.s = s;
  }

  public serialize(): StaticArray<u8> {

    return stringToBytes(this.s);
  }

  public deserialize(
    data: StaticArray<u8>,
    offset: i32,
  ): Result<i32> {

    this.s = bytesToString(data);
    return Result<i32>(0);
  }
}

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
  resetStorage();
  mockAdminContext(true);
});

describe('Multisig contract tests', () => {
  test('constructor', () => {

    //---------------------------
    // check invalid constructors

    // 0 confirmations
    expect(() => {
      const serializedArgs = new Args()
        .add(u8(0))
        .add<Array<string>>(ownerList)
        .serialize();
      constructor(serializedArgs);
    }).toThrow();

    // no owners
    expect(() => {
      const serializedArgs = new Args()
        .add(u8(1))
        .add<Array<string>>([])
        .serialize();
      constructor(serializedArgs);
    }).toThrow();

    // invalid args
    expect(() => {
      constructor([]);
    }).toThrow();

    resetStorage();

    //-------------------------------------------------------
    // define a valid constructor for a transaction operation
    const serializedArgs = new Args()
      .add(nbConfirmations)
      .add<Array<string>>(ownerList)
      .serialize();
    constructor(serializedArgs);

    // check the nb of confirmation required is properly stored
    expect(byteToU8(Storage.get(NB_CONFIRMATIONS_REQUIRED_KEY))).toBe(nbConfirmations);

    // compare the array of addresses as string to the array of Address in storage
    let serializableStringList : Array<SerializableString> = [];
    for (let i = 0; i < ownerList.length; ++i)
        serializableStringList.push(new SerializableString(ownerList[i]));
    let ownersFromStorage = bytesToSerializableObjectArray<Address>(
                              Storage.get(OWNERS_ADDRESSES_KEY)).unwrap();
    let serializableOwnerStringList : Array<SerializableString> = [];
    for (let i = 0; i < ownersFromStorage.length; ++i)
        serializableOwnerStringList.push(new SerializableString(ownersFromStorage[i].toString()));
    expect(serializableObjectsArrayToBytes<SerializableString>(serializableOwnerStringList))
      .toStrictEqual(serializableObjectsArrayToBytes<SerializableString>(serializableStringList));

    // check the weight of each owner
    expect(byteToU8(Storage.get(makeOwnerKey(owners[0])))).toBe(2);
    expect(byteToU8(Storage.get(makeOwnerKey(owners[1])))).toBe(1);
    expect(byteToU8(Storage.get(makeOwnerKey(owners[2])))).toBe(1);

    // check that the operation index is set to 0
    expect(bytesToU64(Storage.get(OPERATION_INDEX_KEY))).toBe(0);
  });

  test('submit transaction operation', () => {

    // expect the operation index to be 1
    expect(ms1_submitOperation(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(1);

    // check that the operation is correctly stored
    let operationResult = retrieveOperation(1);
    expect(operationResult.isOk()).toBe(true);

    // check the operation content
    let operation = operationResult.unwrap();
    expect(operation.address).toBe(new Address(destination));
    expect(operation.amount).toBe(u64(15000));
    expect(operation.confirmedOwnerList.length).toBe(0);
    expect(operation.confirmationWeightedSum).toBe(0);
    expect(operation.isAlreadyConfirmed(new Address(owners[0]))).toBe(false);
    expect(operation.isValidated()).toBe(false);
  });

  // validated operation
  test('confirm transaction operation [owners[0]]', () => {
    let confirmingOwnersIndexes : Array<u8>;
    let opIndex : u64;
    let totalWeight : u8;

    confirmingOwnersIndexes = [0];
    opIndex = 2;

    expect(ms1_submitOperation(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(opIndex);

    totalWeight = 0;
    for (let i = 0; i < confirmingOwnersIndexes.length; ++i) {
        let ownerAddress = owners[confirmingOwnersIndexes[i]];
        switchUser(ownerAddress);
        ms1_confirmOperation(new Args().add(opIndex).serialize());
        totalWeight += ownerWeight[confirmingOwnersIndexes[i]];

        // retrieve the operation in its current state in Storage
        let operation = retrieveOperation(opIndex).unwrap();

        expect(operation.address).toBe(new Address(destination));
        expect(operation.amount).toBe(u64(15000));
        expect(operation.confirmedOwnerList.length).toBe(i + 1);
        expect(operation.confirmationWeightedSum).toBe(totalWeight);
        expect(operation.isAlreadyConfirmed(new Address(ownerAddress))).toBe(true);
    }

    switchUser(deployerAddress);
    // retrieve the operation in its final state in Storage
    let operation = retrieveOperation(opIndex).unwrap();
    expect(operation.isValidated()).toBe(true);
  });

  // non validated operation
  test('confirm transaction operation [owners[1]]', () => {
    let confirmingOwnersIndexes : Array<u8>;
    let opIndex : u64;
    let totalWeight : u8;

    confirmingOwnersIndexes = [1];
    opIndex = 3;

    expect(ms1_submitOperation(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(opIndex);

    totalWeight = 0;
    for (let i = 0; i < confirmingOwnersIndexes.length; ++i) {
        let ownerAddress = owners[confirmingOwnersIndexes[i]];
        switchUser(ownerAddress);
        ms1_confirmOperation(new Args().add(opIndex).serialize());
        totalWeight += ownerWeight[confirmingOwnersIndexes[i]];

        // retrieve the operation in its current state in Storage
        let operation = retrieveOperation(opIndex).unwrap();

        expect(operation.address).toBe(new Address(destination));
        expect(operation.amount).toBe(u64(15000));
        expect(operation.confirmedOwnerList.length).toBe(i + 1);
        expect(operation.confirmationWeightedSum).toBe(totalWeight);
        expect(operation.isAlreadyConfirmed(new Address(ownerAddress))).toBe(true);
    }

    switchUser(deployerAddress);
    // retrieve the operation in its final state in Storage
    let operation = retrieveOperation(opIndex).unwrap();
    expect(operation.isValidated()).toBe(false);
  });

  // non validated operation
  test('confirm transaction operation [owners[2]]', () => {
    let confirmingOwnersIndexes : Array<u8>;
    let opIndex : u64;
    let totalWeight : u8;

    confirmingOwnersIndexes = [2];
    opIndex = 4;

    expect(ms1_submitOperation(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(opIndex);

    totalWeight = 0;
    for (let i = 0; i < confirmingOwnersIndexes.length; ++i) {
        let ownerAddress = owners[confirmingOwnersIndexes[i]];
        switchUser(ownerAddress);
        ms1_confirmOperation(new Args().add(opIndex).serialize());
        totalWeight += ownerWeight[confirmingOwnersIndexes[i]];

        // retrieve the operation in its current state in Storage
        let operation = retrieveOperation(opIndex).unwrap();

        expect(operation.address).toBe(new Address(destination));
        expect(operation.amount).toBe(u64(15000));
        expect(operation.confirmedOwnerList.length).toBe(i + 1);
        expect(operation.confirmationWeightedSum).toBe(totalWeight);
        expect(operation.isAlreadyConfirmed(new Address(ownerAddress))).toBe(true);
    }

    switchUser(deployerAddress);
    // retrieve the operation in its final state in Storage
    let operation = retrieveOperation(opIndex).unwrap();
    expect(operation.isValidated()).toBe(false);
  });

  // validated operation
  test('confirm transaction operation [owners[1], owners[2]]', () => {
    let confirmingOwnersIndexes : Array<u8>;
    let opIndex : u64;
    let totalWeight : u8;

    confirmingOwnersIndexes = [1,2];
    opIndex = 5;

    expect(ms1_submitOperation(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(opIndex);

    totalWeight = 0;
    for (let i = 0; i < confirmingOwnersIndexes.length; ++i) {
        let ownerAddress = owners[confirmingOwnersIndexes[i]];
        switchUser(ownerAddress);
        ms1_confirmOperation(new Args().add(opIndex).serialize());
        totalWeight += ownerWeight[confirmingOwnersIndexes[i]];

        // retrieve the operation in its current state in Storage
        let operation = retrieveOperation(opIndex).unwrap();

        expect(operation.address).toBe(new Address(destination));
        expect(operation.amount).toBe(u64(15000));
        expect(operation.confirmedOwnerList.length).toBe(i + 1);
        expect(operation.confirmationWeightedSum).toBe(totalWeight);
        expect(operation.isAlreadyConfirmed(new Address(ownerAddress))).toBe(true);
    }

    switchUser(deployerAddress);
    // retrieve the operation in its final state in Storage
    let operation = retrieveOperation(opIndex).unwrap();
    expect(operation.isValidated()).toBe(true);
  });

  // operation 5 is validated, let's execute it
  test('execute transaction operation with success', () => {
    let destinationBalance = Coins.balanceOf(destination);
    let contractBalance = Coins.balanceOf(contractAddr);
    let initDestinationBalance = destinationBalance;
    let initContractBalance = contractBalance;

    generateEvent(
      createEvent("BALANCES BEFORE",
        [initDestinationBalance.toString(), initContractBalance.toString()]
    ));

    expect(() => {
        ms1_executeOperation(new Args().add(u64(5)).serialize());
      }).not.toThrow();

    // once executed, the operation is deleted
    expect(() => {
        ms1_getOperation(new Args().add(u64(5)).serialize())
      }).toThrow();

    destinationBalance = Coins.balanceOf(destination);
    contractBalance = Coins.balanceOf(contractAddr);
    generateEvent(
      createEvent("BALANCES AFTER",
        [destinationBalance.toString(), contractBalance.toString()]
    ));

    // check that the transfer has been done
    expect(destinationBalance).toBe(initDestinationBalance + 15000);
    expect(contractBalance + 15000).toBe(initContractBalance);
  });

  // operation 4 is not validated, let's try to execute it
  test('execute transaction operation with failure', () => {
    let destinationBalance = Coins.balanceOf(destination);
    let contractBalance = Coins.balanceOf(contractAddr);
    let initDestinationBalance = destinationBalance;
    let initContractBalance = contractBalance;

    generateEvent(
      createEvent("BALANCES BEFORE",
        [initDestinationBalance.toString(), initContractBalance.toString()]
    ));

    expect(() => {
        ms1_executeOperation(new Args().add(u64(4)).serialize());
      }).toThrow();

    // the operation is not supposed to be deleted
    expect(() => {
        ms1_getOperation(new Args().add(u64(4)).serialize())
      }).not.toThrow();

    destinationBalance = Coins.balanceOf(destination);
    contractBalance = Coins.balanceOf(contractAddr);
    generateEvent(
      createEvent("BALANCES AFTER",
        [destinationBalance.toString(), contractBalance.toString()]
    ));

    // check that the transfer has not been done
    expect(destinationBalance).toBe(initDestinationBalance);
    expect(contractBalance).toBe(initContractBalance);
  });

  // operation 2 is validated by owners[0].
  // now owners[0] will revoke it and we will try to execute it.
  test('revoke operation', () => {
    let destinationBalance = Coins.balanceOf(destination);
    let contractBalance = Coins.balanceOf(contractAddr);
    let initDestinationBalance = destinationBalance;
    let initContractBalance = contractBalance;

    switchUser(owners[0]);
    expect(() => {
      ms1_revokeConfirmation(new Args().add(u64(2)).serialize());
    }).not.toThrow();

    switchUser(deployerAddress);
    generateEvent(
      createEvent("BALANCES BEFORE",
        [initDestinationBalance.toString(), initContractBalance.toString()]
    ));

    expect(() => {
        ms1_executeOperation(new Args().add(u64(2)).serialize());
      }).toThrow();

    // the operation should not have been deleted
    expect(() => {
        ms1_getOperation(new Args().add(u64(2)).serialize())
      }).not.toThrow();


    // retrieve the operation in its current state in Storage
    let operation = retrieveOperation(u64(2)).unwrap();

    expect(operation.address).toBe(new Address(destination));
    expect(operation.amount).toBe(u64(15000));
    expect(operation.confirmedOwnerList.length).toBe(0);
    expect(operation.confirmationWeightedSum).toBe(0);
    expect(operation.isAlreadyConfirmed(new Address(owners[0]))).toBe(false);
    expect(operation.isValidated()).toBe(false);

    destinationBalance = Coins.balanceOf(destination);
    contractBalance = Coins.balanceOf(contractAddr);
    generateEvent(
      createEvent("BALANCES AFTER",
        [destinationBalance.toString(), contractBalance.toString()]
    ));

    // check that the transfer has not been done
    expect(destinationBalance).toBe(initDestinationBalance);
    expect(contractBalance).toBe(initContractBalance);
  });
});
