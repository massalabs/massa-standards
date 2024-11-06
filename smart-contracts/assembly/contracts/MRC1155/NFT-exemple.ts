import { Args, stringToBytes } from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';
import * as token from './token';
import * as mint from './mintable/mint';
import { Context } from '@massalabs/massa-as-sdk';
import { grantRole } from '../utils/accessControl';
export * from './burnable/burn';
export * from './mintable/mint';
export * from '../utils/accessControl';
export * from '../utils/ownership';

export function constructor(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const uri = args.nextString().expect('uri argument is missing or invalid');
  const ids = args
    .nextFixedSizeArray<u256>()
    .expect('ids argument is missing or invalid');
  const amounts = args
    .nextFixedSizeArray<u256>()
    .expect('amounts argument is missing or invalid');
  token.constructor(new Args().add(uri).serialize());
  grantRole(
    new Args()
      .add(mint.MINTER_ROLE)
      .add(Context.caller().toString())
      .serialize(),
  );
  mint.mintBatch(
    new Args()
      .add(Context.caller().toString())
      .add(ids)
      .add(amounts)
      .add(stringToBytes(''))
      .serialize(),
  );
}

// export everything from the token module except the constructor
export {
  uri,
  balanceOf,
  balanceOfBatch,
  setApprovalForAll,
  isApprovedForAll,
  safeTransferFrom,
  safeBatchTransferFrom,
} from './token';
