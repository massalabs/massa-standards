import { Args } from '@massalabs/as-types';
import { Address, call } from '@massalabs/massa-as-sdk';
import { TokenWrapper } from './wrapper';
import { u256 } from 'as-bignum/assembly/integer/u256';

export class IWMAS extends TokenWrapper {
  init(
    name: string = 'Wrapped Massa',
    symbol: string = 'WMAS',
    decimals: u8 = 9,
    supply: u256 = u256.Zero,
  ): void {
    super.init(name, symbol, decimals, supply);
  }

  deposit(value: u64): void {
    call(this._origin, 'deposit', new Args(), value);
  }

  withdraw(value: u64, to: Address): void {
    call(this._origin, 'withdraw', new Args().add(value).add(to), 0);
  }
}
