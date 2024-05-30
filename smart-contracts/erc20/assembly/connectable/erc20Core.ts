import { Address, call } from "@massalabs/massa-as-sdk";
import { ERC20Core } from "../interfaces/erc20Core";
import { u256 } from "as-bignum";
import { Args } from "@massalabs/as-types";

export class ERC20CoreImpl { // implements ERC20Core {
  constructor(public sc: Address) {}

  allowance(owner: Address, spender: Address, coins: u64 = 0): u256 {
    const args = new Args().add(owner).add(spender);
    const response = call(this.sc, 'allowance', args, coins);
    return new Args(response).mustNext<u256>("allowance");
  }

}