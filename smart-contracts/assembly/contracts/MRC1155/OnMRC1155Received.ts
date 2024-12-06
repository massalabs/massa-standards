import { Args } from '@massalabs/as-types';
import { createEvent, generateEvent } from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';

export function onMRC1155BatchReceived(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const operator = args
    .nextString()
    .expect('operator argument is missing or invalid');
  const from = args.nextString().expect('from argument is missing or invalid');
  const ids = args
    .nextFixedSizeArray<u256>()
    .expect('ids argument is missing or invalid');
  const values = args
    .nextFixedSizeArray<u256>()
    .expect('values argument is missing or invalid');
  const data = args.nextBytes().expect('data argument is missing or invalid');

  generateEvent(
    createEvent('MRC1155BatchReceived', [
      operator,
      from,
      ids.map<string>((id: u256) => id.toString()).join(';'),
      values.map<string>((id: u256) => id.toString()).join(';'),
      data.toString(),
    ]),
  );
  return new Args().add('bc197c81').serialize();
}

export function OnMRC1155Received(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const operator = args
    .nextString()
    .expect('operator argument is missing or invalid');
  const from = args.nextString().expect('from argument is missing or invalid');
  const id = args.nextU256().expect('id argument is missing or invalid');
  const value = args.nextU256().expect('value argument is missing or invalid');
  const data = args.nextBytes().expect('data argument is missing or invalid');

  generateEvent(
    createEvent('MRC1155Received', [
      operator,
      from,
      id.toString(),
      value.toString(),
      data.toString(),
    ]),
  );
  return new Args().add('f23a6e61').serialize();
}
