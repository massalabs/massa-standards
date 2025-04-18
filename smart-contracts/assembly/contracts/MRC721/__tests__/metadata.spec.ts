import { resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';
import { mrc721Constructor } from '../MRC721';
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

beforeEach(() => {
  resetStorage();
  setDeployContext(user1Address);
  mrc721Constructor('MassaNft', 'MNFT');
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
});
