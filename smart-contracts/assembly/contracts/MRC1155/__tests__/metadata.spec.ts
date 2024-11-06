import { resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';
import { constructor } from '../token';
import { u256 } from 'as-bignum/assembly';
import {
  _baseURI,
  _setBaseURI,
  _setURI,
  _tokenURI,
  _uri,
  uri,
} from '../metadata';

const user1Address = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

const TOKEN_URI = 'ipfs://QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';

beforeEach(() => {
  resetStorage();
  setDeployContext(user1Address);
  constructor(new Args().add(stringToBytes(TOKEN_URI)).serialize());
});

describe('_setBaseURI', () => {
  test('should set base URI', () => {
    const newBaseUri = 'ipfs://QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';
    _setBaseURI(newBaseUri);
    expect(_baseURI()).toStrictEqual(newBaseUri);
  });
});

describe('_setURI', () => {
  test('should set URI', () => {
    const id = u256.One;
    const newUri = 'QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';
    _setURI(id, newUri);
    expect(_tokenURI(id)).toStrictEqual(newUri);
  });
});

describe('_uri', () => {
  test('should return token URI without base', () => {
    const id = u256.One;
    const newUri = 'QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';
    _setURI(id, newUri);
    expect(_uri(id)).toStrictEqual(newUri);
  });

  test('should return token URI with base', () => {
    const id = u256.One;
    const newUri = 'QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';
    _setURI(id, newUri);
    _setBaseURI('ipfs://');
    expect(_uri(id)).toStrictEqual('ipfs://' + newUri);
  });

  test('should return super URI', () => {
    const id = u256.One;
    expect(_uri(id)).toStrictEqual(TOKEN_URI);
  });
});

describe('uri', () => {
  test('should return token URI without base', () => {
    const id = u256.One;
    const newUri = 'QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';

    _setURI(id, newUri);
    expect(uri(new Args().add(id).serialize())).toStrictEqual(
      stringToBytes(newUri),
    );
  });

  test('should return token URI with base', () => {
    const id = u256.One;
    const newUri = 'QmW77ZQQ7Jm9q8WuLbH8YZg2K7T9Qnjbzm7jYVQQrJY5Yd';

    _setURI(id, newUri);
    _setBaseURI('ipfs://');
    expect(uri(new Args().add(id).serialize())).toStrictEqual(
      stringToBytes('ipfs://' + newUri),
    );
  });

  test('should return super URI', () => {
    const id = u256.One;
    expect(uri(new Args().add(id).serialize())).toStrictEqual(
      stringToBytes(TOKEN_URI),
    );
  });
});
