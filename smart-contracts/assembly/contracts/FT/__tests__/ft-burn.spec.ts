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
  increaseAllowance,
  transfer,
  allowance,
} from '../token';
import { burn, burnFrom } from '../burnable/burn';
import { ownerAddress } from '../../utils/ownership';
import { u256 } from 'as-bignum/assembly';

const user1Address = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

const user2Address = 'AU12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8';

const user3Address = 'AUDeadBeefDeadBeefDeadBeefDeadBeefDeadBeefDeadBOObs';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';
function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

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

const allowAmount = new u256(1, 1, 1, 1);
describe('burnFrom', () => {
  beforeAll(() => {
    switchUser(user3Address);

    // Increase allowance for U1 to spend U3 tokens
    increaseAllowance(
      new Args().add(user1Address).add(allowAmount).serialize(),
    );
    switchUser(user1Address);
  });

  throws('on insufficient allowance ', () => {
    burnFrom(
      new Args()
        .add(user3Address)
        // @ts-ignore
        .add(allowAmount + u256.One)
        .serialize(),
    );
  });

  throws('on insufficient balance', () =>
    burnFrom(new Args().add(user2Address).add(allowAmount).serialize()),
  );

  test('should burn tokens from an other address', () => {
    const u1balanceBefore = balanceOf(new Args().add(user1Address).serialize());
    const u3balanceBefore = balanceOf(new Args().add(user3Address).serialize());

    transfer(new Args().add(user3Address).add(allowAmount).serialize());

    burnFrom(new Args().add(user3Address).add(allowAmount).serialize());

    // Check balance changes
    expect(balanceOf(new Args().add(user1Address).serialize())).toStrictEqual(
      // @ts-ignore
      u256ToBytes(bytesToU256(u1balanceBefore) - allowAmount),
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
