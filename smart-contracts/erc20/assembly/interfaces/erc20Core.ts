import { u256 } from "as-bignum/assembly";
import { Address } from "@massalabs/massa-as-sdk";

export interface ERC20Core {
    allowance(owner: Address, spender: Address): u256;
    approve(spender: Address, value: u256): void;
    balanceOf(address: Address): u256;
    // decimals(): u8;
    // name(): string;
    // symbol(): string;
    totalSupply(): u256;
    transfer(to: Address, value: u256): void;
    transferFrom(from: Address, to: Address, value: u256): void;
}
