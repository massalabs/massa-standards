import { contractOwnerKey } from './../dns';
import {
  setResolver,
  resolver,
  addWebsiteToBlackList,
  constructor,
  setOwner,
} from '../dns';
import { Address, Storage } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { changeCallStack } from '@massalabs/massa-as-sdk/assembly/vm-mock/storage';

const websiteStorerAddress = new Address(
  'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq',
);

const ownerAddress = new Address(
  'A12kv833hMvZ7zCzrMpdrLMW9aGPwS9WUmq61jJYEoCjMdSLqut2',
);

const dnsAdmin = new Address(
  'A1qDAxGJ387ETi9JRQzZWSPKYq4YPXrFvdiE4VoXUaiAt38JFEC',
);

const contractAddr = 'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

const websiteName = new Args().add('flappy').serialize();
const blackListKey = new Args().add('blackList').serialize();

describe('DNS contract tests', () => {
  test('constructor', () => {
    const serializedOwnerAddress = new Args()
      .add(ownerAddress.toString())
      .serialize();
    constructor(serializedOwnerAddress);
    expect(Storage.get(contractOwnerKey)).toStrictEqual(serializedOwnerAddress);
  });

  test('set owner', () => {
    const serializedDnsAdmin = new Args().add(dnsAdmin.toString()).serialize();
    changeCallStack(ownerAddress.toString() + ' , ' + contractAddr);
    setOwner(serializedDnsAdmin);
    expect(Storage.get(contractOwnerKey)).toStrictEqual(serializedDnsAdmin);
    changeCallStack(dnsAdmin.toString() + ' , ' + contractAddr);
  });

  test('invalid dns entry', () => {
    expect(() => {
      const setResolverArgs = new Args()
        .add('invalid dns entry')
        .add(ownerAddress.toString())
        .serialize();
      setResolver(setResolverArgs);
    }).toThrow();
  });

  test('create dns entry', () => {
    changeCallStack(ownerAddress.toString() + ' , ' + contractAddr);

    const name = 'test';
    const desc = 'website description';

    const setResolverArgs = new Args()
      .add(name)
      .add(websiteStorerAddress.toString())
      .add(desc)
      .serialize();

    setResolver(setResolverArgs);

    const stored = new Args(resolver(new Args().add(name).serialize()));

    expect(stored.nextString().unwrap()).toBe(websiteStorerAddress.toString());
    expect(stored.nextString().unwrap()).toBe(ownerAddress.toString());
    expect(stored.nextString().unwrap()).toBe(desc);
  });

  test('add dns entry with empty description', () => {
    changeCallStack(ownerAddress.toString() + ' , ' + contractAddr);

    const name = 'my-website';
    const desc = '';
    const setResolverArgs = new Args()
      .add(name)
      .add(websiteStorerAddress.toString())
      .add(desc)
      .serialize();

    setResolver(setResolverArgs);

    const stored = new Args(resolver(new Args().add(name).serialize()));

    expect(stored.nextString().unwrap()).toBe(websiteStorerAddress.toString());
    expect(stored.nextString().unwrap()).toBe(ownerAddress.toString());
    expect(stored.nextString().unwrap()).toBe(desc);
  });

  test('try to book an already booked DNS', () => {
    expect(() => {
      const setResolverArgs = new Args()
        .add('test')
        .add(ownerAddress.toString())
        .serialize();
      setResolver(setResolverArgs);
    }).toThrow();
  });

  test('try to blackList a websiteName not being the owner', () => {
    expect(() => {
      changeCallStack(ownerAddress.toString() + ' , ' + contractAddr);
      addWebsiteToBlackList(websiteName);
    }).toThrow();
    expect(Storage.has(blackListKey)).toBeFalsy();
  });

  test('try to blackList a websiteName being the owner', () => {
    changeCallStack(
      dnsAdmin.toString() +
        ' , A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT',
    );
    addWebsiteToBlackList(websiteName);
    expect(Storage.get(blackListKey)).toStrictEqual(websiteName);
  });
});
