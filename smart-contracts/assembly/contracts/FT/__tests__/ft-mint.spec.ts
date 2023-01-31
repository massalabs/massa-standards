import {
  Address,
  changeCallStack,
  resetStorage,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToString,
  stringToBytes,
  u64ToBytes,
  u8toByte,
} from '@massalabs/as-types';
import { mint } from '../token-mint';
import {
  balanceOf,
  constructor,
  decimals,
  name,
  symbol,
  totalSupply,
  version,
} from '../token';
import { ownerAddress } from '../../utils/ownership';

// Those addresses have been generated randomly, user1 & contractAddressERC20Mint match with addresses in vm-mock
const contractAddressERC20Mint = new Address(
  'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT',
);
const user1Address = new Address(
  'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq',
);

const user2Address = new Address(
  'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8',
);

resetStorage();
changeCallStack(
  user1Address.toString() + ' , ' + contractAddressERC20Mint.toString(),
);

const TOKEN_NAME = 'MINTABLE_TOKEN';
const TOKEN_SYMBOL = 'MTKN';
const DECIMALS: u8 = 2;
const TOTAL_SUPPLY: u64 = 10000;

constructor(
  new Args()
    .add(TOKEN_NAME)
    .add(TOKEN_SYMBOL)
    .add(DECIMALS)
    .add(TOTAL_SUPPLY)
    .serialize(),
);

describe('ERC20 MINT - Initialization', () => {
  test('total supply is properly initialized', () => {
    expect(totalSupply([])).toStrictEqual(u64ToBytes(TOTAL_SUPPLY));
  });

  test('token name is properly initialized', () => {
    expect(name([])).toStrictEqual(stringToBytes(TOKEN_NAME));
  });

  test('symbol is properly initialized', () => {
    expect(symbol([])).toStrictEqual(stringToBytes(TOKEN_SYMBOL));
  });

  test('decimals is properly initialized', () => {
    expect(decimals([])).toStrictEqual(u8toByte(DECIMALS));
  });

  test('version is properly initialized', () => {
    expect(version([])).toStrictEqual(stringToBytes('0.0.0'));
  });

  test('owner is properly initialized', () => {
    expect(bytesToString(ownerAddress([]))).toStrictEqual(
      user1Address.toString(),
    );
  });
});

const mintAmount: u64 = 5000;

describe('Mint ERC20 to U2', () => {
  test('Should mint ERC20', () => {
    mint(new Args().add(user2Address.toString()).add(mintAmount).serialize());
    // check balance of U2
    expect(
      balanceOf(new Args().add(user2Address.toString()).serialize()),
    ).toStrictEqual(u64ToBytes(mintAmount));

    // check totalSupply update
    expect(totalSupply([])).toStrictEqual(
      u64ToBytes(mintAmount + TOTAL_SUPPLY),
    );
  });
});

describe('Fails mint ERC20', () => {
  throws('Should overflow ERC20', () =>
    mint(
      new Args().add(user2Address.toString()).add(U64.MAX_VALUE).serialize(),
    ),
  );

  changeCallStack(
    user2Address.toString() + ' , ' + contractAddressERC20Mint.toString(),
  );

  throws('Should fail because the owner is not the tx emitter', () =>
    mint(new Args().add(user1Address.toString()).add(u64(5000)).serialize()),
  );

  test("Should check totalSupply didn't change", () => {
    expect(totalSupply([])).toStrictEqual(
      u64ToBytes(mintAmount + TOTAL_SUPPLY),
    );
  });
});
