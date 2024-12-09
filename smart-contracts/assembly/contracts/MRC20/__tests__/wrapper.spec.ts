// These tests serve as an example of how to use the MRC20Wrapper class to interact with the MRC20 contract.
import { MRC20Wrapper } from '../wrapper';
import {
  Address,
  changeCallStack,
  mockBalance,
  mockScCall,
  mockTransferredCoins,
} from '@massalabs/massa-as-sdk';
import { stringToBytes } from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';

const tokenName = 'myToken';

const userAddr = 'AU1mhPhXCfh8afoNnbW91bXUVAmu8wU7u8v54yNTMvY7E52KBbz3';
const tokenAddress = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

const tokenContract = new MRC20Wrapper(new Address(tokenAddress));

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + tokenAddress);
}

describe('Wrapper tests', () => {
  beforeAll(() => {
    switchUser(userAddr);
  });

  test('token name', () => {
    const nameBytes = stringToBytes(tokenName);
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
  });
});
