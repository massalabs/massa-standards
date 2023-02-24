import {
  createSC,
  generateEvent,
  fileToByteArray,
} from '@massalabs/massa-as-sdk';

/**
 * Creates a new smart contract with the websiteDeployer.wasm file content.
 *
 * @param _ - not used
 */
export function main(_: StaticArray<u8>): i32 {
  const bytes: StaticArray<u8> = fileToByteArray(
    './build/websiteDeployer.wasm',
  );

  const websiteDeployer = createSC(bytes);
  // this event is important for Thyra you need to have the address after ":" and without spaces
  generateEvent(
    `Website Deployer is deployed at :${websiteDeployer.toString()}`,
  );

  return 0;
}
