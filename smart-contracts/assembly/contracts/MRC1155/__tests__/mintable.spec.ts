import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, u256ToBytes } from '@massalabs/as-types';
import { balanceOf, constructor } from '../MRC1155';
import { u256 } from 'as-bignum/assembly';
import { _balanceOfBatch } from '../MRC1155-internal';
import { MINTER_ROLE, mint, mintBatch } from '..';
import { grantRole } from '../../utils/accessControl';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

const user1Address = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

const user2Address = 'AU12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8';

const TOKEN_URI = 'ipfs://QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeEach(() => {
  switchUser(user1Address);
  resetStorage();
  setDeployContext(user1Address);
  constructor(new Args().add(stringToBytes(TOKEN_URI)).serialize());
});

describe('mint', () => {
  test('should mint tokens', () => {
    const id = u256.One;
    const value = u256.from(10);
    const data = stringToBytes('mint data');
    grantRole(new Args().add(MINTER_ROLE).add(user1Address).serialize());
    mint(
      new Args()
        .add(stringToBytes(user1Address))
        .add(id)
        .add(value)
        .add(data)
        .serialize(),
    );
    expect(
      balanceOf(
        new Args().add(stringToBytes(user1Address)).add(id).serialize(),
      ),
    ).toStrictEqual(u256ToBytes(value));
  });

  throws('Caller does not have minter role', () => {
    const id = u256.One;
    const value = u256.from(10);
    const data = stringToBytes('mint data');
    switchUser(user2Address);
    mint(
      new Args()
        .add(stringToBytes(user1Address))
        .add(id)
        .add(value)
        .add(data)
        .serialize(),
    );
  });
});

describe('mintBatch', () => {
  test('should mint tokens', () => {
    const owners = [user1Address, user1Address];
    const ids = [u256.One, u256.from(2)];
    const values = [u256.from(10), u256.from(20)];
    const data = stringToBytes('mint data');
    grantRole(new Args().add(MINTER_ROLE).add(user1Address).serialize());
    mintBatch(
      new Args().add(user1Address).add(ids).add(values).add(data).serialize(),
    );
    expect(_balanceOfBatch(owners, ids)).toStrictEqual(values);
  });

  throws('Caller does not have minter role', () => {
    const ids = [u256.One, u256.from(2)];
    const values = [u256.from(10), u256.from(20)];
    const data = stringToBytes('mint data');
    switchUser(user2Address);
    mintBatch(
      new Args().add(user1Address).add(ids).add(values).add(data).serialize(),
    );
  });

  throws('ERC1155InvalidArrayLength', () => {
    const ids = [u256.One];
    const values = [u256.from(10), u256.from(20)];
    const data = stringToBytes('mint data');
    grantRole(new Args().add(MINTER_ROLE).add(user1Address).serialize());
    mintBatch(
      new Args().add(user1Address).add(ids).add(values).add(data).serialize(),
    );
  });
});
