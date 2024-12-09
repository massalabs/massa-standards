import { u256 } from 'as-bignum/assembly';
import { mrc20Constructor } from '../MRC20';

export function constructor(): void {
  mrc20Constructor('MassaToken', 'MT', 18, u256.fromU64(1010101010));
}

export {
  name,
  symbol,
  totalSupply,
  decimals,
  balanceOf,
  transfer,
  allowance,
  increaseAllowance,
  decreaseAllowance,
  transferFrom,
} from '../MRC20';
