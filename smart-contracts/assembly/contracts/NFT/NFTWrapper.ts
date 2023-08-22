import { Address, Context, call } from '@massalabs/massa-as-sdk';
import {
  Args,
  NoArg,
  bytesToString,
  bytesToU256,
  bytesToU32,
} from '@massalabs/as-types';
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
export class NFT1Wrapper {
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
   * Returns the NFT's name
   */
  name(): string {
    return bytesToString(
      call(this._origin, 'nft1_name', NoArg, Context.transferredCoins()),
    );
  }
  /**
   * Returns the NFT's symbol
   */
  symbol(): string {
    return bytesToString(
      call(this._origin, 'nft1_symbol', NoArg, Context.transferredCoins()),
    );
  }

  /**
   * Returns the token URI (external link written in NFT where pictures or others are stored)
   * @param tokenId - Token ID
   */
  tokenURI(tokenId: u256): string {
    return bytesToString(
      call(
        this._origin,
        'nft1_tokenURI',
        new Args().add(tokenId),
        Context.transferredCoins(),
      ),
    );
  }

  /**
   * Set a token URI (external link written in NFT where pictures or others are stored).
   * If not set the tokenURI will be the baseURI + tokenId
   */
  setTokenURI(tokenId: u256, tokenURI: string): void {
    call(
      this._origin,
      'nft1_setTokenURI',
      new Args().add(tokenId).add(tokenURI),
      Context.transferredCoins(),
    );
  }

  /**
   * Returns the base URI (external link written in NFT where pictures or others a stored)
   */
  baseURI(): string {
    return bytesToString(
      call(this._origin, 'nft1_baseURI', NoArg, Context.transferredCoins()),
    );
  }

  /**
   * Returns the max supply
   */
  totalSupply(): u256 {
    return bytesToU256(
      call(this._origin, 'nft1_totalSupply', NoArg, Context.transferredCoins()),
    );
  }

  /**
   * Returns the current counter, if 10 NFT minted, returns 10.
   */
  currentSupply(): u256 {
    return bytesToU256(
      call(
        this._origin,
        'nft1_currentSupply',
        NoArg,
        Context.transferredCoins(),
      ),
    );
  }

  /**
   * Returns the owner of a tokenID
   * @param tokenId - Token ID
   */
  ownerOf(tokenId: u256): Address {
    return new Address(
      bytesToString(
        call(
          this._origin,
          'nft1_ownerOf',
          new Args().add(tokenId),
          Context.transferredCoins(),
        ),
      ),
    );
  }

  /**
   * Returns the balance of an address
   * @param address - address to check
   */
  balanceOf(address: string): u256 {
    return bytesToU256(
      call(
        this._origin,
        'nft1_balanceOf',
        new Args().add(address),
        Context.transferredCoins(),
      ),
    );
  }

  /**
   * The address becomes the owner of the next token (if current tokenID = 10, will mint 11 )
   * Check if max supply is not reached
   *
   * @param address - address that will receive the minted token
   */
  mint(address: string): void {
    call(
      this._origin,
      'nft1_mint',
      new Args().add(address),
      Context.transferredCoins(),
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
      'nft1_transferFrom',
      new Args().add(owner).add(recipient).add(tokenId),
      Context.transferredCoins(),
    );
  }

  /**
   * Approve an address to transfer a token
   *
   * @param tokenId - Token ID
   * @param address - address to approve
   *
   */
  approve(tokenId: u256, address: string): void {
    call(
      this._origin,
      'nft1_approve',
      new Args().add(tokenId).add(address),
      Context.transferredCoins(),
    );
  }

  /**
   * Get the approved address of a token
   *
   * @param tokenId - Token ID
   *
   * @returns the approved address if there is one else ''
   *
   */
  getApproved(tokenId: u256): string {
    return bytesToString(
      call(
        this._origin,
        'nft1_getApproved',
        new Args().add(tokenId),
        Context.transferredCoins(),
      ),
    );
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
      'nft1_setApprovalForAll',
      new Args().add(address).add(approved),
      Context.transferredCoins(),
    );
  }

  /**
   * Return true or false if the address is approved for all or not
   * @param owner - address of the owner of the collection
   * @param operator - address of the operator
   */
  isApprovedForAll(owner: string, operator: string): bool {
    let res = bytesToU32(
      call(
        this._origin,
        'nft1_isApprovedForAll',
        new Args().add(owner).add(operator),
        Context.transferredCoins(),
      ),
    );
    if (res === 1) {
      return true;
    } else {
      return false;
    }
  }
}
