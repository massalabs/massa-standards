import {
  stringToBytes,
  bytesToU256,
  bytesToString,
  boolToByte,
  byteToBool,
  u256ToBytes,
  Args,
} from '@massalabs/as-types';
import {
  Storage,
  Context,
  createEvent,
  generateEvent,
  functionExists,
  call,
  Address,
} from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';

export const URI_KEY: StaticArray<u8> = [0x01];

export const BALANCE_KEY_PREFIX: StaticArray<u8> = [0x02];
export const OPERATOR_APPROVAL_KEY_PREFIX: StaticArray<u8> = [0x03];
export const ALLOWANCE_KEY_PREFIX: StaticArray<u8> = [0x04];

export const APPROVAL_FOR_ALL_EVENT: string = 'ApprovalForAll';
export const TRANSFER_SINGLE_EVENT: string = 'TransferSingle';
export const TRANSFER_BATCH_EVENT: string = 'TransferBatch';
export const URI_EVENT: string = 'URI';

export const INVALID_OPERATOR_ERROR: string = 'InvalidOperator';
export const ERC1155_BALANCE_OVERFLOW_ERROR: string = 'ERC1155BalanceOverflow';
export const ERC1155_INSUFFICIENT_BALANCE_ERROR: string =
  'ERC1155InsufficientBalance';
export const ERC1155_INVALID_ARRAY_LENGTH_ERROR: string =
  'ERC1155InvalidArrayLength';
export const ERC1155_INVALID_RECEIVER_ERROR: string = 'ERC1155InvalidReceiver';
export const ERC1155_INVALID_SENDER_ERROR: string = 'ERC1155InvalidSender';
export const ERC1155_MISSING_APPROVAL_FOR_ALL_ERROR: string =
  'ERC1155MissingApprovalForAll';

/**
 * Constructs a new Multi-NFT contract.
 * @param uri - the URI for the NFT contract
 *
 * @remarks This function shouldn't be directly exported by the implementation contract.
 * It is meant to be called by the constructor of the implementation contract.
 * Please check the token.ts file for an example of how to use this function.
 */
export function _constructor(uri: string): void {
  _setURI(uri);
}

/**
 * @param id - the id of the token
 * @param address - the address of the owner
 * @returns the key of the balance in the storage for the given id and address
 */
function balanceKey(id: u256, address: string): StaticArray<u8> {
  return BALANCE_KEY_PREFIX.concat(
    u256ToBytes(id).concat(stringToBytes(address)),
  );
}

/**
 * @param owner - the address of the owner
 * @param operator - the address of the operator
 * @returns the key of the operator approval in the storage for the given owner and operator
 */
function operatorApprovalKey(owner: string, operator: string): StaticArray<u8> {
  return OPERATOR_APPROVAL_KEY_PREFIX.concat(
    stringToBytes(owner).concat(stringToBytes(operator)),
  );
}

/**
 * @param owner - the address of the owner
 * @param spender - the address of the spender
 * @returns the key of the allowance in the storage for the given owner and spender
 */
export function _balanceOf(owner: string, id: u256): u256 {
  const key = balanceKey(id, owner);
  return Storage.has(key) ? bytesToU256(Storage.get(key)) : u256.Zero;
}

/**
 * @param owner - the address of the owner
 * @param id - the id of the token
 * @returns the balance of the token for the address
 */
export function _balanceOfBatch(owners: string[], ids: u256[]): u256[] {
  const balances = new Array<u256>(ids.length);
  for (let i = 0; i < ids.length; i++) {
    balances[i] = _balanceOf(owners[i], ids[i]);
  }
  return balances;
}

/**
 * @param id - the id of the token - it is not used in this implementation but mandatory for the ERC1155 standard
 * @returns the URI for the token
 */
export function _uri(_: u256): string {
  return Storage.has(URI_KEY) ? bytesToString(Storage.get(URI_KEY)) : '';
}

/**
 * Set the URI for the NFT contract
 * @param newUri - the new URI
 */
export function _setURI(newUri: string): void {
  Storage.set(URI_KEY, stringToBytes(newUri));
  generateEvent(createEvent(URI_EVENT, [newUri, newUri]));
}

/**
 * Set the approval status of an operator for all tokens of the owner
 * @param operator - the operator to set the approval for
 * @param approved - the approval status
 */
export function _setApprovalForAll(
  owner: string,
  operator: string,
  approved: bool,
): void {
  assert(operator != '', INVALID_OPERATOR_ERROR);

  const key = operatorApprovalKey(owner, operator);
  approved ? Storage.set(key, boolToByte(true)) : Storage.del(key);

  generateEvent(
    createEvent(APPROVAL_FOR_ALL_EVENT, [owner, operator, approved.toString()]),
  );
}

/**
 * @param owner - the address of the owner
 * @param operator - the address of the operator
 * @returns the approval status of the operator for the owner
 */
export function _isApprovedForAll(owner: string, operator: string): bool {
  const key = operatorApprovalKey(owner, operator);
  return Storage.has(key) ? byteToBool(Storage.get(key)) : false;
}

/**
 * Transfers `ids` from `from` to `to`,
 * or alternatively mints if `from` is the zero address.
 * or alternatively burns if the `to` is the zero address.
 *
 * @param from - the address to transfer the token from. If the address is the zero address, the token is minted.
 * @param to - the address to transfer the token to. If the address is the zero address, the token is burned.
 * @param ids - the tokens to transfer. Should be an array of same length as `values`.
 * @param values - the amounts of tokens to transfer. Should be an array of same length as `ids`.
 * @remarks This function is a helper function for functions such as `_updateWithAcceptanceCheck`.
 * It is not meant to be called directly as it does not check for the caller's permissions.
 * For example if you were to wrap this helper in a `transfer` function,
 * you should check that the caller is the owner of the token, and then call the _update function.
 */
export function _update(
  from: string,
  to: string,
  ids: u256[],
  values: u256[],
): void {
  assert(ids.length == values.length, ERC1155_INVALID_ARRAY_LENGTH_ERROR);

  const operator = Context.caller().toString();

  for (let i = 0; i < ids.length; ++i) {
    const id = ids[i];
    const value = values[i];

    if (from != '') {
      const fromBalanceKey = balanceKey(id, from);
      const fromBalance = Storage.has(fromBalanceKey)
        ? bytesToU256(Storage.get(fromBalanceKey))
        : u256.Zero;
      assert(fromBalance >= value, ERC1155_INSUFFICIENT_BALANCE_ERROR);

      Storage.set(fromBalanceKey, u256ToBytes(fromBalance - value));
    }

    if (to != '') {
      const toBalanceKey = balanceKey(id, to);
      const toBalance = Storage.has(toBalanceKey)
        ? bytesToU256(Storage.get(toBalanceKey))
        : u256.Zero;
      const result = toBalance + value;
      // check if toBalance + value overflow
      assert(result >= toBalance, ERC1155_BALANCE_OVERFLOW_ERROR);

      Storage.set(toBalanceKey, u256ToBytes(result));
    }
  }

  if (ids.length == 1) {
    generateEvent(
      createEvent(TRANSFER_SINGLE_EVENT, [
        operator,
        from,
        to,
        ids[0].toString(),
        values[0].toString(),
      ]),
    );
  } else {
    generateEvent(
      createEvent(TRANSFER_BATCH_EVENT, [
        operator,
        from,
        to,
        ids.map<string>((id: u256) => id.toString()).join(';'),
        values.map<string>((value: u256) => value.toString()).join(';'),
      ]),
    );
  }
}

/**
 * Update the balances of the sender and receiver
 *
 * It also calls the onERC1155Received or onERC1155BatchReceived function if the receiver is a contract
 *
 * @param from - the address of the sender
 * @param to - the address of the receiver
 * @param ids - the ids of the tokens
 * @param values - the amounts of tokens
 * @param data - additional data to pass to the receiver
 */
export function _updateWithAcceptanceCheck(
  from: string,
  to: string,
  ids: u256[],
  values: u256[],
  data: StaticArray<u8>,
): void {
  _update(from, to, ids, values);
  if (to != '') {
    const operator = Context.caller().toString();
    const toAddress = new Address(to);
    if (ids.length == 1) {
      const id = ids[0];
      const value = values[0];
      // use startsWith as a workaround for isAddressEoa which is not mocked in tests
      if (
        to.startsWith('AS') &&
        functionExists(toAddress, 'onERC1155Received')
      ) {
        const output = call(
          toAddress,
          'onERC1155Received',
          new Args().add(operator).add(from).add(id).add(value).add(data),
          0,
        );
        // Check if the returned value is bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))
        assert(
          output.toString() ==
            new Args().add('f23a6e61').serialize().toString(),
        );
      }
    } else {
      if (
        to.startsWith('AS') &&
        functionExists(toAddress, 'onERC1155BatchReceived')
      ) {
        const output = call(
          toAddress,
          'onERC1155BatchReceived',
          new Args().add(operator).add(from).add(ids).add(values).add(data),
          0,
        );
        // Check if the returned value is
        // bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))
        assert(
          output.toString() ==
            new Args().add('bc197c81').serialize().toString(),
        );
      }
    }
  }
}

/**
 * @param from - the address of the sender
 * @param to - the address of the receiver
 * @param id - the id of the token
 * @param value - the amount of tokens
 * @param data - additional data to pass to the receiver
 */
export function _safeTransferFrom(
  from: string,
  to: string,
  id: u256,
  value: u256,
  data: StaticArray<u8>,
): void {
  assert(to != '', ERC1155_INVALID_RECEIVER_ERROR);
  assert(from != '', ERC1155_INVALID_SENDER_ERROR);

  _updateWithAcceptanceCheck(from, to, [id], [value], data);
}

/**
 * @param from - the address of the sender
 * @param to - the address of the receiver
 * @param ids - the ids of the tokens
 * @param values - the amounts of tokens
 * @param data - additional data to pass to the receiver
 */
export function _safeBatchTransferFrom(
  from: string,
  to: string,
  ids: u256[],
  values: u256[],
  data: StaticArray<u8>,
): void {
  assert(to != '', ERC1155_INVALID_RECEIVER_ERROR);
  assert(from != '', ERC1155_INVALID_SENDER_ERROR);

  _updateWithAcceptanceCheck(from, to, ids, values, data);
}

/**
 * @param to - the account to mint the tokens to
 * @param id - the id of the token to mint
 * @param value - the amount of tokens to mint
 * @param data - additional data to pass to the receiver
 */
export function _mint(
  to: string,
  id: u256,
  value: u256,
  data: StaticArray<u8>,
): void {
  assert(to != '', ERC1155_INVALID_RECEIVER_ERROR);

  _updateWithAcceptanceCheck('', to, [id], [value], data);
}

/**
 * @param to - the account to mint the tokens to
 * @param ids - the ids of the tokens to mint
 * @param values - the amounts of tokens to mint
 * @param data - additional data to pass to the receiver
 */
export function _mintBatch(
  to: string,
  ids: u256[],
  values: u256[],
  data: StaticArray<u8>,
): void {
  assert(to != '', ERC1155_INVALID_RECEIVER_ERROR);

  _updateWithAcceptanceCheck('', to, ids, values, data);
}

/**
 * @param account - the account to burn the tokens from
 * @param id - the id of the token to burn
 * @param value - the amount of tokens to burn
 */
export function _burn(from: string, id: u256, value: u256): void {
  assert(from != '', ERC1155_INVALID_SENDER_ERROR);

  _updateWithAcceptanceCheck(from, '', [id], [value], []);
}

/**
 * @param account - the account to burn the tokens from
 * @param ids - the ids of the tokens to burn
 * @param values - the amounts of tokens to burn
 * @param data - additional data to pass to the receiver
 */
export function _burnBatch(from: string, ids: u256[], values: u256[]): void {
  assert(from != '', ERC1155_INVALID_SENDER_ERROR);

  _updateWithAcceptanceCheck(from, '', ids, values, []);
}
