/**
 * DNS implementation by MassaLabs.
 *
 * This first very simple version of a DNS is designed to handle only the web-on chain.
 *
 * The idea is to create a link between :
 * - a hostname called name or web site name
 * - an address where the smart contract of the web site deployment and the chunks of the web site are located.
 * This field is called resolver (needs to be renamed for clarity, feel free to update the code if you work on this).
 * - a DNS record owner, which is the owner of the website name and its address.
 *
 * The datastore is used to persist all this information in the following way:
 * - The DNS owner address
 *   the key is 'owner'
 *   the value is the address
 * - the list of all the web-site names
 * The key (web-site name) and the values (address and owner) are encoded using args.
 * - the list of all owners
 * The key ("owned" concatenated with the owner's address) and the value (web-site names in CSV format)
 * are encoded using args.
 * The key ("blackList") and the value (web-site names in CSV format)
 * are encoded using args.
 */
import {
  Storage,
  generateEvent,
  Address,
  Context,
  callerHasWriteAccess,
} from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { ownerKey, triggerError } from '../utils';

export const contractOwnerKey = new Args().add('owner').serialize();

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param binaryArgs - Arguments serialized with Args: dns owner address
 */
export function constructor(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!callerHasWriteAccess()) {
    return [];
  }
  Storage.set(contractOwnerKey, binaryArgs);
  return [];
}

/**
 * This function checks the caller is the admin of the DNS
 */
function isOwner(): bool {
  const owner = new Args(Storage.get(contractOwnerKey))
    .nextString()
    .expect('owner key is missing or invalid');
  return owner == Context.caller().toString();
}

/**
 * @param binaryArgs - Arguments serialized with Args: owner address
 */
export function setOwner(binaryArgs: StaticArray<u8>): void {
  if (!isOwner()) {
    generateEvent('setOwner: you are not the owner');
    return;
  }
  Storage.set(contractOwnerKey, binaryArgs);
}

/**
 * Adds a new record to the DNS.
 * Website name and address are given as argument, owner's address is deduce from caller.
 *
 * This function will trigger an error event if the name is already reserved.
 *
 * @param binaryArgs - Website name and its address in a binary format using Args.
 *
 * @example
 * setResolver(new Args().add("my-website").add(myWebSiteAddress)
 */
export function setResolver(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const websiteName = args
    .nextString()
    .expect('websiteName argument is missing or invalid');
  const websiteAddress = args
    .nextString()
    .expect('websiteAddress argument is missing or invalid');
  const websiteNameBytes = new Args().add(websiteName);

  if (Storage.has(websiteNameBytes)) {
    triggerError('Try another website name, this one is already taken.');
    return;
  }

  Storage.set(
    websiteNameBytes,
    new Args().add(websiteAddress).add(Context.caller().toString()),
  );

  addToOwnerList(Context.caller(), websiteName);
  // this event should not be changed without changing the event listener in Thyra
  generateEvent(
    `Website name ${websiteName} added to DNS at address ${websiteAddress}`,
  );
}

/**
 * Returns the website address of the given website name.
 * If the name is not found, an empty array is returned.
 *
 * @param binaryArgs - Website name in a binary format using Args.
 *
 * @returns the website and the owner's address or an empty array.
 *
 * @example
 * resolver(new Args().add("my-website").serialize())
 */
export function resolver(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  if (Storage.has(binaryArgs)) {
    return Storage.get(binaryArgs);
  }

  return [];
}

/**
 * Returns the owner's address of the given website name.
 * If the website doesn't exist an empty array is returned.
 *
 * @param binaryArgs - Website name in a binary format using Args.
 *
 * @returns the owner's address or an empty array.
 *
 * @example
 * owner(new Args().add("my-website").serialize())
 */
export function owner(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const websiteName = args
    .nextString()
    .expect('Website name argument is missing or invalid');
  const websiteNameBytes = new Args().add(websiteName).serialize();

  if (Storage.has(websiteNameBytes)) {
    const websiteAddressAndOwner = new Args(Storage.get(websiteNameBytes));
    websiteAddressAndOwner.nextString().unwrap();

    const ownerAddress = websiteAddressAndOwner.nextString().unwrap();

    return new Args().add(ownerAddress).serialize();
  }

  return [];
}

/**
 * Appends a new website name to the list of the given owner.
 *
 * @param owner -
 * @param websiteName -
 */
function addToOwnerList(owner: Address, websiteName: string): void {
  const ownerListKey = ownerKey(owner);

  if (!Storage.has(ownerListKey)) {
    Storage.set(ownerListKey, new Args().add(websiteName).serialize());
    generateEvent(
      `Domain name ${websiteName} added to owner address ${owner.toString()}`,
    );
    return;
  }

  const oldList = new Args(Storage.get(ownerListKey)).nextString().unwrap();

  if (oldList.split(',').includes(websiteName)) {
    triggerError('ALREADY_RESERVED'); // it's not possible with the current implementation.
    return;
  }

  let newList = '';

  if (oldList.length == 0) {
    // needed if we implement a removeFromOwnerList function
    newList = websiteName;
  } else {
    newList = oldList + ',' + websiteName;
  }

  Storage.set(ownerListKey, new Args().add(newList).serialize());
  generateEvent(
    `Domain name ${websiteName} added to owner address ${owner.toString()}`,
  );
}

/**
 * Appends a new website name to the blacklist
 *
 * @param binaryArgs - Website name in a binary format using Args.
 */
export function addWebsiteToBlackList(binaryArgs: StaticArray<u8>): void {
  if (!isOwner()) {
    generateEvent('addWebsiteToBlackList: you are not the owner');
    return;
  }
  const blackListKey = new Args().add('blackList').serialize();

  const websiteName = new Args(binaryArgs)
    .nextString()
    .expect('Website Name is missing or invalid');
  if (!Storage.has(blackListKey)) {
    Storage.set(blackListKey, binaryArgs);
    generateEvent(`Domain name ${websiteName} added to blackList`);
    return;
  }

  const oldList = new Args(Storage.get(blackListKey)).nextString().unwrap();

  if (oldList.split(',').includes(websiteName)) {
    triggerError('ALREADY_BLACKLISTED');
    return;
  }

  let newList = '';

  if (oldList.length == 0) {
    // needed if we implement a removeFromBlackList function
    newList = websiteName;
  } else {
    newList = oldList + ',' + websiteName;
  }

  Storage.set(blackListKey, new Args().add(newList).serialize());
  generateEvent(`Domain name ${websiteName} added to blackList`);
}
