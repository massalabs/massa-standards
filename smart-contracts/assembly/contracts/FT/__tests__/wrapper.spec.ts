import { TokenWrapper } from '../wrapper';
import { Address, mockScCall } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';

const tokenName = 'myToken';

/* eslint-disable-next-line require-jsdoc */
function initToken(): TokenWrapper {
  const tokenAddr = new Address(
    'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT',
  );

  mockScCall(stringToBytes(tokenName));
  const decimalsArgs = new Args().add<u8>(123).serialize();
  mockScCall(decimalsArgs);
  return new TokenWrapper(tokenAddr);
}

describe('Wrapper tests', () => {
  test('token name', () => {
    const token = initToken();
    expect(token.name()).toBe(tokenName);
  });

  test('version', () => {
    const token = initToken();
    const version = '1.2.3';
    const versionBytes = stringToBytes(version);
    mockScCall(versionBytes);

    expect(token.version()).toBe(version);
  });
});
