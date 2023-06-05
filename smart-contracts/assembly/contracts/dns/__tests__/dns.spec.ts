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

const dummyAddress = new Address(
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
    const serializedDummyAddress = new Args()
      .add(dummyAddress.toString())
      .serialize();
    constructor(serializedDummyAddress);
    expect(Storage.get(contractOwnerKey)).toStrictEqual(serializedDummyAddress);
  });

  test('set owner', () => {
    const serializedDnsAdmin = new Args().add(dnsAdmin.toString()).serialize();
    changeCallStack(dummyAddress.toString() + ' , ' + contractAddr);
    setOwner(serializedDnsAdmin);
    expect(Storage.get(contractOwnerKey)).toStrictEqual(serializedDnsAdmin);
    changeCallStack(dnsAdmin.toString() + ' , ' + contractAddr);
  });

  test('invalid dns entry', () => {
    expect(() => {
      const setResolverArgs = new Args()
        .add('invalid dns entry')
        .add(dummyAddress.toString())
        .serialize();
      setResolver(setResolverArgs);
    }).toThrow();
  });

  test('setResolver call', () => {
    const setResolverArgs = new Args()
      .add('test')
      .add(websiteStorerAddress.toString())
      .serialize();
    setResolver(setResolverArgs);
    const newDomainNameArgs = new Args()
      .add('newWebsite')
      .add(websiteStorerAddress.toString())
      .serialize();
    setResolver(newDomainNameArgs);

    const setResolverParams = new Args().add('test').serialize();
    const got = new Args(resolver(setResolverParams))
      .nextString()
      .expect('got argument is missing or invalid');
    expect(new Address(got)).toBe(websiteStorerAddress);
  });

  test('try to book an already booked DNS', () => {
    expect(() => {
      const setResolverArgs = new Args()
        .add('test')
        .add(dummyAddress.toString())
        .serialize();
      setResolver(setResolverArgs);
    }).toThrow();
  });

  test('try to blackList a websiteName not being the owner', () => {
    expect(() => {
      changeCallStack(dummyAddress.toString() + ' , ' + contractAddr);
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
