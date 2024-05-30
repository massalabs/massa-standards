import { Args } from "@massalabs/as-types";
import { Address } from "@massalabs/massa-as-sdk";

export function allowance(_args: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_args);
  const owner = args.mustNext<Address>("owner");
  const spender = args.mustNext<Address>("spender");
  FungibleToken.allowance(owner, spender).serialize();
}

export function approve(_args: StaticArray<u8>): void{
  const args = new Args(_args);
  const spender = args.mustNext<Address>("spender");
  const amount = args.mustNext<u64>("amount");
  FungibleToken.approve(spender, amount);
}

export function balanceOf(_args: StaticArray<u8>): StaticArray<u8> {
  const of = new Args(_args).mustNext<Address>("of");
  return new Args().add(FungibleToken.balanceOf(of)).serialize();
}

export function totalSupply(): StaticArray<u8> {
  return new Args().add(FungibleToken.totalSupply()).serialize();
}

export function transfer(_args: StaticArray<u8>): void{
  const args = new Args(_args);
  const to = args.mustNext<Address>("to");
  const amount = args.mustNext<u64>("amount");
  FungibleToken.transfer(to, amount);
}

export function transferFrom(_args: StaticArray<u8>): void{
  const args = new Args(_args);
  const from = args.mustNext<Address>("from");
  const to = args.mustNext<Address>("to");
  const amount = args.mustNext<u64>("amount");
  FungibleToken.transferFrom(from, to, amount);
}