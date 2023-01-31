import {
  Address,
  changeCallStack,
  resetStorage,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToU64,
  stringToBytes,
  u64ToBytes,
  u8toByte,
} from '@massalabs/as-types';
import {
  transfer,
  balanceOf,
  totalSupply,
  name,
  symbol,
  decimals,
  version,
  transferFrom,
  allowance,
  increaseAllowance,
  decreaseAllowance,
  constructor,
} from '../token';
import { _setBalance } from '../token-commons';

// Those addresses have been generated randomly, user1 & contractAddressERC20Basic match with addresses in vm-mock
const contractAddressERC20Basic = new Address(
  'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT',
);

const user1Address = new Address(
  'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq',
);

const user2Address = new Address(
  'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8',
);

const user3Address = new Address('A12NewAddress3');

resetStorage();

changeCallStack(
  user1Address.toString() + ' , ' + contractAddressERC20Basic.toString(),
);

const TOKEN_NAME = 'TOKEN_NAME';
const TOKEN_SYMBOL = 'TKN';
const DECIMALS: u8 = 8;
const TOTAL_SUPPLY: u64 = 800000000;

constructor(
  new Args()
    .add(TOKEN_NAME)
    .add(TOKEN_SYMBOL)
    .add(DECIMALS)
    .add(TOTAL_SUPPLY)
    .serialize(),
);

describe('Initialization', () => {
  test('total supply is properly initialized', () =>
    expect(totalSupply([])).toStrictEqual(u64ToBytes(TOTAL_SUPPLY)));

  test('token name is properly initialized', () =>
    expect(name([])).toStrictEqual(stringToBytes(TOKEN_NAME)));

  test('symbol is properly initialized', () =>
    expect(symbol([])).toStrictEqual(stringToBytes(TOKEN_SYMBOL)));

  test('decimals is properly initialized', () =>
    expect(decimals([])).toStrictEqual(u8toByte(DECIMALS)));

  test('version is properly initialized', () =>
    expect(version([])).toStrictEqual(stringToBytes('0.0.0')));
});

describe('BalanceOf', () => {
  test('Check an empty balance', () =>
    expect(
      balanceOf(
        new Args().add(contractAddressERC20Basic.toString()).serialize(),
      ),
    ).toStrictEqual(u64ToBytes(0)));

  test('Check a non empty balance', () =>
    expect(
      bytesToU64(
        balanceOf(new Args().add(user1Address.toString()).serialize()),
      ),
    ).toBe(TOTAL_SUPPLY));

  test('Check balance of invalid address', () => {
    const invalidAddress = new Address('A12AZDefef');
    expect(
      balanceOf(new Args().add(invalidAddress.toString()).serialize()),
    ).toStrictEqual(u64ToBytes(0));
  });
});

describe('Transfer nominal case', () => {
  const transferAmount: u64 = 1200;
  test('Transfer from U1 => U2', () => {
    transfer(
      new Args().add(user2Address.toString()).add(transferAmount).serialize(),
    );

    // Check user1 balance
    expect(
      balanceOf(new Args().add(user1Address.toString()).serialize()),
    ).toStrictEqual(u64ToBytes(TOTAL_SUPPLY - transferAmount));

    // Check user2 balance
    expect(
      balanceOf(new Args().add(user2Address.toString()).serialize()),
    ).toStrictEqual(u64ToBytes(transferAmount));
  });
});

describe('Transfer underflow', () => {
  const invalidAmount: u64 = TOTAL_SUPPLY + 1;
  throws('Underflow of balanceTo transfer from U1 => U2', () =>
    transfer(
      new Args().add(user2Address.toString()).add(invalidAmount).serialize(),
    ),
  );

  _setBalance(user2Address, U64.MAX_VALUE);

  throws('Overflow of balanceTo transfer from U1 => U2', () =>
    transfer(new Args().add(user2Address.toString()).add(u64(1)).serialize()),
  );
});

let u1u2AllowAmount: u64 = 1000;

describe('Allowance', () => {
  test('Increase user1 allowance for user2 to spend', () => {
    increaseAllowance(
      new Args().add(user2Address.toString()).add(u1u2AllowAmount).serialize(),
    );

    // check new allowance
    expect(
      allowance(
        new Args()
          .add(user1Address.toString())
          .add(user2Address.toString())
          .serialize(),
      ),
    ).toStrictEqual(u64ToBytes(u1u2AllowAmount));
  });

  throws('Fails increase allowance => overflow', () =>
    increaseAllowance(
      new Args().add(user2Address.toString()).add(u64.MAX_VALUE).serialize(),
    ),
  );

  test('check allowance is not changed', () =>
    expect(
      allowance(
        new Args()
          .add(user1Address.toString())
          .add(user2Address.toString())
          .serialize(),
      ),
    ).toStrictEqual(u64ToBytes(u1u2AllowAmount)));

  test('Decreases allowance U1 => U2', () => {
    const decreaseAmount: u64 = 666;
    u1u2AllowAmount -= decreaseAmount;
    decreaseAllowance(
      new Args().add(user2Address.toString()).add(decreaseAmount).serialize(),
    );

    // check new allowance
    expect(
      allowance(
        new Args()
          .add(user1Address.toString())
          .add(user2Address.toString())
          .serialize(),
      ),
    ).toStrictEqual(u64ToBytes(u1u2AllowAmount));
  });

  throws('Fail to decreases allowance: underflow', () =>
    increaseAllowance(
      new Args().add(user2Address.toString()).add(u64.MAX_VALUE).serialize(),
    ),
  );

  test('check allowance is not changed', () =>
    expect(
      allowance(
        new Args()
          .add(user1Address.toString())
          .add(user2Address.toString())
          .serialize(),
      ),
    ).toStrictEqual(u64ToBytes(u1u2AllowAmount)));
});

let u2u1AllowAmount: u64 = 6000;

describe('transferFrom', () => {
  // Actual user switched to U2
  changeCallStack(
    user2Address.toString() + ' , ' + contractAddressERC20Basic.toString(),
  );
  // Increase allowance to 1 for 2
  increaseAllowance(
    new Args().add(user1Address.toString()).add(u2u1AllowAmount).serialize(),
  );
  // Actual user switched to U3
  changeCallStack(
    user3Address.toString() + ' , ' + contractAddressERC20Basic.toString(),
  );
  // Increase allowance to 1 for 3
  increaseAllowance(
    new Args().add(user1Address.toString()).add(u64(3000)).serialize(),
  );

  // Actual user switched back to U1
  changeCallStack(
    user1Address.toString() + ' , ' + contractAddressERC20Basic.toString(),
  );

  throws('Fails because not enough allowance U2 => U1 6000 < 10000', () =>
    transferFrom(
      new Args()
        .add(user2Address.toString())
        .add(user1Address.toString())
        .add(u64(10000))
        .serialize(),
    ),
  );

  throws('Fails because not enough token on U3 => _transferFail', () =>
    transferFrom(
      new Args()
        .add(user3Address.toString())
        .add(user1Address.toString())
        .add(u64(2000))
        .serialize(),
    ),
  );

  test('Success transfer from U2 => U1', () => {
    const amount: u64 = 1000;
    u2u1AllowAmount -= amount;
    transferFrom(
      new Args()
        .add(user2Address.toString())
        .add(user1Address.toString())
        .add(amount)
        .serialize(),
    );

    // Check U1 balance
    expect(
      balanceOf(new Args().add(user1Address.toString()).serialize()),
    ).toStrictEqual(u64ToBytes(u64(799999800)));

    // Check U2 balance
    expect(
      balanceOf(new Args().add(user2Address.toString()).serialize()),
    ).toStrictEqual(u64ToBytes(U64.MAX_VALUE - 1000));

    // Verify allowances after transferFrom
    expect(
      allowance(
        new Args()
          .add(user2Address.toString())
          .add(user1Address.toString())
          .serialize(),
      ),
    ).toStrictEqual(u64ToBytes(u2u1AllowAmount));
  });
});
