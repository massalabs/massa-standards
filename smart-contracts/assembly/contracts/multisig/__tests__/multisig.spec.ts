import {
  ms1_deposit,
  ms1_submitTransaction,
  ms1_confirmTransaction,
  ms1_executeTransaction,
  ms1_revokeConfirmation,
  ms1_getOwners,
  ms1_getTransaction,
  constructor,
  Transaction,
  retrieveTransaction
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

// where transaction funds are sent
const destination = 'AU155TiSrnD2YatYfEyRAWnBdD7TEuVbvGFkFgDuaYc2bdKyqKtb';

const ownerList = [owners[0], owners[0], owners[1], owners[2]];
const ownerWeight : Array<u8> = [2, 1, 1];

export const TRANSACTION_INDEX_PREFIX_KEY = '00';
export const OWNER_PREFIX_KEY = '01';

export const NB_CONFIRMATIONS_REQUIRED_KEY = stringToBytes('NB CONFIRMATIONS REQUIRED');
export const OWNERS_ADDRESSES_KEY = stringToBytes('OWNERS ADDRESSES');
export const TRANSACTION_INDEX_KEY = stringToBytes('TRANSACTION INDEX');

function makeTransactionKey(txIndex: u64) : StaticArray<u8> {
    return stringToBytes(TRANSACTION_INDEX_PREFIX_KEY +
                         bytesToString(u64ToBytes(txIndex)));
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

    //---------------------------
    // define a valid constructor
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

    // check that the index transaction is set to 0
    expect(bytesToU64(Storage.get(TRANSACTION_INDEX_KEY))).toBe(0);
  });

  test('submit transaction', () => {

    // expect the transaction index to be 1
    expect(ms1_submitTransaction(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(1);

    // check that the transaction is correctly stored
    let transactionResult = retrieveTransaction(1);
    expect(transactionResult.isOk()).toBe(true);

    // check the transaction content
    let transaction = transactionResult.unwrap();
    expect(transaction.toAddress).toBe(new Address(destination));
    expect(transaction.amount).toBe(u64(15000));
    expect(transaction.confirmedOwnerList.length).toBe(0);
    expect(transaction.confirmationWeightedSum).toBe(0);
    expect(transaction.isAlreadyConfirmed(new Address(owners[0]))).toBe(false);
    expect(transaction.isValidated()).toBe(false);
  });

  // validated transaction
  test('confirm transaction [owners[0]]', () => {
    let confirmingOwnersIndexes : Array<u8>;
    let txIndex : u64;
    let totalWeight : u8;

    confirmingOwnersIndexes = [0];
    txIndex = 2;

    expect(ms1_submitTransaction(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(txIndex);

    totalWeight = 0;
    for (let i = 0; i < confirmingOwnersIndexes.length; ++i) {
        let ownerAddress = owners[confirmingOwnersIndexes[i]];
        switchUser(ownerAddress);
        ms1_confirmTransaction(new Args().add(txIndex).serialize());
        totalWeight += ownerWeight[confirmingOwnersIndexes[i]];

        // retrieve the transaction in its current state in Storage
        let transaction = retrieveTransaction(txIndex).unwrap();

        expect(transaction.toAddress).toBe(new Address(destination));
        expect(transaction.amount).toBe(u64(15000));
        expect(transaction.confirmedOwnerList.length).toBe(i + 1);
        expect(transaction.confirmationWeightedSum).toBe(totalWeight);
        expect(transaction.isAlreadyConfirmed(new Address(ownerAddress))).toBe(true);
    }

    switchUser(deployerAddress);
    // retrieve the transaction in its final state in Storage
    let transaction = retrieveTransaction(txIndex).unwrap();
    expect(transaction.isValidated()).toBe(true);
  });

  // non validated transaction
  test('confirm transaction [owners[1]]', () => {
    let confirmingOwnersIndexes : Array<u8>;
    let txIndex : u64;
    let totalWeight : u8;

    confirmingOwnersIndexes = [1];
    txIndex = 3;

    expect(ms1_submitTransaction(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(txIndex);

    totalWeight = 0;
    for (let i = 0; i < confirmingOwnersIndexes.length; ++i) {
        let ownerAddress = owners[confirmingOwnersIndexes[i]];
        switchUser(ownerAddress);
        ms1_confirmTransaction(new Args().add(txIndex).serialize());
        totalWeight += ownerWeight[confirmingOwnersIndexes[i]];

        // retrieve the transaction in its current state in Storage
        let transaction = retrieveTransaction(txIndex).unwrap();

        expect(transaction.toAddress).toBe(new Address(destination));
        expect(transaction.amount).toBe(u64(15000));
        expect(transaction.confirmedOwnerList.length).toBe(i + 1);
        expect(transaction.confirmationWeightedSum).toBe(totalWeight);
        expect(transaction.isAlreadyConfirmed(new Address(ownerAddress))).toBe(true);
    }

    switchUser(deployerAddress);
    // retrieve the transaction in its final state in Storage
    let transaction = retrieveTransaction(txIndex).unwrap();
    expect(transaction.isValidated()).toBe(false);
  });

  // non validated transaction
  test('confirm transaction [owners[2]]', () => {
    let confirmingOwnersIndexes : Array<u8>;
    let txIndex : u64;
    let totalWeight : u8;

    confirmingOwnersIndexes = [2];
    txIndex = 4;

    expect(ms1_submitTransaction(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(txIndex);

    totalWeight = 0;
    for (let i = 0; i < confirmingOwnersIndexes.length; ++i) {
        let ownerAddress = owners[confirmingOwnersIndexes[i]];
        switchUser(ownerAddress);
        ms1_confirmTransaction(new Args().add(txIndex).serialize());
        totalWeight += ownerWeight[confirmingOwnersIndexes[i]];

        // retrieve the transaction in its current state in Storage
        let transaction = retrieveTransaction(txIndex).unwrap();

        expect(transaction.toAddress).toBe(new Address(destination));
        expect(transaction.amount).toBe(u64(15000));
        expect(transaction.confirmedOwnerList.length).toBe(i + 1);
        expect(transaction.confirmationWeightedSum).toBe(totalWeight);
        expect(transaction.isAlreadyConfirmed(new Address(ownerAddress))).toBe(true);
    }

    switchUser(deployerAddress);
    // retrieve the transaction in its final state in Storage
    let transaction = retrieveTransaction(txIndex).unwrap();
    expect(transaction.isValidated()).toBe(false);
  });

  // validated transaction
  test('confirm transaction [owners[1], owners[2]]', () => {
    let confirmingOwnersIndexes : Array<u8>;
    let txIndex : u64;
    let totalWeight : u8;

    confirmingOwnersIndexes = [1,2];
    txIndex = 5;

    expect(ms1_submitTransaction(new Args()
      .add<Address>(new Address(destination))
      .add(u64(15000))
      .serialize()
    )).toBe(txIndex);

    totalWeight = 0;
    for (let i = 0; i < confirmingOwnersIndexes.length; ++i) {
        let ownerAddress = owners[confirmingOwnersIndexes[i]];
        switchUser(ownerAddress);
        ms1_confirmTransaction(new Args().add(txIndex).serialize());
        totalWeight += ownerWeight[confirmingOwnersIndexes[i]];

        // retrieve the transaction in its current state in Storage
        let transaction = retrieveTransaction(txIndex).unwrap();

        expect(transaction.toAddress).toBe(new Address(destination));
        expect(transaction.amount).toBe(u64(15000));
        expect(transaction.confirmedOwnerList.length).toBe(i + 1);
        expect(transaction.confirmationWeightedSum).toBe(totalWeight);
        expect(transaction.isAlreadyConfirmed(new Address(ownerAddress))).toBe(true);
    }

    switchUser(deployerAddress);
    // retrieve the transaction in its final state in Storage
    let transaction = retrieveTransaction(txIndex).unwrap();
    expect(transaction.isValidated()).toBe(true);
  });

  // transaction 5 is validated, let's execute it
  test('execute transaction with success', () => {
    let destinationBalance = Coins.balanceOf(destination);
    let contractBalance = Coins.balanceOf(contractAddr);
    let initDestinationBalance = destinationBalance;
    let initContractBalance = contractBalance;

    generateEvent(
      createEvent("BALANCES BEFORE",
        [initDestinationBalance.toString(), initContractBalance.toString()]
    ));

    expect(() => {
        ms1_executeTransaction(new Args().add(u64(5)).serialize());
      }).not.toThrow();

    // once executed, the transaction is deleted
    expect(() => {
        ms1_getTransaction(new Args().add(u64(5)).serialize())
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

  // transaction 4 is not validated, let's try to execute it
  test('execute transaction with failure', () => {
    let destinationBalance = Coins.balanceOf(destination);
    let contractBalance = Coins.balanceOf(contractAddr);
    let initDestinationBalance = destinationBalance;
    let initContractBalance = contractBalance;

    generateEvent(
      createEvent("BALANCES BEFORE",
        [initDestinationBalance.toString(), initContractBalance.toString()]
    ));

    expect(() => {
        ms1_executeTransaction(new Args().add(u64(4)).serialize());
      }).toThrow();

    // the transaction is not supposed to be deleted
    expect(() => {
        ms1_getTransaction(new Args().add(u64(4)).serialize())
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

  // transaction 2 is validated by owners[0].
  // now owners[0] will revoke it and we will try to execute it.
  test('revoke transaction', () => {
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
        ms1_executeTransaction(new Args().add(u64(2)).serialize());
      }).toThrow();

    // the transaction should not have been deleted
    expect(() => {
        ms1_getTransaction(new Args().add(u64(2)).serialize())
      }).not.toThrow();


    // retrieve the transaction in its current state in Storage
    let transaction = retrieveTransaction(u64(2)).unwrap();

    expect(transaction.toAddress).toBe(new Address(destination));
    expect(transaction.amount).toBe(u64(15000));
    expect(transaction.confirmedOwnerList.length).toBe(0);
    expect(transaction.confirmationWeightedSum).toBe(0);
    expect(transaction.isAlreadyConfirmed(new Address(owners[0]))).toBe(false);
    expect(transaction.isValidated()).toBe(false);

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
