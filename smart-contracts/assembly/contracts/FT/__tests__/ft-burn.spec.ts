import {
  Address,
  changeCallStack,
  resetStorage,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToString,
  bytesToU64,
  stringToBytes,
  u64ToBytes,
  u8toByte,
} from '@massalabs/as-types';
import {
  balanceOf,
  totalSupply,
  name,
  symbol,
  decimals,
  version,
  constructor,
} from '../token';
import { burn } from '../token-burn';
import { ownerAddress } from '../../utils/ownership';

// Those addresses have been generated randomly, user1 & contractAddressERC20Burn match with addresses in as-tester
const contractAddressERC20Burn = new Address(
  'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT',
);
const user1Address = new Address(
  'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq',
);

resetStorage();
changeCallStack(
  user1Address.toString() + ' , ' + contractAddressERC20Burn.toString(),
);

const TOKEN_NAME = 'BURNABLE_TOKEN';
const TOKEN_SYMBOL = 'BTKN';
const DECIMALS: u8 = 2;
const TOTAL_SUPPLY: u64 = 10000000000;

describe('ERC20 BURN - Initialization', () => {
  constructor(
    new Args()
      .add(TOKEN_NAME)
      .add(TOKEN_SYMBOL)
      .add(DECIMALS)
      .add(TOTAL_SUPPLY)
      .serialize(),
  );

  test('total supply is properly initialized', () => {
    expect(totalSupply([])).toStrictEqual(u64ToBytes(TOTAL_SUPPLY));
  });

  test('token name is properly initialized', () => {
    expect(name([])).toStrictEqual(stringToBytes(TOKEN_NAME));
  });

  test('symbol is properly initialized', () => {
    expect(symbol([])).toStrictEqual(stringToBytes(TOKEN_SYMBOL));
  });

  test('decimals is properly initialized', () => {
    expect(decimals([])).toStrictEqual(u8toByte(DECIMALS));
  });

  test('version is properly initialized', () => {
    expect(version([])).toStrictEqual(stringToBytes('0.0.0'));
  });

  test('owner is properly initialized', () => {
    expect(bytesToString(ownerAddress([]))).toStrictEqual(
      user1Address.toString(),
    );
  });
});

describe('Burn ERC20 to U1', () => {
  const burnAmount: u64 = 5000;
  test('Should burn ERC20', () => {
    burn(new Args().add(burnAmount).serialize());

    // check balance of U1
    expect(
      bytesToU64(
        balanceOf(new Args().add(user1Address.toString()).serialize()),
      ),
    ).toBe(TOTAL_SUPPLY - burnAmount);

    // check totalSupply update
    expect(totalSupply([])).toStrictEqual(
      u64ToBytes(TOTAL_SUPPLY - burnAmount),
    );
  });
  test('Should burn all ERC20 of U1', () => {
    const balanceU1 = bytesToU64(balanceOf(new Args().add(user1Address.toString()).serialize()));
    burn(new Args().add(U64.MAX_VALUE).serialize());

    // check balance of U1
    expect(
      bytesToU64(
        balanceOf(new Args().add(user1Address.toString()).serialize()),
      ),
    ).toBe(0);

    // check totalSupply update
    expect(totalSupply([])).toStrictEqual(
      u64ToBytes(TOTAL_SUPPLY - balanceU1 - burnAmount),
    );
    });
});

