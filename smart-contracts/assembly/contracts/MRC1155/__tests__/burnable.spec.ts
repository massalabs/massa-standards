import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  stringToBytes,
  u256ToBytes,
  fixedSizeArrayToBytes,
  boolToByte,
} from '@massalabs/as-types';
import {
  balanceOf,
  balanceOfBatch,
  constructor,
  setApprovalForAll,
} from '../MRC1155';
import { u256 } from 'as-bignum/assembly';
import { _mint, _mintBatch } from '../MRC1155-internal';
import { burn, burnBatch } from '..';

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

describe('burn', () => {
  test('should burn tokens', () => {
    const id = u256.One;
    const value = u256.from(10);
    const data = stringToBytes('burn data');
    _mint(user1Address, id, value, data);

    expect(
      balanceOf(
        new Args().add(stringToBytes(user1Address)).add(id).serialize(),
      ),
    ).toStrictEqual(u256ToBytes(value));

    burn(
      new Args()
        .add(stringToBytes(user1Address))
        .add(id)
        .add(value)
        .serialize(),
    );
    expect(
      balanceOf(
        new Args().add(stringToBytes(user1Address)).add(id).serialize(),
      ),
    ).toStrictEqual(u256ToBytes(u256.Zero));
  });

  test('should burn tokens with approval', () => {
    const id = u256.One;
    const value = u256.from(10);
    const data = stringToBytes('burn data');
    _mint(user1Address, id, value, data);
    expect(
      balanceOf(
        new Args().add(stringToBytes(user1Address)).add(id).serialize(),
      ),
    ).toStrictEqual(u256ToBytes(value));

    setApprovalForAll(
      new Args()
        .add(stringToBytes(user2Address))
        .add(boolToByte(true))
        .serialize(),
    );

    switchUser(user2Address);
    burn(
      new Args()
        .add(stringToBytes(user1Address))
        .add(id)
        .add(value)
        .serialize(),
    );
    expect(
      balanceOf(
        new Args().add(stringToBytes(user1Address)).add(id).serialize(),
      ),
    ).toStrictEqual(u256ToBytes(u256.Zero));
  });

  throws('ERC1155MissingApprovalForAll', () => {
    const id = u256.One;
    const value = u256.from(10);
    const data = stringToBytes('burn data');
    _mint(user1Address, id, value, data);
    expect(
      balanceOf(
        new Args().add(stringToBytes(user1Address)).add(id).serialize(),
      ),
    ).toStrictEqual(u256ToBytes(value));

    switchUser(user2Address);
    burn(
      new Args()
        .add(stringToBytes(user1Address))
        .add(id)
        .add(value)
        .serialize(),
    );
  });
});

describe('burnBatch', () => {
  test('should burn batch of tokens', () => {
    const ids = [u256.One, u256.from(2), u256.from(3)];
    const values = [u256.from(10), u256.from(20), u256.from(30)];
    const data = stringToBytes('burn data');
    _mintBatch(user1Address, ids, values, data);
    expect(
      balanceOfBatch(
        new Args()
          .add([user1Address, user1Address, user1Address])
          .add(ids)
          .serialize(),
      ),
    ).toStrictEqual(fixedSizeArrayToBytes<u256>(values));

    burnBatch(new Args().add(user1Address).add(ids).add(values).serialize());
    expect(
      balanceOfBatch(
        new Args()
          .add([user1Address, user1Address, user1Address])
          .add(ids)
          .serialize(),
      ),
    ).toStrictEqual(
      fixedSizeArrayToBytes<u256>([u256.Zero, u256.Zero, u256.Zero]),
    );
  });

  test('should burn batch of tokens with approval', () => {
    const ids = [u256.One, u256.from(2), u256.from(3)];
    const values = [u256.from(10), u256.from(20), u256.from(30)];
    const data = stringToBytes('burn data');
    _mintBatch(user1Address, ids, values, data);
    expect(
      balanceOfBatch(
        new Args()
          .add([user1Address, user1Address, user1Address])
          .add(ids)
          .serialize(),
      ),
    ).toStrictEqual(fixedSizeArrayToBytes<u256>(values));

    setApprovalForAll(
      new Args()
        .add(stringToBytes(user2Address))
        .add(boolToByte(true))
        .serialize(),
    );

    switchUser(user2Address);
    burnBatch(new Args().add(user1Address).add(ids).add(values).serialize());
    expect(
      balanceOfBatch(
        new Args()
          .add([user1Address, user1Address, user1Address])
          .add(ids)
          .serialize(),
      ),
    ).toStrictEqual(
      fixedSizeArrayToBytes<u256>([u256.Zero, u256.Zero, u256.Zero]),
    );
  });

  throws('ERC1155MissingApprovalForAll', () => {
    const ids = [u256.One, u256.from(2), u256.from(3)];
    const values = [u256.from(10), u256.from(20), u256.from(30)];
    const data = stringToBytes('burn data');
    _mintBatch(user1Address, ids, values, data);
    expect(
      balanceOfBatch(
        new Args()
          .add([user1Address, user1Address, user1Address])
          .add(ids)
          .serialize(),
      ),
    ).toStrictEqual(fixedSizeArrayToBytes<u256>(values));

    switchUser(user2Address);
    burnBatch(new Args().add(user1Address).add(ids).add(values).serialize());
  });
});
