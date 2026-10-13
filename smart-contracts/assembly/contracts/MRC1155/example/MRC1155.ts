import { Args, stringToBytes } from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';
import { mrc1155Constructor } from '../MRC1155';
import { MINTER_ROLE } from '../mintable/mint';
import { _mintBatch } from '../MRC1155-internal';
import { Context } from '@massalabs/massa-as-sdk';
import { _grantRole } from '../../utils/accessControl-internal';

export function constructor(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const uri = args.nextString().expect('uri argument is missing or invalid');
  const ids = args
    .nextFixedSizeArray<u256>()
    .expect('ids argument is missing or invalid');
  const amounts = args
    .nextFixedSizeArray<u256>()
    .expect('amounts argument is missing or invalid');

  mrc1155Constructor(uri);

  // Use the non-reconciling internals: the exported grantRole/mintBatch each
  // call transferRemaining, and nesting them here would misaccount coins.
  const caller = Context.caller().toString();
  _grantRole(MINTER_ROLE, caller);
  _mintBatch(caller, ids, amounts, stringToBytes(''));
}

export * from '../burnable/burn';
export * from '../mintable/mint';
export * from '../../utils/accessControl';
export * from '../../utils/ownership';
// export everything from the token module except the constructor
export {
  version,
  uri,
  balanceOf,
  balanceOfBatch,
  setApprovalForAll,
  isApprovedForAll,
  safeTransferFrom,
  safeBatchTransferFrom,
} from '../MRC1155';
