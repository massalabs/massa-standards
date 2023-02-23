import { call, Address } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';

/**
 * Call the DNS to add a website name to blackList Key
 * To add a name the caller needs to be the admin
 * current admin is : "A1qDAxGJ387ETi9JRQzZWSPKYq4YPXrFvdiE4VoXUaiAt38JFEC"
 *
 * @param _ -
 */
export function main(_: StaticArray<u8>): void {
  const DNSAddress = new Address(
    'A1rYZSibJj5LuPiHmpgBVcfSBqyZoj8ugYdzV7vvgBzzQSojDCi',
  );
  call(DNSAddress, 'addWebsiteToBlackList', new Args().add('flappy'), 0);

  return;
}
