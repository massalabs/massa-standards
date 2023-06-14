import { contractOwnerKey } from './../dns';
import {
  setResolver,
  resolver,
  addWebsiteToBlackList,
  constructor,
  setOwner,
} from '../dns';
import { Storage, mockAdminContext } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import {
  changeCallStack,
  resetStorage,
} from '@massalabs/massa-as-sdk/assembly/vm-mock/storage';

// address of admin caller set in vm-mock. must match with adminAddress of @massalabs/massa-as-sdk/vm-mock/vm.js
const deployerAddress = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';

const websiteAddr = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

const dnsAdmin = 'AU1qDAxGJ387ETi9JRQzZWSPKYq4YPXrFvdiE4VoXUaiAt38JFEC';

const user1Addr = 'AU125TiSrnD2YatYfEyRAWnBdD7TEuVbvGFkFgDuaYc2bdKyqKtb';

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
  resetStorage();
  mockAdminContext(true);
});

describe('DNS contract tests', () => {
  test('constructor', () => {
    const serializeddeployerAddress = new Args()
      .add(deployerAddress)
      .serialize();
    constructor(serializeddeployerAddress);
    expect(Storage.get(contractOwnerKey)).toStrictEqual(
      serializeddeployerAddress,
    );
  });

  test('change dns admin', () => {
    const serializedDnsAdmin = new Args().add(dnsAdmin).serialize();
    setOwner(serializedDnsAdmin);
    expect(Storage.get(contractOwnerKey)).toStrictEqual(serializedDnsAdmin);
  });

  test('invalid dns entry', () => {
    expect(() => {
      const setResolverArgs = new Args()
        .add('invalid dns entry')
        .add(deployerAddress)
        .serialize();
      setResolver(setResolverArgs);
    }).toThrow();
  });

  test('create dns entry', () => {
    switchUser(user1Addr);

    const name = 'test';
    const desc = 'website description';

    const setResolverArgs = new Args()
      .add(name)
      .add(websiteAddr)
      .add(desc)
      .serialize();

    setResolver(setResolverArgs);

    const stored = new Args(resolver(new Args().add(name).serialize()));

    expect(stored.nextString().unwrap()).toBe(websiteAddr, 'wrong websiteAddr');
    expect(stored.nextString().unwrap()).toBe(user1Addr, 'wrong owner address');
    expect(stored.nextString().unwrap()).toBe(desc, 'wrong description');
  });

  test('add dns entry with empty description', () => {
    switchUser(deployerAddress);

    const name = 'my-website';
    const desc = '';
    const setResolverArgs = new Args()
      .add(name)
      .add(websiteAddr)
      .add(desc)
      .serialize();

    setResolver(setResolverArgs);

    const stored = new Args(resolver(new Args().add(name).serialize()));

    expect(stored.nextString().unwrap()).toBe(websiteAddr);
    expect(stored.nextString().unwrap()).toBe(deployerAddress);
    expect(stored.nextString().unwrap()).toBe(desc);
  });

  test('try to book an already booked DNS', () => {
    expect(() => {
      const setResolverArgs = new Args()
        .add('test')
        .add(deployerAddress)
        .serialize();
      setResolver(setResolverArgs);
    }).toThrow();
  });

  describe('DNS blacklist tests', () => {
    const name = 'backlisted';
    const desc = 'backlisted website description';

    beforeAll(() => {
      // set a dns entry
      switchUser(user1Addr);
      const setResolverArgs = new Args()
        .add(name)
        .add(websiteAddr)
        .add(desc)
        .serialize();
      setResolver(setResolverArgs);
    });

    test('try to blackList a websiteName not being admin', () => {
      switchUser(deployerAddress);
      const blackListKey = new Args().add('blackList').serialize();

      expect(() =>
        addWebsiteToBlackList(new Args().add(name).serialize()),
      ).toThrow();
      expect(Storage.has(blackListKey)).toBeFalsy();
    });

    test('try to blackList a websiteName being admin', () => {
      switchUser(dnsAdmin);
      const blackListKey = new Args().add('blackList').serialize();

      addWebsiteToBlackList(new Args().add(name).serialize());
      expect(Storage.get(blackListKey)).toStrictEqual(
        new Args().add(name).serialize(),
      );
    });
  });
});
