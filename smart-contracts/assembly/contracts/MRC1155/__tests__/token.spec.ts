import {
  Address,
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  stringToBytes,
  bytesToU256,
  u256ToBytes,
  fixedSizeArrayToBytes,
  boolToByte,
} from '@massalabs/as-types';
import {
  balanceOf,
  balanceOfBatch,
  constructor,
  isApprovedForAll,
  safeBatchTransferFrom,
  safeTransferFrom,
  setApprovalForAll,
  uri,
} from '../token';
import { u256 } from 'as-bignum/assembly';
import {
  _burn,
  _burnBatch,
  _mint,
  _mintBatch,
  _setURI,
} from '../token-internal';

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

describe('Initialization', () => {
  test('uri is properly initialized', () =>
    expect(uri(new Args().add([u256.Zero]).serialize())).toStrictEqual(
      stringToBytes(TOKEN_URI),
    ));
});

describe('BalanceOf', () => {
  test('Check an empty balance', () =>
    expect(
      balanceOf(new Args().add(contractAddr).add(u256.Zero).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero)));

  test('Check a non empty balance', () => {
    _mint(user1Address, u256.Zero, u256.fromU64(10), []);

    expect(
      bytesToU256(
        balanceOf(new Args().add(user1Address).add(u256.Zero).serialize()),
      ),
    ).toBe(u256.fromU64(10));
  });

  test('Check balance of invalid address', () => {
    const invalidAddress = new Address('A12AZDefef');
    expect(
      balanceOf(
        new Args().add(invalidAddress.toString()).add(u256.Zero).serialize(),
      ),
    ).toStrictEqual(u256ToBytes(u256.Zero));
  });
});

describe('balanceOfBatch', () => {
  test('Check an empty balances', () => {
    expect(
      balanceOfBatch(
        new Args()
          .add([contractAddr, contractAddr])
          .add(fixedSizeArrayToBytes<u256>([u256.Zero, u256.One]))
          .serialize(),
      ),
    ).toStrictEqual(fixedSizeArrayToBytes<u256>([u256.Zero, u256.Zero]));
  });

  test('Check a non empty balances', () => {
    _mint(user1Address, u256.Zero, u256.fromU64(10), []);
    _mint(user1Address, u256.One, u256.fromU64(20), []);

    expect(
      balanceOfBatch(
        new Args()
          .add([user1Address, user1Address])
          .add(fixedSizeArrayToBytes<u256>([u256.Zero, u256.One]))
          .serialize(),
      ),
    ).toStrictEqual(
      fixedSizeArrayToBytes<u256>([u256.fromU64(10), u256.fromU64(20)]),
    );
  });

  test('Check balances of invalid address', () => {
    const invalidAddress = new Address('A12AZDefef');
    expect(
      balanceOfBatch(
        new Args()
          .add([invalidAddress.toString(), invalidAddress.toString()])
          .add(fixedSizeArrayToBytes<u256>([u256.Zero, u256.One]))
          .serialize(),
      ),
    ).toStrictEqual(fixedSizeArrayToBytes<u256>([u256.Zero, u256.Zero]));
  });

  throws('ERC1155InvalidArrayLengths', () => {
    balanceOfBatch(
      new Args().add([contractAddr, contractAddr]).add([u256.Zero]).serialize(),
    );
  });
});

describe('setApprovalForAll', () => {
  test('Check setApprovalForAll', () => {
    const operator = user2Address;
    const approved = true;

    setApprovalForAll(new Args().add(user2Address).add(approved).serialize());

    expect(
      isApprovedForAll(new Args().add(user1Address).add(operator).serialize()),
    ).toStrictEqual(boolToByte(approved));
  });

  test('Check setApprovalForAll two calls', () => {
    const operator = user2Address;
    const approved = true;

    setApprovalForAll(new Args().add(user2Address).add(approved).serialize());

    setApprovalForAll(new Args().add(user2Address).add(!approved).serialize());

    expect(
      isApprovedForAll(new Args().add(user1Address).add(operator).serialize()),
    ).toStrictEqual(boolToByte(!approved));
  });

  throws('Invalid operator', () => {
    const approved = true;

    setApprovalForAll(new Args().add('').add(approved).serialize());
  });
});

describe('safeTransferFrom', () => {
  test('Transfer from U1 => U2', () => {
    const transferAmount = u256.from(100);
    const transferId = u256.Zero;

    _mint(user1Address, transferId, transferAmount, []);

    safeTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add(transferId)
        .add(transferAmount)
        .add([] as StaticArray<u8>)
        .serialize(),
    );

    // Check user1 balance
    expect(
      balanceOf(new Args().add(user1Address).add(transferId).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));

    // Check user2 balance
    expect(
      balanceOf(new Args().add(user2Address).add(transferId).serialize()),
    ).toStrictEqual(u256ToBytes(transferAmount));
  });

  test('Transfer from U1 => U2 with approval', () => {
    const transferAmount = u256.from(100);
    const transferId = u256.Zero;

    _mint(user1Address, transferId, transferAmount, []);

    switchUser(user1Address);
    setApprovalForAll(new Args().add(user2Address).add(true).serialize());

    switchUser(user2Address);
    safeTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add(transferId)
        .add(transferAmount)
        .add([] as StaticArray<u8>)
        .serialize(),
    );

    // Check user1 balance
    expect(
      balanceOf(new Args().add(user1Address).add(transferId).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));

    // Check user2 balance
    expect(
      balanceOf(new Args().add(user2Address).add(transferId).serialize()),
    ).toStrictEqual(u256ToBytes(transferAmount));
  });

  throws('ERC1155InsufficientBalance', () => {
    const invalidAmount = u256.One;
    safeTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add(u256.Zero)
        .add(invalidAmount)
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155MissingApprovalForAll', () => {
    const transferAmount = u256.from(100);
    const transferId = u256.Zero;

    _mint(user1Address, transferId, transferAmount, []);

    switchUser(user2Address);
    safeTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add(transferId)
        .add(transferAmount)
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155InvalidReceiver', () => {
    _mint(user1Address, u256.Zero, u256.from(100), []);
    safeTransferFrom(
      new Args()
        .add(user1Address)
        .add('')
        .add(u256.Zero)
        .add(u256.from(100))
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155InvalidSender', () => {
    _mint(user1Address, u256.Zero, u256.from(100), []);
    safeTransferFrom(
      new Args()
        .add('')
        .add(user2Address)
        .add(u256.Zero)
        .add(u256.from(100))
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155BalanceOverflow', () => {
    _mint(user1Address, u256.Zero, u256.Max, []);
    _mint(user2Address, u256.Zero, u256.Max, []);

    safeTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add(u256.Zero)
        .add(u256.Max)
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });
});

describe('safeBatchTransferFrom', () => {
  test('Transfers from U1 => U2', () => {
    const transferAmount1 = u256.from(100);
    const transferAmount2 = u256.from(200);
    const transferId1 = u256.Zero;
    const transferId2 = u256.One;

    _mint(user1Address, transferId1, transferAmount1, []);
    _mint(user1Address, transferId2, transferAmount2, []);

    safeBatchTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add([transferId1, transferId2])
        .add([transferAmount1, transferAmount2])
        .add([] as StaticArray<u8>)
        .serialize(),
    );

    // Check user1 balance
    expect(
      balanceOf(new Args().add(user1Address).add(transferId1).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));

    expect(
      balanceOf(new Args().add(user1Address).add(transferId2).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));

    // Check user2 balance
    expect(
      balanceOf(new Args().add(user2Address).add(transferId1).serialize()),
    ).toStrictEqual(u256ToBytes(transferAmount1));

    expect(
      balanceOf(new Args().add(user2Address).add(transferId2).serialize()),
    ).toStrictEqual(u256ToBytes(transferAmount2));
  });

  test('Transfers from U1 => U2 with approval', () => {
    const transferAmount1 = u256.from(100);
    const transferAmount2 = u256.from(200);
    const transferId1 = u256.Zero;
    const transferId2 = u256.One;

    _mint(user1Address, transferId1, transferAmount1, []);
    _mint(user1Address, transferId2, transferAmount2, []);

    setApprovalForAll(new Args().add(user2Address).add(true).serialize());

    switchUser(user2Address);
    safeBatchTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add([transferId1, transferId2])
        .add([transferAmount1, transferAmount2])
        .add([] as StaticArray<u8>)
        .serialize(),
    );

    // Check user1 balance
    expect(
      balanceOf(new Args().add(user1Address).add(transferId1).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));

    expect(
      balanceOf(new Args().add(user1Address).add(transferId2).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));

    // Check user2 balance
    expect(
      balanceOf(new Args().add(user2Address).add(transferId1).serialize()),
    ).toStrictEqual(u256ToBytes(transferAmount1));

    expect(
      balanceOf(new Args().add(user2Address).add(transferId2).serialize()),
    ).toStrictEqual(u256ToBytes(transferAmount2));
  });

  throws('ERC1155InsufficientBalance', () => {
    const invalidAmount = u256.One;
    safeBatchTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add([u256.Zero, u256.Zero])
        .add([invalidAmount, invalidAmount])
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155MissingApprovalForAll', () => {
    const transferAmount1 = u256.from(100);
    const transferAmount2 = u256.from(200);
    const transferId1 = u256.Zero;
    const transferId2 = u256.One;

    _mint(user1Address, transferId1, transferAmount1, []);
    _mint(user1Address, transferId2, transferAmount2, []);

    switchUser(user2Address);
    safeBatchTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add([transferId1, transferId2])
        .add([transferAmount1, transferAmount2])
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155InvalidReceiver', () => {
    _mint(user1Address, u256.Zero, u256.from(100), []);
    safeBatchTransferFrom(
      new Args()
        .add(user1Address)
        .add('')
        .add([u256.Zero])
        .add([u256.from(100)])
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155InvalidSender', () => {
    _mint(user1Address, u256.Zero, u256.from(100), []);
    safeBatchTransferFrom(
      new Args()
        .add('')
        .add(user2Address)
        .add([u256.Zero])
        .add([u256.from(100)])
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155BalanceOverflow', () => {
    _mint(user1Address, u256.Zero, u256.Max, []);
    _mint(user2Address, u256.Zero, u256.Max, []);

    safeBatchTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add([u256.Zero])
        .add([u256.Max])
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });

  throws('ERC1155InvalidArrayLengths', () => {
    safeBatchTransferFrom(
      new Args()
        .add(user1Address)
        .add(user2Address)
        .add([u256.Zero])
        .add([u256.Zero, u256.One])
        .add([] as StaticArray<u8>)
        .serialize(),
    );
  });
});

describe('_setURI', () => {
  test('Set URI', () => {
    const newUri = 'ipfs://QmW77ZQQ7Jm9q8WuLbH8YZg2K7YVQQrJY5Yd';

    _setURI(newUri);

    expect(uri(new Args().add(u256.Zero).serialize())).toStrictEqual(
      stringToBytes(newUri),
    );
  });
});

describe('_mint', () => {
  test('Mint', () => {
    const mintAmount = u256.from(100);
    const mintId = u256.Zero;

    _mint(user1Address, mintId, mintAmount, []);

    expect(
      balanceOf(new Args().add(user1Address).add(mintId).serialize()),
    ).toStrictEqual(u256ToBytes(mintAmount));
  });
});

describe('_mintBatch', () => {
  test('MintBatch', () => {
    const mintAmount1 = u256.from(100);
    const mintAmount2 = u256.from(200);
    const mintId1 = u256.Zero;
    const mintId2 = u256.One;

    _mintBatch(
      user1Address,
      [mintId1, mintId2],
      [mintAmount1, mintAmount2],
      [],
    );

    expect(
      balanceOf(new Args().add(user1Address).add(mintId1).serialize()),
    ).toStrictEqual(u256ToBytes(mintAmount1));

    expect(
      balanceOf(new Args().add(user1Address).add(mintId2).serialize()),
    ).toStrictEqual(u256ToBytes(mintAmount2));
  });

  throws('ERC1155InvalidArrayLengths', () => {
    _mintBatch(user1Address, [u256.Zero], [u256.Zero, u256.One], []);
  });
});

describe('_burn', () => {
  test('Burn', () => {
    const burnAmount = u256.from(100);
    const burnId = u256.Zero;

    _mint(user1Address, burnId, burnAmount, []);

    _burn(user1Address, burnId, burnAmount);

    expect(
      balanceOf(new Args().add(user1Address).add(burnId).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));
  });
});

describe('_burnBatch', () => {
  test('BurnBatch', () => {
    const burnAmount1 = u256.from(100);
    const burnAmount2 = u256.from(200);
    const burnId1 = u256.Zero;
    const burnId2 = u256.One;

    _mint(user1Address, burnId1, burnAmount1, []);
    _mint(user1Address, burnId2, burnAmount2, []);

    _burnBatch(user1Address, [burnId1, burnId2], [burnAmount1, burnAmount2]);

    expect(
      balanceOf(new Args().add(user1Address).add(burnId1).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));

    expect(
      balanceOf(new Args().add(user1Address).add(burnId2).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));
  });

  throws('ERC1155InvalidArrayLengths', () => {
    _burnBatch(user1Address, [u256.Zero], [u256.Zero, u256.One]);
  });
});
