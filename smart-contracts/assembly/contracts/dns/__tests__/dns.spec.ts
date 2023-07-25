import { blackListKey, getBlacklisted } from './../dns';
import {
  setResolver,
  isDescriptionValid,
  resolver,
  isDnsValid,
  addWebsitesToBlackList,
  isBlacklisted,
  deleteEntryFromDNS,
  deleteEntriesFromDNS,
  getOwnerWebsiteList,
  constructor,
} from '../dns';
import { Storage, mockAdminContext, Address } from '@massalabs/massa-as-sdk';
import { Args, byteToBool, stringToBytes } from '@massalabs/as-types';
import {
  changeCallStack,
  resetStorage,
} from '@massalabs/massa-as-sdk/assembly/vm-mock/storage';
import { ownerAddress, setOwner } from '../../utils';

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
    constructor([]);
    expect(ownerAddress([])).toStrictEqual(stringToBytes(deployerAddress));
  });

  test('change dns admin', () => {
    const serializedDnsAdmin = new Args().add(dnsAdmin).serialize();
    setOwner(serializedDnsAdmin);
    expect(ownerAddress([])).toStrictEqual(stringToBytes(dnsAdmin));
  });

  test('description length', () => {
    const validDescriptionLessThan280 =
      'Valid description with less than 280 characters.';
    const invalidDescriptionMoreThan280 =
      'Invalid description exceeding the maximum limit of 280 characters.' +
      'x'.repeat(300);
    const validDescriptionExactly280 = 'x'.repeat(280);

    expect(isDescriptionValid(validDescriptionLessThan280)).toBe(true);
    expect(isDescriptionValid(invalidDescriptionMoreThan280)).toBe(false);
    expect(isDescriptionValid(validDescriptionExactly280)).toBe(true);
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

  describe('DNS Name Validity', () => {
    test('valid DNS name', () => {
      const validDnsEntries = [
        'example',
        'example123',
        'example_name',
        'example-name',
        'example_name-123',
      ];

      validDnsEntries.forEach((entry) => {
        expect(isDnsValid(entry)).toBe(true);
      });
    });

    test('invalid DNS name', () => {
      const invalidDnsEntries = [
        'example@',
        'example!',
        'example$',
        'example%',
        'example^',
        'example&',
        'example*',
        'example(',
        'example)',
        'example=',
      ];

      invalidDnsEntries.forEach((entry) => {
        expect(isDnsValid(entry)).toBe(false);
      });
    });
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

    test('blacklist name not being admin', () => {
      switchUser(user1Addr);
      expect(() => {
        const blacklistArgs = new Args().add(['blacklist1']).serialize();
        addWebsitesToBlackList(blacklistArgs);
      }).toThrow();
    });

    test('add multiple websites to blacklist being dns admin', () => {
      switchUser(dnsAdmin);
      const websiteNames = ['flappy', 'example', 'website'];
      const args = new Args().add(websiteNames);
      const websiteNamesBinary = args.serialize();

      // Clear existing blacklist (if any)
      Storage.set(blackListKey, new Args().add([] as string[]).serialize());

      // Call the addWebsitesToBlackList function with the list of website names
      addWebsitesToBlackList(websiteNamesBinary);

      // Retrieve the updated blacklist from storage
      const updatedBlacklist = new Args(getBlacklisted())
        .nextStringArray()
        .unwrap();

      // Check if the website names have been added to the blacklist
      expect(updatedBlacklist).toStrictEqual(websiteNames);

      // Call again the addWebsitesToBlackList function with the same list of website names
      // To check that we don't blacklist twice
      addWebsitesToBlackList(websiteNamesBinary);

      // Retrieve the updated blacklist from storage
      const finalBlacklist = new Args(getBlacklisted())
        .nextStringArray()
        .unwrap();

      // Check if we always get the same website names and not twice
      expect(finalBlacklist).toStrictEqual(websiteNames);

      // Test the isBlacklisted function for a blacklisted website name
      const blacklistedName = 'example';

      // Expect the isBlacklisted return to be true since 'example' is blacklisted
      expect(
        byteToBool(isBlacklisted(new Args().add(blacklistedName).serialize())),
      ).toBe(true);

      // Test the isBlacklisted function for a non-blacklisted website name
      const nonblacklistedName = 'example2';

      // Expect the isBlacklisted return to be false since 'example2' is non blacklisted
      expect(
        byteToBool(
          isBlacklisted(new Args().add(nonblacklistedName).serialize()),
        ),
      ).toBe(false);
    });

    test('blacklist names and try to set resolver with a blacklisted name', () => {
      switchUser(dnsAdmin);
      // Blacklist a list of names
      const blacklistNames = ['blacklist1', 'blacklist2', 'blacklist3'];
      const blacklistArgs = new Args().add(blacklistNames);
      const blacklistArgsBinary = blacklistArgs.serialize();
      addWebsitesToBlackList(blacklistArgsBinary);

      // Try to set resolver with a blacklisted name
      const blacklistedName = 'blacklist1';

      expect(() => {
        const setResolverArgs = new Args()
          .add(blacklistedName)
          .add(deployerAddress)
          .add('')
          .serialize();
        setResolver(setResolverArgs);
      }).toThrow();
    });
  });
  describe('deleteEntriesFromDNS', () => {
    test('delete a single DNS entry as not website owner', () => {
      switchUser(dnsAdmin);
      expect(() => {
        const args = new Args().add('test').serialize();
        deleteEntryFromDNS(args);
      }).toThrow();
    });

    test('delete DNS entry as not website owner', () => {
      switchUser(user1Addr);

      // Create a DNS entry for testing
      const names = ['test-website'];
      const websiteAddr =
        'A1qth3jk2Yb5FcP9NYJh8MuFqEsyzRwqWGruL4uxATRrpPhLPVus';
      const description = 'Test website description';

      const setResolverArgs = new Args()
        .add(names[0])
        .add(websiteAddr)
        .add(description)
        .serialize();

      setResolver(setResolverArgs);

      // Ensure that the DNS entry has been created
      const storedEntry = new Args(
        resolver(new Args().add(names[0]).serialize()),
      );
      expect(storedEntry.nextString().unwrap()).toBe(websiteAddr);
      expect(storedEntry.nextString().unwrap()).toBe(user1Addr);
      expect(storedEntry.nextString().unwrap()).toBe(description);

      expect(getOwnerWebsiteList(new Address(user1Addr))).toBe(
        'test,backlisted,test-website',
      );

      // Delete the DNS entry using deleteEntriesFromDNS
      switchUser(user1Addr);
      const deleteArgs = new Args().add(names).serialize();
      deleteEntriesFromDNS(deleteArgs);

      const stored = new Args(resolver(new Args().add(names[0]).serialize()));

      // Ensure that the DNS entry has been deleted
      expect(stored.nextString().unwrap()).toBeNull;
      // The owner's list should contains only 2 entries since 'test-website' has been deleted
      expect(getOwnerWebsiteList(new Address(user1Addr))).toBe(
        'test,backlisted',
      ); // The owner's list should contains only 2 entries
    });
  });
});
