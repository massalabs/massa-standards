import {
  ms1_submitTransaction,
  ms1_submitCall,
  ms1_confirmOperation,
  ms1_executeOperation,
  ms1_revokeConfirmation,
  ms1_getOperation,
  ms1_cancelOperation,
  ms1_getOperationIndexList,
  constructor,
  Operation,
  retrieveOperation,
  hasOperation,
} from '../multisig';

import {
  Storage,
  mockAdminContext,
  Address,
  createEvent,
  Coins,
  generateEvent,
} from '@massalabs/massa-as-sdk';

import {
  Args,
  byteToU8,
  bytesToU64,
  stringToBytes,
  bytesToString,
  serializableObjectsArrayToBytes,
  bytesToSerializableObjectArray,
  bytesToFixedSizeArray,
  Serializable,
  Result,
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
const nbConfirmations: u8 = 2;

// the multisig owners
const owners: Array<string> = [
  'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq',
  'AU1qDAxGJ387ETi9JRQzZWSPKYq4YPXrFvdiE4VoXUaiAt38JFEC',
  'AU125TiSrnD2YatYfEyRAWnBdD7TEuVbvGFkFgDuaYc2bdKyqKtb',
];

// where operation funds are sent when a transaction operation is executed
const destination = 'AU155TiSrnD2YatYfEyRAWnBdD7TEuVbvGFkFgDuaYc2bdKyqKtb';

// owners declared to the constructor for testing. Note that owners[0] has
// a weight of 2 since it is mentionned twice in the list:
const ownerList = [owners[0], owners[0], owners[1], owners[2]];
const ownerWeight: Array<u8> = [2, 1, 1];

export const NB_CONFIRMATIONS_REQUIRED_KEY = stringToBytes(
  'NB CONFIRMATIONS REQUIRED',
);
export const OWNERS_ADDRESSES_KEY = stringToBytes('OWNERS ADDRESSES');
export const OPERATION_INDEX_KEY = stringToBytes('OPERATION INDEX');

export const OPERATION_INDEX_PREFIX_KEY = '00';
export const OWNER_PREFIX_KEY = '01';

function makeOwnerKey(owner: string): StaticArray<u8> {
  return stringToBytes(
    OWNER_PREFIX_KEY + bytesToString(new Args().add(owner).serialize()),
  );
}

// string are not serializable by default, we need this helper class
class SerializableString implements Serializable {
  s: string;

  constructor(s: string = '') {
    this.s = s;
  }

  public serialize(): StaticArray<u8> {
    return stringToBytes(this.s);
  }

  public deserialize(data: StaticArray<u8>, _offset: i32): Result<i32> {
    this.s = bytesToString(data);
    return new Result<i32>(0);
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
    // ---------------------------
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

    // -------------------------------------------------------
    // define a valid constructor for a 2:4 multisig
    const serializedArgs = new Args()
      .add(nbConfirmations)
      .add<Array<string>>(ownerList)
      .serialize();
    constructor(serializedArgs);

    // check the nb of confirmations required is properly stored
    expect(byteToU8(Storage.get(NB_CONFIRMATIONS_REQUIRED_KEY))).toBe(
      nbConfirmations,
    );

    // compare the array of addresses as string to the array of Address in storage
    let serializableStringList: Array<SerializableString> = [];
    for (let i = 0; i < ownerList.length; ++i)
      serializableStringList.push(new SerializableString(ownerList[i]));
    let ownersFromStorage = bytesToSerializableObjectArray<Address>(
      Storage.get(OWNERS_ADDRESSES_KEY),
    ).unwrap();
    let serializableOwnerStringList: Array<SerializableString> = [];
    for (let i = 0; i < ownersFromStorage.length; ++i)
      serializableOwnerStringList.push(
        new SerializableString(ownersFromStorage[i].toString()),
      );
    expect(
      serializableObjectsArrayToBytes<SerializableString>(
        serializableOwnerStringList,
      ),
    ).toStrictEqual(
      serializableObjectsArrayToBytes<SerializableString>(
        serializableStringList,
      ),
    );

    // check the weight of each owner
    expect(byteToU8(Storage.get(makeOwnerKey(owners[0])))).toBe(2);
    expect(byteToU8(Storage.get(makeOwnerKey(owners[1])))).toBe(1);
    expect(byteToU8(Storage.get(makeOwnerKey(owners[2])))).toBe(1);

    // check that the operation index is set to 0
    expect(bytesToU64(Storage.get(OPERATION_INDEX_KEY))).toBe(0);

    // check that there are no operation registered yet
    let operationList = bytesToFixedSizeArray<u64>(
      ms1_getOperationIndexList([]),
    );
    expect(operationList.length).toBe(0);
  });

  test('submit operation by non owner', () => {
    // expect the operation submission to fail
    expect(() => {
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      );
    }).toThrow();
  });

  test('submit transaction operation', () => {
    // pick owners[1] as the operation creator
    switchUser(owners[1]);

    // expect the operation index to be 1
    expect(
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      ),
    ).toBe(1);

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
    // pick owners[1] as the operation creator
    switchUser(owners[1]);

    let confirmingOwnersIndexes: Array<u8>;
    let opIndex: u64;
    let totalWeight: u8;

    confirmingOwnersIndexes = [0];
    opIndex = 2;

    expect(
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      ),
    ).toBe(opIndex);

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
      expect(operation.isAlreadyConfirmed(new Address(ownerAddress))).toBe(
        true,
      );
    }

    switchUser(deployerAddress);
    // retrieve the operation in its final state in Storage
    let operation = retrieveOperation(opIndex).unwrap();
    expect(operation.isValidated()).toBe(true);
  });

  // non validated operation
  test('confirm transaction operation [owners[1]]', () => {
    // pick owners[1] as the operation creator
    switchUser(owners[1]);

    let confirmingOwnersIndexes: Array<u8>;
    let opIndex: u64;
    let totalWeight: u8;

    confirmingOwnersIndexes = [1];
    opIndex = 3;

    expect(
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      ),
    ).toBe(opIndex);

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
      expect(operation.isAlreadyConfirmed(new Address(ownerAddress))).toBe(
        true,
      );
    }

    switchUser(deployerAddress);
    // retrieve the operation in its final state in Storage
    let operation: Operation = retrieveOperation(opIndex).unwrap();
    expect(operation.isValidated()).toBe(false);
  });

  // non validated operation
  test('confirm transaction operation [owners[2]]', () => {
    // pick owners[1] as the operation creator
    switchUser(owners[1]);

    let confirmingOwnersIndexes: Array<u8>;
    let opIndex: u64;
    let totalWeight: u8;

    confirmingOwnersIndexes = [2];
    opIndex = 4;

    expect(
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      ),
    ).toBe(opIndex);

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
      expect(operation.isAlreadyConfirmed(new Address(ownerAddress))).toBe(
        true,
      );
    }

    switchUser(deployerAddress);
    // retrieve the operation in its final state in Storage
    let operation = retrieveOperation(opIndex).unwrap();
    expect(operation.isValidated()).toBe(false);
  });

  // validated operation
  test('confirm transaction operation [owners[1], owners[2]]', () => {
    // pick owners[1] as the operation creator
    switchUser(owners[1]);

    let confirmingOwnersIndexes: Array<u8>;
    let opIndex: u64;
    let totalWeight: u8;

    confirmingOwnersIndexes = [1, 2];
    opIndex = 5;

    expect(
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      ),
    ).toBe(opIndex);

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
      expect(operation.isAlreadyConfirmed(new Address(ownerAddress))).toBe(
        true,
      );
    }

    switchUser(deployerAddress);
    // retrieve the operation in its final state in Storage
    let operation = retrieveOperation(opIndex).unwrap();
    expect(operation.isValidated()).toBe(true);
  });

  // test of the call operation constructor
  test('submit call operation', () => {
    // pick owners[1] as the operation creator
    switchUser(owners[1]);

    expect(
      ms1_submitCall(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .add<string>('getValueAt')
          .add<StaticArray<u8>>(new Args().add(42).serialize())
          .serialize(),
      ),
    ).toBe(6);

    // check that the operation is correctly stored
    let operationResult = retrieveOperation(6);
    expect(operationResult.isOk()).toBe(true);

    // check the operation content
    let operation = operationResult.unwrap();
    expect(operation.address).toBe(new Address(destination));
    expect(operation.amount).toBe(u64(15000));
    expect(operation.name).toBe('getValueAt');
    expect(operation.args).toStrictEqual(new Args().add(42));
    expect(operation.confirmedOwnerList.length).toBe(0);
    expect(operation.confirmationWeightedSum).toBe(0);
    expect(operation.isAlreadyConfirmed(new Address(owners[0]))).toBe(false);
    expect(operation.isValidated()).toBe(false);
  });

  // test of the operation cancelation
  test('cancel operation by creator', () => {
    // pick owners[1] as the operation creator
    switchUser(owners[1]);
    expect(
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      ),
    ).toBe(7);

    expect(() => {
      ms1_cancelOperation(new Args().add(u64(7)).serialize());
    }).not.toThrow();

    // check that the operation is indeed canceled
    expect(hasOperation(7)).toBe(false);
    switchUser(deployerAddress);
  });

  test('cancel operation by non creator (will fail)', () => {
    // pick owners[1] as the operation creator
    switchUser(owners[1]);
    expect(
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      ),
    ).toBe(8);

    switchUser(owners[2]);
    expect(() => {
      ms1_cancelOperation(new Args().add(u64(8)).serialize());
    }).toThrow();

    // check that the operation is indeed not canceled
    expect(hasOperation(8)).toBe(true);
    switchUser(deployerAddress);
  });

  test('cancel operation by no owner/creator (will fail)', () => {
    // pick owners[1] as the operation creator
    switchUser(owners[1]);
    expect(
      ms1_submitTransaction(
        new Args()
          .add<Address>(new Address(destination))
          .add(u64(15000))
          .serialize(),
      ),
    ).toBe(9);

    switchUser(deployerAddress);
    expect(() => {
      ms1_cancelOperation(new Args().add(u64(9)).serialize());
    }).toThrow();

    // check that the operation is indeed not canceled
    expect(hasOperation(9)).toBe(true);
  });

  // operation 5 is validated, let's execute it
  test('execute transaction operation with success', () => {
    let destinationBalance = Coins.balanceOf(destination);
    let contractBalance = Coins.balanceOf(contractAddr);
    let initDestinationBalance = destinationBalance;
    let initContractBalance = contractBalance;

    generateEvent(
      createEvent('BALANCES BEFORE', [
        initDestinationBalance.toString(),
        initContractBalance.toString(),
      ]),
    );

    expect(() => {
      ms1_executeOperation(new Args().add(u64(5)).serialize());
    }).not.toThrow();

    // once executed, the operation is deleted
    expect(() => {
      ms1_getOperation(new Args().add(u64(5)).serialize());
    }).toThrow();

    destinationBalance = Coins.balanceOf(destination);
    contractBalance = Coins.balanceOf(contractAddr);
    generateEvent(
      createEvent('BALANCES AFTER', [
        destinationBalance.toString(),
        contractBalance.toString(),
      ]),
    );

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
      createEvent('BALANCES BEFORE', [
        initDestinationBalance.toString(),
        initContractBalance.toString(),
      ]),
    );

    expect(() => {
      ms1_executeOperation(new Args().add(u64(4)).serialize());
    }).toThrow();

    // the operation is not supposed to be deleted
    expect(() => {
      ms1_getOperation(new Args().add(u64(4)).serialize());
    }).not.toThrow();

    destinationBalance = Coins.balanceOf(destination);
    contractBalance = Coins.balanceOf(contractAddr);
    generateEvent(
      createEvent('BALANCES AFTER', [
        destinationBalance.toString(),
        contractBalance.toString(),
      ]),
    );

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
      createEvent('BALANCES BEFORE', [
        initDestinationBalance.toString(),
        initContractBalance.toString(),
      ]),
    );

    expect(() => {
      ms1_executeOperation(new Args().add(u64(2)).serialize());
    }).toThrow();

    // the operation should not have been deleted
    expect(() => {
      ms1_getOperation(new Args().add(u64(2)).serialize());
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
      createEvent('BALANCES AFTER', [
        destinationBalance.toString(),
        contractBalance.toString(),
      ]),
    );

    // check that the transfer has not been done
    expect(destinationBalance).toBe(initDestinationBalance);
    expect(contractBalance).toBe(initContractBalance);
  });

  // check that the list of operations is now [1,3,4,6,8,9]
  test('check operation index list', () => {
    let operationList = bytesToFixedSizeArray<u64>(
      ms1_getOperationIndexList([]),
    );
    expect(operationList.length).toBe(7);
    expect(operationList).toStrictEqual([1, 2, 3, 4, 6, 8, 9]);
  });
});
