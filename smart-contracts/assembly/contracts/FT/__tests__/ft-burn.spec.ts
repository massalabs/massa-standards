import { resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToString,
  stringToBytes,
  u8toByte,
  bytesToU256,
  u256ToBytes,
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
import { u256 } from 'as-bignum/assembly';

const user1Address = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

beforeAll(() => {
  resetStorage();
  setDeployContext(user1Address);
});

const TOKEN_NAME = 'BURNABLE_TOKEN';
const TOKEN_SYMBOL = 'BTKN';
const DECIMALS: u8 = 2;
const TOTAL_SUPPLY = new u256(10000, 0, 0, 100);

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
    expect(totalSupply([])).toStrictEqual(u256ToBytes(TOTAL_SUPPLY));
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
    expect(bytesToString(ownerAddress([]))).toStrictEqual(user1Address);
  });
});

const burnAmount = new u256(5000, 0, 1);

describe('Burn ERC20 to U1', () => {
  test('Should burn ERC20', () => {
    burn(new Args().add(burnAmount).serialize());

    // check balance of U1
    expect(
      bytesToU256(balanceOf(new Args().add(user1Address).serialize())),
      // @ts-ignore
    ).toBe(TOTAL_SUPPLY - burnAmount);

    // check totalSupply update
    expect(totalSupply([])).toStrictEqual(
      // @ts-ignore
      u256ToBytes(TOTAL_SUPPLY - burnAmount),
    );
  });
});

describe('Fails burn ERC20', () => {
  throws('Fails to burn because of underflow ', () =>
    burn(new Args().add(u256.Max).serialize()),
  );
});
