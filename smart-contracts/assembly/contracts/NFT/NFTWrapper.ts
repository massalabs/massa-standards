import { Address, call } from '@massalabs/massa-as-sdk';
import { Args, NoArg, bytesToString, bytesToU256 } from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';

/**
 * The Massa's standard NFT implementation wrapper.
 *
 * @remarks
 * This class can be used to wrap a smart contract implementing
 * Massa standard NFT.
 * All the serialization/deserialization will handled here.
 *
 * @example
 * ```typescript
 * const NFT = new NFTWrapper(NFTaddr);
 * NFT.transfer('1x', 1);
 * ```
 */
export class NFTWrapper {
  _origin: Address;

  /**
   * Wraps a smart contract exposing standard none fungible token.
   *
   * @param at - Address of the contract
   */
  constructor(at: Address) {
    this._origin = at;
  }

  /**
   * Generate an event with the NFT's name
   */
  name(): string {
    return bytesToString(call(this._origin, 'name', NoArg, 0));
  }
  /**
   * Generate an event with the NFT's symbol
   */
  symbol(): string {
    return bytesToString(call(this._origin, 'symbol', NoArg, 0));
  }

  /**
   * generate an event with the token URI (external link written in NFT where pictures or others are stored)
   * @param tokenId - Token ID
   */
  tokenURI(tokenId: u256): string {
    return bytesToString(
      call(this._origin, 'tokenURI', new Args().add(tokenId), 0),
    );
  }

  /**
   * generate an event with the base URI (external link written in NFT where pictures or others a stored)
   */
  baseURI(): string {
    return bytesToString(call(this._origin, 'baseURI', NoArg, 0));
  }

  /**
   * Generate an event with  the max supply
   */
  totalSupply(): u256 {
    return bytesToU256(call(this._origin, 'totalSupply', NoArg, 0));
  }

  /**
   * Generate an event with the current counter, if 10 NFT minted, returns 10.
   */
  currentSupply(): u256 {
    return bytesToU256(call(this._origin, 'currentSupply', NoArg, 0));
  }

  /**
   * Generate an event with the owner of a tokenID
   * @param tokenId - Token ID
   */
  ownerOf(tokenId: u256): Address {
    return new Address(
      bytesToString(call(this._origin, 'ownerOf', new Args().add(tokenId), 0)),
    );
  }

  /**
   * The addressTo becomes the owner of the next token (if current tokenID = 10, will mint 11 )
   * Check if max supply is not reached
   *
   * @param address - address that will receive the minted token
   */
  mint(address: string): void {
    call(this._origin, 'mint', new Args().add(address), 0);
  }

  /**
   * Approve an address to transfer a token
   *
   * @param tokenId - Token ID
   * @param address - address to approve
   *
   */
  approve(tokenId: u256, address: string): void {
    call(this._origin, 'approve', new Args().add(tokenId).add(address), 0);
  }

  // Approve for all

  /**
   * Approve an address to transfer all tokens
   *
   * @param address - address to approve
   * @param approved - true or false
   *
   * @remarks
   * This function is used to approve an address to transfer all tokens
   */
  setApprovalForAll(address: string, approved: bool): void {
    call(
      this._origin,
      'setApprovalForAll',
      new Args().add(address).add(approved),
      0,
    );
  }

  /**
   * Transfer a chosen token from the fromAddress to the toAddress.
   *
   * @param owner - address of the owner
   * @param recipient - address of the recipient
   * @param tokenId - Token ID
   *
   * @remarks caller must be an approved address
   *
   */
  transferFrom(owner: string, recipient: string, tokenId: u256): void {
    call(
      this._origin,
      'transferFrom',
      new Args().add(owner).add(recipient).add(tokenId),
      0,
    );
  }

  /**
   * Get the approved address(es) of a token
   *
   * @param tokenId - Token ID
   *
   * @returns an array of the approved address(es)
   *
   */
  getApproved(tokenId: u256): string {
    return bytesToString(
      call(this._origin, 'getApproved', new Args().add(tokenId), 0),
    );
  }
}
