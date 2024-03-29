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
 *   the key is 'OWNER'
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
  isDeployingContract,
} from '@massalabs/massa-as-sdk';
import { Args, byteToBool } from '@massalabs/as-types';
import { onlyOwner, setOwner, triggerError } from '../utils';

export const blackListKey = new Args().add('blackList').serialize();

export function dns1_isDnsValid(input: string): bool {
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);

    if (
      !(
        (
          (charCode >= 97 && charCode <= 122) || // lowercase (a-z)
          (charCode >= 48 && charCode <= 57) || // numeric (0-9)
          charCode === 45 || // dash (-)
          charCode === 95
        ) // underscore (_)
      )
    ) {
      return false; // character is not alphanumeric or dash or underscore
    }
  }

  return true;
}

export function dns1_isDescriptionValid(description: string): boolean {
  // Check if the length exceeds the maximum limit of 280 characters
  if (description.length > 280) {
    return false;
  }

  return true;
}

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param binaryArgs - Arguments serialized with Args: dns owner address
 */
export function constructor(_: StaticArray<u8>): StaticArray<u8> {
  assert(isDeployingContract());

  setOwner(new Args().add(Context.caller().toString()).serialize());
  return [];
}

function dns1_ownerKey(address: Address): StaticArray<u8> {
  return new Args().add('owned' + address.toString()).serialize();
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
export function dns1_setResolver(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const websiteName = args
    .nextString()
    .expect('website name is missing or invalid');

  if (!dns1_isDnsValid(websiteName)) {
    triggerError('INVALID_DNS_ENTRY');
  }

  const websiteAddress = args
    .nextString()
    .expect('website address is missing or invalid');

  const websiteNameBytes = new Args().add(websiteName);

  const description = args
    .nextString()
    .expect('website description is missing or invalid');

  if (!dns1_isDescriptionValid(description)) {
    triggerError('INVALID_DESCRIPTION_ENTRY');
  }

  if (Storage.has(websiteNameBytes)) {
    triggerError('Try another website name, this one is already taken.');
  }

  // Check if the website name is blacklisted
  const isBlacklistedValue = byteToBool(
    dns1_isBlacklisted(new Args().add(websiteName).serialize()),
  );

  if (isBlacklistedValue) {
    triggerError('Try another website name, ' + websiteName + ' is reserved.');
  }

  Storage.set(
    websiteNameBytes,
    new Args()
      .add(websiteAddress)
      .add(Context.caller().toString())
      .add(description),
  );

  dns1_addToOwnerList(Context.caller(), websiteName);

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
export function dns1_resolver(binaryArgs: StaticArray<u8>): StaticArray<u8> {
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
export function dns1_owner(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  if (Storage.has(binaryArgs)) {
    const entry = new Args(Storage.get(binaryArgs));
    // skip the website address
    entry.nextString().unwrap();
    const ownerAddress = entry.nextString().unwrap();

    return new Args().add(ownerAddress).serialize();
  }

  return [];
}

/**
 * Checks if the given address is the owner of the website.
 * @param binaryArgs - Website name and the address of potential owner in a binary format using Args.
 * @returns A serialized boolean indicating if the potential owner is the actual owner of the website.
 */
export function dns1_isOwnerOfWebsite(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const websiteName = args
    .nextString()
    .expect('website name is missing or invalid');

  const potentialOwner = args
    .nextString()
    .expect('potential owner address is missing or invalid');

  const websiteArgs = new Args().add(websiteName).serialize();
  const ownerAddressArray = dns1_owner(websiteArgs);

  // Convert the owner address array to a string for comparison
  const ownerAddress = new Args(ownerAddressArray).nextString().unwrap();

  return new Args().add(ownerAddress === potentialOwner).serialize();
}

/**
 * Ensures that the caller is the owner of the specific website.
 *
 * @param websiteName - The name of the website to check ownership.
 */
function dns1_onlyWebsiteOwner(websiteName: string): void {
  // Get the address of the caller
  const callerAddress = Context.caller().toString();

  const argsWebsiteOwner = new Args()
    .add(websiteName)
    .add(callerAddress)
    .serialize();

  const isWebsiteOwner = byteToBool(dns1_isOwnerOfWebsite(argsWebsiteOwner));

  // Ensure that the caller is the owner of the website
  assert(isWebsiteOwner, 'Caller is not the the owner of the website');
}

/**
 * Get the owner's list of websites as a string.
 *
 * @param binaryArgs - The address of the owner in a binary format using Args.
 * @returns The owner's list of websites or an empty serialized string.
 */
export function dns1_getOwnerWebsiteList(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const owner = args
    .nextString()
    .expect('address of the owner is missing or invalid');

  const ownerListKey = dns1_ownerKey(new Address(owner));

  if (!Storage.has(ownerListKey)) {
    return new Args().add('').serialize(); // Return an empty string if the owner's list is not found.
  }

  return Storage.get(ownerListKey);
}

/**
 * Appends a new website name to the list of the given owner.
 *
 * @param owner -
 * @param websiteName -
 */
function dns1_addToOwnerList(owner: Address, websiteName: string): void {
  const ownerListKey = dns1_ownerKey(owner);

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
 * Deletes a website name from the list of the given owner.
 *
 * @param websiteName - The name of the website to delete.
 */
function dns1_deleteFromOwnerList(websiteName: string): void {
  const ownerbinary = dns1_owner(new Args().add(websiteName).serialize());
  const ownerAddr = new Address(new Args(ownerbinary).nextString().unwrap());
  const ownerListKey = dns1_ownerKey(ownerAddr);
  const oldList = new Args(dns1_getOwnerWebsiteList(ownerbinary))
    .nextString()
    .unwrap();
  const oldListArray = oldList.split(',');

  // Find the index of the websiteName in the old list array
  const index = oldListArray.indexOf(websiteName);

  // Check if the websiteName exists in the owner's list
  if (index === -1) {
    triggerError('WEBSITE_NOT_FOUND');
    return;
  }

  // Remove the websiteName from the old list array
  oldListArray.splice(index, 1);

  // Join the updated list array back into a string
  const newList = oldListArray.join(',');

  // Update the owner's list with the updated list
  Storage.set(ownerListKey, new Args().add(newList).serialize());

  // Emit an event to indicate the website name has been deleted from the owner's list
  generateEvent(
    `Domain name ${websiteName} deleted from owner address ${ownerAddr.toString()}`,
  );
}

/**
 * Retrieves the array of blacklisted keys.
 *
 * @returns The array of blacklisted keys as a StaticArray<u8>.
 */
export function dns1_getBlacklisted(): StaticArray<u8> {
  // Deserialize the blacklisted keys from storage, if it exists
  return Storage.has(blackListKey) ? Storage.get(blackListKey) : [0, 0, 0, 0];
}

/**
 * Appends multiple website names to the blacklist.
 *
 * @param binaryArgs - Website names in a binary format using Args.
 */
export function dns1_addWebsitesToBlackList(binaryArgs: StaticArray<u8>): void {
  // Ensure that the caller is the contract owner
  onlyOwner();

  // Extract the website names from binaryArgs and unwrap them into an array
  const websiteNames = new Args(binaryArgs).nextStringArray().unwrap();

  // Retrieve the current blacklisted keys
  const existingBlacklist = new Args(dns1_getBlacklisted())
    .nextStringArray()
    .unwrap();

  // Create a Set to ensure uniqueness of website names
  const blacklistSet = new Set<string>();

  // Merge the existing blacklist with the new website names
  const mergedWebsiteNames = websiteNames.concat(existingBlacklist);

  // Add each website name to the blacklist Set
  // the set is used to handle the case where a name is already blacklisted
  // so we will not add it twice to the blacklist

  for (let i = 0; i < mergedWebsiteNames.length; i++) {
    blacklistSet.add(mergedWebsiteNames[i]);
  }

  // Convert the Set back to an array
  const updatedBlacklist = blacklistSet.values();

  // Serialize the new blacklist array and store it in storage
  Storage.set(blackListKey, new Args().add(updatedBlacklist).serialize());

  // Generate an event with the website names that were added to the blacklist
  generateEvent(`Domain names added to blacklist: ${websiteNames.join(', ')}`);
}

/**
 * Checks if a website name is blacklisted.
 *
 * @param binaryArgs - Website name in a binary format using Args.
 * @returns A serialized boolean indicating whether the website name is blacklisted.
 */
export function dns1_isBlacklisted(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const websiteName = new Args(binaryArgs).nextString().unwrap();

  const blacklistedKeys = new Args(dns1_getBlacklisted())
    .nextStringArray()
    .unwrap();
  const isBlacklisted = blacklistedKeys.includes(websiteName);

  return new Args().add(isBlacklisted).serialize();
}

/**
 * Delete a single entry from the DNS based on the given website name.
 *
 * @param binaryArgs - Website name in a binary format using Args.
 */
export function dns1_deleteEntryFromDNS(binaryArgs: StaticArray<u8>): void {
  const websiteName = new Args(binaryArgs).nextString().unwrap();

  // Ensure that the caller is the owner of the website
  dns1_onlyWebsiteOwner(websiteName);

  if (Storage.has(binaryArgs)) {
    // Check if the website name exists in the DNS and delete it if found
    dns1_deleteFromOwnerList(websiteName);
    Storage.del(binaryArgs);

    // Generate an event with the website name that was deleted from the DNS
    generateEvent(`Domain name deleted from DNS: ${websiteName}`);
  } else {
    triggerError('WEBSITE_NOT_FOUND');
  }
}

/**
 * Deletes entries from the DNS based on the given website names.
 *
 * @param binaryArgs - Website names in a binary format using Args.
 */
export function dns1_deleteEntriesFromDNS(binaryArgs: StaticArray<u8>): void {
  // Extract the website names from binaryArgs and unwrap them into an array
  const websiteNamesToDelete = new Args(binaryArgs)
    .nextStringArray()
    .expect('website name list is missing or invalid');

  // Loop through the list of website names to delete and remove them from the DNS
  for (let i = 0; i < websiteNamesToDelete.length; i++) {
    const websiteName = websiteNamesToDelete[i];
    dns1_deleteEntryFromDNS(new Args().add(websiteName).serialize());
  }
}
