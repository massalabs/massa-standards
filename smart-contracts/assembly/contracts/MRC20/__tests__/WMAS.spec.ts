import {
  Address,
  changeCallStack,
  resetStorage,
  setDeployContext,
  mockBalance,
  mockTransferredCoins,
} from '@massalabs/massa-as-sdk';
import { Args, u256ToBytes } from '@massalabs/as-types';
import {
  balanceOf,
  mrc20Constructor,
  deposit,
  withdraw,
  computeMintStorageCost,
  transfer,
  transferFrom,
  increaseAllowance,
} from '../WMAS';
import { u256 } from 'as-bignum/assembly';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';
const user1Address = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const user2Address = 'AU12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8';
const user3Address = 'AUDeadBeefDeadBeefDeadBeefDeadBeefDeadBeefDeadBOObs';

const amount = 1_000_000_000_000;
const storageCost = computeMintStorageCost(new Address(user2Address));
const amountMinusStorageCost = amount - storageCost;
const transferAmount = u256.fromU64(1_000);

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeEach(() => {
  resetStorage();
  setDeployContext(user1Address);
  mrc20Constructor('Wrapped MAS', 'WMAS', 9, u256.Zero);
});

describe('deposit', () => {
  it('should deposit MAS', () => {
    switchUser(user2Address);
    mockBalance(user2Address, amount);
    mockTransferredCoins(amount);
    deposit([]);
    const balance = balanceOf(new Args().add(user2Address).serialize());
    expect(balance).toStrictEqual(
      u256ToBytes(u256.fromU64(amountMinusStorageCost)),
    );
  });
  it('should not charge for storage for later deposits', () => {
    switchUser(user2Address);
    mockBalance(user2Address, amount);
    mockTransferredCoins(amount);
    deposit([]);
    mockBalance(user2Address, amount);
    mockTransferredCoins(amount);
    deposit([]);
    expect(balanceOf(new Args().add(user2Address).serialize())).toStrictEqual(
      u256ToBytes(u256.fromU64(amount + amountMinusStorageCost)),
    );
  });
  it('should reject operation not covering storage cost', () => {
    switchUser(user3Address);
    mockBalance(user3Address, storageCost);
    mockTransferredCoins(storageCost);
    expect(() => {
      deposit([]);
    }).toThrow('Transferred amount is not enough to cover storage cost');
  });
  it('should deposit minimal amount', () => {
    switchUser(user3Address);
    mockBalance(user3Address, storageCost + 1);
    mockTransferredCoins(storageCost + 1);
    deposit([]);
    expect(balanceOf(new Args().add(user3Address).serialize())).toStrictEqual(
      u256ToBytes(u256.One),
    );
  });
});

describe('withdraw', () => {
  beforeEach(() => {
    switchUser(user2Address);
    mockBalance(user2Address, amount);
    mockTransferredCoins(amount);
    deposit([]);
    mockBalance(contractAddr, amount);
  });

  it('should withdraw MAS', () => {
    withdraw(
      new Args().add(amountMinusStorageCost).add(user2Address).serialize(),
    );
    expect(balanceOf(new Args().add(user2Address).serialize())).toStrictEqual(
      u256ToBytes(u256.Zero),
    );
  });
  it('should throw if amount is missing', () => {
    expect(() => {
      withdraw(new Args().add(user2Address).serialize());
    }).toThrow('amount is missing');
  });
  it('should throw if recipient is missing', () => {
    expect(() => {
      withdraw(new Args().add(amount).serialize());
    }).toThrow('recipient is missing');
  });
  it('should throw if amount is greater than balance', () => {
    expect(() => {
      withdraw(
        new Args()
          .add(2 * amount)
          .add(user2Address)
          .serialize(),
      );
    }).toThrow('Requested burn amount causes an underflow');
  });
  it('should reject non-depositor', () => {
    switchUser(user1Address);
    expect(() => {
      withdraw(new Args().add(amount).add(user1Address).serialize());
    }).toThrow('Requested burn amount causes an underflow');
  });
});

describe('transfer', () => {
  beforeEach(() => {
    // Give user2 some WMAS to transfer around.
    switchUser(user2Address);
    mockBalance(user2Address, amount);
    mockTransferredCoins(amount);
    deposit([]);
    mockTransferredCoins(0);
  });

  it('should transfer WMAS to another account', () => {
    transfer(new Args().add(user1Address).add(transferAmount).serialize());
    expect(balanceOf(new Args().add(user1Address).serialize())).toStrictEqual(
      u256ToBytes(transferAmount),
    );
  });

  it('should transfer WMAS when coins are attached to cover storage', () => {
    // Attaching coins is what a caller must do when the recipient's balance
    // entry does not exist yet. The excess is refunded via transferRemaining.
    mockBalance(user2Address, storageCost);
    mockTransferredCoins(storageCost);
    transfer(new Args().add(user1Address).add(transferAmount).serialize());
    expect(balanceOf(new Args().add(user1Address).serialize())).toStrictEqual(
      u256ToBytes(transferAmount),
    );
  });

  it('should transferFrom WMAS using an allowance', () => {
    increaseAllowance(
      new Args().add(user1Address).add(transferAmount).serialize(),
    );
    switchUser(user1Address);
    transferFrom(
      new Args()
        .add(user2Address)
        .add(user3Address)
        .add(transferAmount)
        .serialize(),
    );
    expect(balanceOf(new Args().add(user3Address).serialize())).toStrictEqual(
      u256ToBytes(transferAmount),
    );
  });
});
