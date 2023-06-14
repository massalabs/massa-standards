import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToString,
  stringToBytes,
  u64ToBytes,
  u8toByte,
} from '@massalabs/as-types';
import { mint } from '../token-mint';
import {
  balanceOf,
  constructor,
  decimals,
  name,
  symbol,
  totalSupply,
  version,
} from '../token';
import { ownerAddress } from '../../utils/ownership';

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
const TOTAL_SUPPLY: u64 = 10000;

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
    expect(bytesToString(ownerAddress([]))).toStrictEqual(user1Address);
  });
});

const mintAmount: u64 = 5000;

describe('Mint ERC20 to U2', () => {
  test('Should mint ERC20', () => {
    mint(new Args().add(user2Address).add(mintAmount).serialize());
    // check balance of U2
    expect(balanceOf(new Args().add(user2Address).serialize())).toStrictEqual(
      u64ToBytes(mintAmount),
    );

    // check totalSupply update
    expect(totalSupply([])).toStrictEqual(
      u64ToBytes(mintAmount + TOTAL_SUPPLY),
    );
  });
});

describe('Fails mint ERC20', () => {
  throws('Should overflow ERC20', () =>
    mint(new Args().add(user2Address).add(U64.MAX_VALUE).serialize()),
  );

  switchUser(user2Address);

  throws('Should fail because the owner is not the tx emitter', () =>
    mint(new Args().add(user1Address).add(u64(5000)).serialize()),
  );

  test("Should check totalSupply didn't change", () => {
    expect(totalSupply([])).toStrictEqual(
      u64ToBytes(mintAmount + TOTAL_SUPPLY),
    );
  });
});
