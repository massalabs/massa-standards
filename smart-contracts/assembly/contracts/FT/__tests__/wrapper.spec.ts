import { TokenWrapper } from '../wrapper';
import {
  Address,
  balance,
  balanceOf,
  changeCallStack,
  mockBalance,
  mockScCall,
  mockTransferredCoins,
} from '@massalabs/massa-as-sdk';
import { stringToBytes } from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';

const tokenName = 'myToken';

const userAddr = 'AU1mhPhXCfh8afoNnbW91bXUVAmu8wU7u8v54yNTMvY7E52KBbz3';
const tokenAddress = 'AU12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

const tokenContract = new TokenWrapper(new Address(tokenAddress));

describe('Wrapper tests', () => {
  beforeAll(() => {
    changeCallStack(userAddr + ' , ' + tokenAddress);
  });

  test('token name', () => {
    const name = tokenName;
    const nameBytes = stringToBytes(name);
    mockScCall(nameBytes);

    expect(tokenContract.name()).toBe(tokenName);
  });

  test('version', () => {
    const version = '1.2.3';
    const versionBytes = stringToBytes(version);
    mockScCall(versionBytes);

    expect(tokenContract.version()).toBe(version);
  });

  test('transfer', () => {
    const recipient = new Address(
      'AU1bfnCAQAhPT2gAcJkL31fCWJixFFtH7RjRHZsvaThVoeNUckep',
    );
    const amount = u256.fromU64(100);
    mockScCall([]);

    tokenContract.transfer(recipient, amount);

    expect(balance()).toBe(0);
    expect(balanceOf(tokenAddress)).toBe(0);
  });

  test('transfer with coins', () => {
    const coins = 1_000_000;
    const recipient = new Address(
      'AU1bfnCAQAhPT2gAcJkL31fCWJixFFtH7RjRHZsvaThVoeNUckep',
    );
    const amount = u256.fromU64(100);
    mockBalance(userAddr, coins);
    mockTransferredCoins(coins);
    mockScCall([]);

    tokenContract.transfer(recipient, amount, coins);
    expect(balance()).toBe(0);
    expect(balanceOf(tokenAddress)).toBe(0);
  });
});
