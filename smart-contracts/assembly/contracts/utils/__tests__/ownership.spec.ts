import { Args, boolToByte, stringToBytes } from '@massalabs/as-types';
import { Storage, changeCallStack } from '@massalabs/massa-as-sdk';
import { isOwner, onlyOwner, ownerAddress, setOwner } from '../ownership';

import { resetStorage } from '@massalabs/massa-as-sdk';
import { OWNER_KEY } from '../ownership-internal';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

const owner = 'AUDeadBeefDeadBeefDeadBeefDeadBeefDeadBeefDeadBOObs';
const ownerArg = new Args().add(owner).serialize();

const randomUser = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiq';
beforeAll(() => {
  log('beforeAll');
  resetStorage();
});

describe('Ownership', () => {
  describe('Ownership not set', () => {
    test('OWNER_KEY is not set', () =>
      expect(Storage.has(OWNER_KEY)).toStrictEqual(false));
    test('ownerAddress is empty', () =>
      expect(ownerAddress([])).toStrictEqual(stringToBytes('')));
    test('isOwner is false', () =>
      expect(isOwner(ownerArg)).toStrictEqual(boolToByte(false)));
    throws('onlyOwner throw', () => onlyOwner());
    test('set owner', () => setOwner(ownerArg));
  });

  describe('Ownership is set', () => {
    test('OWNER_KEY is set', () =>
      expect(Storage.has(OWNER_KEY)).toStrictEqual(true));
    test('OWNER_KEY contains owner', () =>
      expect(Storage.get(OWNER_KEY)).toStrictEqual(owner));
    test('ownerAddress', () =>
      expect(ownerAddress([])).toStrictEqual(stringToBytes(owner)));
    test('isOwner', () =>
      expect(isOwner(ownerArg)).toStrictEqual(boolToByte(true)));

    throws('onlyOwner of random user throws', () => {
      changeCallStack(randomUser + ' , ' + contractAddr);
      onlyOwner();
    });
    test('onlyOwner should not throw', () => {
      changeCallStack(owner + ' , ' + contractAddr);
      onlyOwner();
    });
    test('set new owner', () =>
      setOwner(new Args().add('new owner').serialize()));
    throws('forbidden set new owner', () =>
      setOwner(new Args().add('another owner').serialize()),
    );
  });
});
