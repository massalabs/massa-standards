import { Address, call } from '@massalabs/massa-as-sdk';
import { Args, NoArg, bytesToU64, bytesToString } from '@massalabs/as-types';

/**
 * The Massa's standard token implementation wrapper.
 *
 * This class can be used to wrap a smart contract implementing
 * Massa standard token.
 * All the serialization/deserialization will handled here.
 *
 * ```typescript
 *  const coin = new TokenWrapper(scAddress);
 *  const coinName = coin.name();
 *  const bal = coin.balanceOf(myAddress);
 *  console.log(`balance: ${bal.value.toString()} of token: ${coinName}`);
 * ```
 */
export class TokenWrapper {
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
   * Returns the total token supply.
   *
   * The number of tokens that were initially minted.
   *
   * @returns number of minted tokens.
   */
  totalSupply(): u64 {
    return bytesToU64(call(this._origin, 'totalSupply', NoArg, 0));
  }

  /**
   * Returns the balance of an account.
   *
   * @param account -
   */
  balanceOf(account: Address): u64 {
    return bytesToU64(
      call(this._origin, 'balanceOf', new Args().add(account._value), 0),
    );
  }

  /**
   * Transfers tokens from the caller's account to the recipient's account.
   *
   * @param toAccount -
   * @param nbTokens -
   */
  transfer(toAccount: Address, nbTokens: u64): void {
    call(
      this._origin,
      'transfer',
      new Args().add(toAccount._value).add(nbTokens),
      0,
    );
  }

  /**
   * Returns the allowance set on the owner's account for the spender.
   *
   * @param ownerAccount -
   * @param spenderAccount -
   */
  allowance(ownerAccount: Address, spenderAccount: Address): u64 {
    return bytesToU64(
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
   */
  increaseAllowance(spenderAccount: Address, nbTokens: u64): void {
    call(
      this._origin,
      'increaseAllowance',
      new Args().add(spenderAccount).add(nbTokens),
      0,
    );
  }

  /**
   * Decreases the allowance of the spender on the owner's account
   * by the given amount.
   *
   * This function can only be called by the owner.
   *
   * @param spenderAccount -
   * @param nbTokens -
   */
  decreaseAllowance(spenderAccount: Address, nbTokens: u64): void {
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
    nbTokens: u64,
  ): void {
    call(
      this._origin,
      'transferFrom',
      new Args().add(ownerAccount).add(recipientAccount).add(nbTokens),
      0,
    );
  }

  /**
   * Mint an amount of nbTokens tokens from to the toAccount address .
   *
   * @param toAccount -
   * @param nbTokens -
   */
  mint(toAccount: Address, nbTokens: u64): void {
    call(this._origin, 'mint', new Args().add(toAccount).add(nbTokens), 0);
  }

  /**
   * Burn nbTokens on the caller address
   *
   * @param nbTokens -
   */
  burn(nbTokens: u64): void {
    call(this._origin, 'burn', new Args().add(nbTokens), 0);
  }
}
