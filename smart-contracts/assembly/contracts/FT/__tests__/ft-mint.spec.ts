import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToString,
  stringToBytes,
  u8toByte,
  u256ToBytes,
} from '@massalabs/as-types';
import { ft1_mint } from '../mintable/mint';
import {
  ft1_balanceOf,
  constructor,
  ft1_decimals,
  ft1_name,
  ft1_symbol,
  ft1_totalSupply,
  ft1_version,
} from '../token';
import { ownerAddress } from '../../utils/ownership';
import { u256 } from 'as-bignum/assembly';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

const user1Address = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

const user2Address = 'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8';

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

const TOKEN_NAME = 'MINTABLE_TOKEN';
const TOKEN_SYMBOL = 'MTKN';
const DECIMALS: u8 = 2;
const TOTAL_SUPPLY = new u256(10000, 1000, 100, 10);

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

describe('ERC20 MINT - Initialization', () => {
  test('total supply is properly initialized', () => {
    expect(ft1_totalSupply([])).toStrictEqual(u256ToBytes(TOTAL_SUPPLY));
  });

  test('token name is properly initialized', () => {
    expect(ft1_name([])).toStrictEqual(stringToBytes(TOKEN_NAME));
  });

  test('symbol is properly initialized', () => {
    expect(ft1_symbol([])).toStrictEqual(stringToBytes(TOKEN_SYMBOL));
  });

  test('decimals is properly initialized', () => {
    expect(ft1_decimals([])).toStrictEqual(u8toByte(DECIMALS));
  });

  test('version is properly initialized', () => {
    expect(ft1_version([])).toStrictEqual(stringToBytes('0.0.0'));
  });

  test('owner is properly initialized', () => {
    expect(bytesToString(ownerAddress([]))).toStrictEqual(user1Address);
  });
});

const mintAmount = new u256(5000, 33);

describe('Mint ERC20 to U2', () => {
  test('Should mint ERC20', () => {
    ft1_mint(new Args().add(user2Address).add(mintAmount).serialize());
    // check balance of U2
    expect(
      ft1_balanceOf(new Args().add(user2Address).serialize()),
    ).toStrictEqual(u256ToBytes(mintAmount));

    // check totalSupply update
    expect(ft1_totalSupply([])).toStrictEqual(
      // @ts-ignore
      u256ToBytes(mintAmount + TOTAL_SUPPLY),
    );
  });
});

describe('Fails mint ERC20', () => {
  throws('Should overflow ERC20', () =>
    ft1_mint(new Args().add(user2Address).add(U64.MAX_VALUE).serialize()),
  );

  switchUser(user2Address);

  throws('Should fail because the owner is not the tx emitter', () =>
    ft1_mint(new Args().add(user1Address).add(u64(5000)).serialize()),
  );

  test("Should check totalSupply didn't change", () => {
    expect(ft1_totalSupply([])).toStrictEqual(
      // @ts-ignore
      u256ToBytes(mintAmount + TOTAL_SUPPLY),
    );
  });
});
