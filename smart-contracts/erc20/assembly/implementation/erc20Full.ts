import { ERC20Core } from "../interfaces/erc20Core";
import { Args } from "@massalabs/as-types";
import { MapManager, 
  KeySequenceManager, 
  KeyIncrementer, ConstantManager, Address, Context, createEvent } from "@massalabs/massa-as-sdk";
import { u256 } from "as-bignum/assembly";

export const EVENT_PREFIX = "ERC20";
export const EVENT_ERR_INSUFFICIENT_BALANCE = "transfer amount exceeds balance";
export const EVENT_ERR_INSUFFICIENT_ALLOWANCE = "transfer amount exceeds allowance";
export const EVENT_TRANSFER = "Transfer";
export const EVENT_APPROVAL = "Approval";

@inline
function triggerTransferEvent(from: Address, to: Address, value: u256): void {
  createEvent(`${EVENT_PREFIX}: ${EVENT_TRANSFER}`, [from.toString(), to.toString(), value.toString()]);
}

export class ERC20 implements ERC20Core {
  private _totalSupply:     ConstantManager<u256>;
  public balances: MapManager<Address, u256>;
  public allowances: MapManager<StaticArray<u8>, u256>;

  constructor(totalSupply: u256, keyManager: KeySequenceManager = new KeyIncrementer<u8>(0)) {
    this._totalSupply = new ConstantManager<u256>(keyManager);
    this.balances = new MapManager<Address, u256>(keyManager);
    this.allowances = new MapManager<StaticArray<u8>, u256>(keyManager);

    this._totalSupply.set(totalSupply);
  }

  totalSupply(): u256 {
    return this._totalSupply.mustValue();
  }

  balanceOf(address: Address): u256 {
    return this.balances.value(address).unwrapOrDefault();
  }

  transfer(to: Address, value: u256): void {
    const from = Context.caller();
    const balance = this.balanceOf(from);
    assert(balance >= value, `${EVENT_PREFIX}: ${EVENT_ERR_INSUFFICIENT_BALANCE}`);
    this.balances.set(from, balance - value);
    this.balances.set(to, this.balanceOf(to) + value);
    triggerTransferEvent(from, to, value);
  }

  transferFrom(from: Address, to: Address, value: u256): void {
    const caller = Context.caller();
    const allowance = this.allowance(from, caller);
    assert(allowance >= value, `${EVENT_PREFIX}: ${EVENT_ERR_INSUFFICIENT_ALLOWANCE}`);
    this.approve(caller, allowance - value);
    this.transfer(to, value);
    triggerTransferEvent(from, to, value);
  }

  approve(spender: Address, value: u256): void {
    const from = Context.caller();
    const storageKey = new Args().add(from).add(spender).serialize();
    this.allowances.set(storageKey, value);
    createEvent(`${EVENT_PREFIX}: ${EVENT_APPROVAL}`, [from.toString(), spender.toString(), value.toString()]);
  }

  allowance(owner: Address, spender: Address): u256 {
    const storageKey = new Args().add(owner).add(spender).serialize();
    return this.allowances.value(storageKey).unwrapOrDefault();
  }
}
