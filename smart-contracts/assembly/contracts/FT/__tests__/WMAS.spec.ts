import {
  Address,
  changeCallStack,
  resetStorage,
  setDeployContext,
  mockBalance,
  mockTransferredCoins,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  stringToBytes,
  u8toByte,
  bytesToU256,
  u256ToBytes,
} from '@massalabs/as-types';
import {
  transfer,
  balanceOf,
  totalSupply,
  name,
  symbol,
  decimals,
  version,
  transferFrom,
  allowance,
  increaseAllowance,
  decreaseAllowance,
  constructor,
  VERSION,
  deposit,
  withdraw,
} from '../WMAS';
import { u256 } from 'as-bignum/assembly';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';
const user1Address = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const user2Address = 'AU12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8';
const user3Address = 'AUDeadBeefDeadBeefDeadBeefDeadBeefDeadBeefDeadBOObs';

const TOKEN_NAME = 'TOKEN_NAME';
const TOKEN_SYMBOL = 'TKN';
const DECIMALS: u8 = 9;
const TOTAL_SUPPLY = u256.Zero;

const amount = 1_000_000_000_000;
const storageCost = computeStorageCost(new Address(user2Address));
const amountMinusStorageCost = amount - storageCost;
const tooLargeAmount = 2*amount;

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

function computeStorageCost(receiver: Address): u64 {
  let cost = 0;
  cost = 400_000;
  cost += 100_000 * (7 + receiver.toString().length);
  cost += 3_200_000;
  return cost;
}

beforeEach(() => {
  resetStorage();
  setDeployContext(user1Address);
  constructor(
    new Args()
      .add(TOKEN_NAME)
      .add(TOKEN_SYMBOL)
      .add(DECIMALS)
      .add(TOTAL_SUPPLY)
      .serialize(),
  );
});

describe('deposit', () => {
  it('should deposit MAS', () => {
    switchUser(user2Address);
    mockTransferredCoins(amount);
    deposit([]);
    const balance = balanceOf(new Args().add(user2Address).serialize());
    expect(balance).toStrictEqual(
      u256ToBytes(u256.fromU64(amountMinusStorageCost)),
    );
  });
  it('should not charge for storage if balance already exists', () => {
    switchUser(user2Address);
    mockTransferredCoins(amount);
    deposit([]);
    mockTransferredCoins(amount);
    deposit([]);
    expect(balanceOf(new Args().add(user2Address).serialize())).toStrictEqual(
      u256ToBytes(u256.fromU64(amount+amountMinusStorageCost)),
    );
  });
  throws('should throw if transferred amount is not enough to cover storage cost', () => {
    switchUser(user3Address);
    mockTransferredCoins(storageCost);
    deposit([]);
  });
  it('should deposit minimum amount', () => {
    switchUser(user3Address);
    mockTransferredCoins(storageCost + 1);
    deposit([]);
    expect(balanceOf(new Args().add(user3Address).serialize())).toStrictEqual(
      u256ToBytes(u256.One),
    );
  });
  throws('should throw on underflow', () => {
    switchUser(user3Address);
    mockTransferredCoins(storageCost-1);
    deposit([]);
  });
});

describe('withdraw', () => {
  beforeEach(() => {
    switchUser(user2Address);
    mockTransferredCoins(amount);
    deposit([]);
    mockBalance(contractAddr, amount);
  });

  it('should withdraw MAS', () => {
    withdraw(new Args().add(amountMinusStorageCost).add(user2Address).serialize());
    expect(balanceOf(new Args().add(user2Address).serialize())).toStrictEqual(
      u256ToBytes(u256.Zero),
    );
  });
  throws('should throw if amount is missing', () => {
    withdraw(new Args().add(user2Address).serialize());
  });
  throws('should throw if recipient is missing', () => {
    withdraw(new Args().add(1_000_000_000_000).serialize());
  });
  throws('should throw if amount is greater than balance', () => {
    withdraw(new Args().add(tooLargeAmount).add(user2Address).serialize());
  });
  throws('should throw if no balance', () => {
    switchUser(user1Address);
    withdraw(new Args().add(amount).add(user1Address).serialize());
  });
});