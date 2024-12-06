import { Address, call } from '@massalabs/massa-as-sdk';
import {
  Args,
  NoArg,
  bytesToU256,
  bytesToString,
  byteToU8,
} from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';

/**
 * The Massa's standard token implementation wrapper.
 *
 * This class can be used to wrap a smart contract implementing
 * Massa standard token.
 * All the serialization/deserialization will handled here.
 *
 * ```typescript
 *  const coin = new MRC20Wrapper(scAddress);
 *  const coinName = coin.name();
 *  const bal = coin.balanceOf(myAddress);
 *  console.log(`balance: ${bal.value.toString()} of token: ${coinName}`);
 * ```
 */
export class MRC20Wrapper {
  _origin: Address;

  /**
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param at - Address of the smart contract. -
   */
  constructor(at: Address) {
    this._origin = at;
  }

  /**
   * Initializes the smart contract.
   *
   * @param name - Name of the token.
   * @param symbol - Symbol of the token.
   * @param decimals - Number of decimals of the token.
   * @param supply - Initial supply of the token.
   * @param coins - Number of coins to send to the smart contract.
   */
  init(
    name: string,
    symbol: string,
    decimals: u8,
    supply: u256,
    coins: u64 = 0,
  ): void {
    const args = new Args().add(name).add(symbol).add(decimals).add(supply);
    call(this._origin, 'constructor', args, coins);
  }

  /**
   * Returns the version of the smart contract.
   * This versioning is following the best practices defined in https://semver.org/.
   *
   * @returns
   */
  version(): string {
    return bytesToString(call(this._origin, 'version', NoArg, 0));
  }

  /**
   * Returns the name of the token.
   *
   * @returns name of the token.
   */
  name(): string {
    return bytesToString(call(this._origin, 'name', NoArg, 0));
  }

  /** Returns the symbol of the token.
   *
   * @returns token symbol.
   */
  symbol(): string {
    return bytesToString(call(this._origin, 'symbol', NoArg, 0));
  }

  /**
   * Returns the number of decimals of the token.
   *
   * @returns number of decimals.
   */
  decimals(): u8 {
    const res = call(this._origin, 'decimals', NoArg, 0);
    return byteToU8(res);
  }

  /**
   * Returns the total token supply.
   *
   * The number of tokens that were initially minted.
   *
   * @returns number of minted tokens.
   */
  totalSupply(): u256 {
    return bytesToU256(call(this._origin, 'totalSupply', NoArg, 0));
  }

  /**
   * Returns the balance of an account.
   *
   * @param account -
   */
  balanceOf(account: Address): u256 {
    return bytesToU256(
      call(this._origin, 'balanceOf', new Args().add(account), 0),
    );
  }

  /**
   * Transfers tokens from the caller's account to the recipient's account.
   *
   * @param toAccount -
   * @param nbTokens -
   * @param coins -
   */
  transfer(toAccount: Address, nbTokens: u256, coins: u64 = 0): void {
    call(
      this._origin,
      'transfer',
      new Args().add(toAccount).add(nbTokens),
      coins,
    );
  }

  /**
   * Returns the allowance set on the owner's account for the spender.
   *
   * @param ownerAccount -
   * @param spenderAccount -
   */
  allowance(ownerAccount: Address, spenderAccount: Address): u256 {
    return bytesToU256(
      call(
        this._origin,
        'allowance',
        new Args().add(ownerAccount).add(spenderAccount),
        0,
      ),
    );
  }

  /**
   * Increases the allowance of the spender on the owner's account
   * by the given amount.
   *
   * This function can only be called by the owner.
   *
   * @param spenderAccount -
   * @param nbTokens -
   * @param coins -
   */
  increaseAllowance(
    spenderAccount: Address,
    nbTokens: u256,
    coins: u64 = 0,
  ): void {
    call(
      this._origin,
      'increaseAllowance',
      new Args().add(spenderAccount).add(nbTokens),
      coins,
    );
  }

  /**
   * Decreases the allowance of the spender on the owner's account
   * by the given amount.
   *
   * This function can only be called by the owner.
   * Coins is left to zero as this function does not need storage entry creation.
   *
   * @param spenderAccount -
   * @param nbTokens -
   */
  decreaseAllowance(spenderAccount: Address, nbTokens: u256): void {
    call(
      this._origin,
      'decreaseAllowance',
      new Args().add(spenderAccount).add(nbTokens),
      0,
    );
  }

  /**
   * Transfers token ownership from the owner's account to
   * the recipient's account using the spender's allowance.
   *
   * This function can only be called by the spender.
   * This function is atomic:
   * - both allowance and transfer are executed if possible;
   * - or if allowance or transfer is not possible, both are discarded.
   *
   * @param ownerAccount -
   * @param recipientAccount -
   * @param nbTokens -
   */
  transferFrom(
    ownerAccount: Address,
    recipientAccount: Address,
    nbTokens: u256,
    coins: u64 = 0,
  ): void {
    call(
      this._origin,
      'transferFrom',
      new Args().add(ownerAccount).add(recipientAccount).add(nbTokens),
      coins,
    );
  }

  /**
   * Mint an amount of nbTokens tokens from to the toAccount address .
   *
   * @param toAccount -
   * @param nbTokens -
   * @param coins -
   */
  mint(toAccount: Address, nbTokens: u256, coins: u64 = 0): void {
    call(this._origin, 'mint', new Args().add(toAccount).add(nbTokens), coins);
  }

  /**
   * Burn nbTokens on the caller address
   *
   * Coins is left to zero as this function does not need storage entry creation.
   *
   * @param nbTokens -
   */
  burn(nbTokens: u256): void {
    call(this._origin, 'burn', new Args().add(nbTokens), 0);
  }
}
