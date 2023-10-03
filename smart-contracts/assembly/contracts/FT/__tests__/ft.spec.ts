import {
  Address,
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  stringToBytes,
  u8toByte,
  bytesToU256,
  u256ToBytes,
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
  VERSION,
} from '../token';
import { u256 } from 'as-bignum/assembly';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

const user1Address = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

const user2Address = 'AU12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8';

const user3Address = 'AUDeadBeefDeadBeefDeadBeefDeadBeefDeadBeefDeadBOObs';

const TOKEN_NAME = 'TOKEN_NAME';
const TOKEN_SYMBOL = 'TKN';
const DECIMALS: u8 = 8;
const TOTAL_SUPPLY = new u256(100, 100, 100, 100);

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
  resetStorage();
  setDeployContext(user1Address);
  constructor(
    new Args()
      .add(TOKEN_NAME)
      .add(TOKEN_SYMBOL)
      .add(DECIMALS)
      .add(TOTAL_SUPPLY)
      .serialize(),
  );
});

describe('Initialization', () => {
  test('total supply is properly initialized', () =>
    expect(totalSupply([])).toStrictEqual(u256ToBytes(TOTAL_SUPPLY)));

  test('token name is properly initialized', () =>
    expect(name([])).toStrictEqual(stringToBytes(TOKEN_NAME)));

  test('symbol is properly initialized', () =>
    expect(symbol([])).toStrictEqual(stringToBytes(TOKEN_SYMBOL)));

  test('decimals is properly initialized', () =>
    expect(decimals([])).toStrictEqual(u8toByte(DECIMALS)));

  test('version is properly initialized', () =>
    expect(version([])).toStrictEqual(VERSION));
});

describe('BalanceOf', () => {
  test('Check an empty balance', () =>
    expect(balanceOf(new Args().add(contractAddr).serialize())).toStrictEqual(
      u256ToBytes(u256.Zero),
    ));

  test('Check a non empty balance', () =>
    expect(
      bytesToU256(balanceOf(new Args().add(user1Address).serialize())),
    ).toBe(TOTAL_SUPPLY));

  test('Check balance of invalid address', () => {
    const invalidAddress = new Address('A12AZDefef');
    expect(
      balanceOf(new Args().add(invalidAddress.toString()).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));
  });
});

describe('Transfer', () => {
  test('Transfer from U1 => U2', () => {
    const transferAmount = new u256(10, 10);

    transfer(new Args().add(user2Address).add(transferAmount).serialize());

    // Check user1 balance
    expect(
      balanceOf(new Args().add(user1Address).serialize()),
      // @ts-ignore
    ).toStrictEqual(u256ToBytes(TOTAL_SUPPLY - transferAmount));

    // Check user2 balance
    expect(balanceOf(new Args().add(user2Address).serialize())).toStrictEqual(
      u256ToBytes(transferAmount),
    );
  });

  throws('Insuficient balance to transfer from U1 => U2', () => {
    // @ts-ignore
    const invalidAmount = TOTAL_SUPPLY + u256.One;
    transfer(new Args().add(user2Address).add(invalidAmount).serialize());
  });

  throws('Overflow', () =>
    transfer(new Args().add(user2Address).add(u256.Max).serialize()),
  );
});

let u1u2AllowAmount = new u256(20, 20);

describe('Allowance', () => {
  test('Increase user1 allowance for user2 to spend', () => {
    increaseAllowance(
      new Args().add(user2Address).add(u1u2AllowAmount).serialize(),
    );

    // check new allowance
    expect(
      allowance(new Args().add(user1Address).add(user2Address).serialize()),
    ).toStrictEqual(u256ToBytes(u1u2AllowAmount));
  });

  test('Increase user1 allowance to max amount for user2 to spend', () => {
    increaseAllowance(new Args().add(user2Address).add(u256.Max).serialize());

    // check new allowance
    expect(
      allowance(new Args().add(user1Address).add(user2Address).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Max));
  });

  test('Decreases allowance U1 => U2', () => {
    const decreaseAmount = u256.fromU64(666);
    decreaseAllowance(
      new Args().add(user2Address).add(decreaseAmount).serialize(),
    );

    // check new allowance
    expect(
      allowance(new Args().add(user1Address).add(user2Address).serialize()),
      // @ts-ignore
    ).toStrictEqual(u256ToBytes(u256.Max - decreaseAmount));
  });

  test('Decrease user1 allowance to 0 for user2', () =>
    decreaseAllowance(new Args().add(user2Address).add(u256.Max).serialize()));

  test('check allowance is set to 0', () =>
    expect(
      allowance(new Args().add(user1Address).add(user2Address).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero)));
});

const allowAmount = new u256(6000);

describe('transferFrom', () => {
  beforeAll(() => {
    switchUser(user3Address);

    // Increase allowance for U1 to spend U3 tokens
    increaseAllowance(
      new Args().add(user1Address).add(allowAmount).serialize(),
    );

    switchUser(user1Address);
  });

  throws('Fails because not enough allowance U3 => U1 ', () => {
    transferFrom(
      new Args()
        .add(user3Address)
        .add(user2Address)
        // @ts-ignore
        .add(allowAmount + u256.One)
        .serialize(),
    );
  });

  throws('Fails because not enough token on U3', () =>
    transferFrom(
      new Args()
        .add(user3Address)
        .add(user2Address)
        .add(allowAmount)
        .serialize(),
    ),
  );

  test('u1  send tokens to u3 then transfer tokens from u3 to u2 ', () => {
    const u1balanceBefore = balanceOf(new Args().add(user1Address).serialize());
    const u2balanceBefore = balanceOf(new Args().add(user2Address).serialize());
    const u3balanceBefore = balanceOf(new Args().add(user3Address).serialize());

    transfer(new Args().add(user3Address).add(allowAmount).serialize());

    transferFrom(
      new Args()
        .add(user3Address)
        .add(user2Address)
        .add(allowAmount)
        .serialize(),
    );

    // Check balance changes
    expect(balanceOf(new Args().add(user1Address).serialize())).toStrictEqual(
      // @ts-ignore
      u256ToBytes(bytesToU256(u1balanceBefore) - allowAmount),
    );

    expect(balanceOf(new Args().add(user2Address).serialize())).toStrictEqual(
      // @ts-ignore

      u256ToBytes(bytesToU256(u2balanceBefore) + allowAmount),
    );
    expect(balanceOf(new Args().add(user3Address).serialize())).toStrictEqual(
      u3balanceBefore,
    );

    // Verify allowances after transferFrom
    expect(
      allowance(new Args().add(user1Address).add(user3Address).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));
  });
});
