// The entry file of your WebAssembly module.
import {
  Args,
  u64ToBytes,
  bytesToString,
  stringToBytes,
} from '@massalabs/as-types';
import {
  Address,
  Context,
  Storage,
  call,
  createSC,
  generateEvent,
  transferCoins,
} from '@massalabs/massa-as-sdk';

const ONE_UNIT = 10 ** 9;
const ONE_TENTH = 10 ** 8;

export const nftArrayKey = stringToBytes('nfts');
export const nftUserArrayKey = stringToBytes('nfts_users');
export const nftContractCodeKey = stringToBytes('nft_contract_code');

export const ownerKey = 'nft_owner_key';

export const userProfileKey = 'userProfile_';

export const marketplaceFeeKey = 'marketplaceFee_'; // In 1/1000th. A fee of 10 is 1%.
export const marketplaceOwnerKey = 'marketplaceOwner_';

export const sellOfferKey = 'sellOffer_';
export const saleHistoryKey = 'saleHistory_';

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param args - The arguments to the constructor containing the message to be logged
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) {
    return;
  }
  const args = new Args(binaryArgs);

  let nft_contract_code = args
    .nextFixedSizeArray<u8>()
    .expect('nft_contract_code argument is missing or invalid');
  const marketplaceOwner = args
    .nextString()
    .expect('marketplaceOwner argument is missing or invalid');
  const marketplaceFee = args
    .nextU64()
    .expect('marketplaceFee argument is missing or invalid');

  Storage.set(nftContractCodeKey, StaticArray.fromArray(nft_contract_code));
  Storage.set(nftArrayKey, new Args().add<Array<string>>([]).serialize());
  Storage.set(marketplaceOwnerKey, marketplaceOwner);
  Storage.set(marketplaceFeeKey, bytesToString(u64ToBytes(marketplaceFee)));
}

/*
ADMIN FEATURES
*/
export function setMarkeplaceFee(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const callerAddress = Context.caller();
  let marketplaceOwner = new Address(Storage.get(marketplaceOwnerKey));
  assert(
    callerAddress.toString() == marketplaceOwner.toString(),
    'Only marketplace owner can set the fee',
  );

  const marketplaceFee = args
    .nextU64()
    .expect('marketplaceFee argument is missing or invalid');

  Storage.set(marketplaceFeeKey, bytesToString(u64ToBytes(marketplaceFee)));
}

export function addCollections(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const callerAddress = Context.caller();
  let marketplaceOwner = new Address(Storage.get(marketplaceOwnerKey));
  assert(
    callerAddress.toString() == marketplaceOwner.toString(),
    'Only marketplace owner can manually add collections',
  );

  let nfts = new Args(Storage.get(nftArrayKey)).nextStringArray().unwrap();

  let addresses = args.nextStringArray().unwrap();
  for (let i = 0; i < addresses.length; i++) {
    if (nfts.indexOf(addresses[i].toString()) == -1) {
      nfts.push(addresses[i].toString());
    }
  }

  Storage.set(nftArrayKey, new Args().add<Array<string>>(nfts).serialize());
}

export function delCollections(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const callerAddress = Context.caller();
  let marketplaceOwner = new Address(Storage.get(marketplaceOwnerKey));
  assert(
    callerAddress.toString() == marketplaceOwner.toString(),
    'Only marketplace owner can manually delete collections',
  );
  let nfts = new Args(Storage.get(nftArrayKey)).nextStringArray().unwrap();

  let addresses = args.nextStringArray().unwrap();
  for (let i = 0; i < addresses.length; i++) {
    const index = nfts.indexOf(addresses[i]);
    if (index > -1) {
      nfts.splice(index, 1);
    }
  }

  Storage.set(nftArrayKey, new Args().add<Array<string>>(nfts).serialize());
}

/*
USER FEATURES
*/

export function addUserCollections(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const addr = args.nextString().unwrap();
  const callerAddress = Context.caller();
  const marketplaceOwner = new Address(Storage.get(marketplaceOwnerKey));
  assert(
    addr == marketplaceOwner.toString() || addr == callerAddress.toString(),
    'Only marketplace owner and target user can manually add user collections',
  );

  let key = stringToBytes(
    bytesToString(nftUserArrayKey) + callerAddress.toString(),
  );

  if (!Storage.has(key)) {
    Storage.set(key, new Args().add<Array<string>>([]).serialize());
  }

  let nfts_users = new Args(Storage.get(key))
    .nextStringArray()
    .expect('nftUserArray not set for callerAddress');

  const addresses = args.nextStringArray().unwrap();
  for (let i = 0; i < addresses.length; i++) {
    if (nfts_users.indexOf(addresses[i].toString()) == -1) {
      nfts_users.push(addresses[i].toString());
    }
  }

  if (addresses.length > 0) {
    generateEvent('[ICO_QUEST] LINK: ' + Context.caller().toString());
  }

  Storage.set(key, new Args().add<Array<string>>(nfts_users).serialize());
}

export function delUserCollections(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const addr = args.nextString().unwrap();
  const callerAddress = Context.caller();
  const marketplaceOwner = new Address(Storage.get(marketplaceOwnerKey));
  assert(
    addr == marketplaceOwner.toString() || addr == callerAddress.toString(),
    'Only marketplace owner and target user can manually delete user collections',
  );

  let key = stringToBytes(
    bytesToString(nftUserArrayKey) + callerAddress.toString(),
  );

  if (!Storage.has(key)) {
    return;
  }

  let nfts_users = new Args(Storage.get(key)).nextStringArray().unwrap();

  let addresses = args.nextStringArray().unwrap();

  for (let i = 0; i < addresses.length; i++) {
    const index = nfts_users.indexOf(addresses[i]);
    if (index > -1) {
      nfts_users.splice(index, 1);
    }
  }

  Storage.set(key, new Args().add<Array<string>>(nfts_users).serialize());
}

export function create_nft(args: StaticArray<u8>): void {
  let nft_contract_code = Storage.get(stringToBytes('nft_contract_code'));
  let addr = createSC(nft_contract_code);
  call(addr, 'delegated_constructor', new Args(args), 1 * ONE_UNIT);
  let nfts = new Args(Storage.get(nftArrayKey)).nextStringArray().unwrap();
  nfts.push(addr.toString());
  Storage.set(nftArrayKey, new Args().add<Array<string>>(nfts).serialize());
  generateEvent(`NFT created at ${addr.toString()}`);
  generateEvent(`CREATE: ${Context.caller().toString()}`);
}

export function register_nft(args: StaticArray<u8>): void {
  let nft_addr = new Args(args).nextString().unwrap();
  let nfts = new Args(Storage.get(nftArrayKey))
    .nextFixedSizeArray<string>()
    .unwrap();
  nfts.push(nft_addr);
  Storage.set(nftArrayKey, new Args().add(nfts).serialize());
}

export function sell_offer(argsSerialized: StaticArray<u8>): void {
  let args = new Args(argsSerialized);
  let nft_collection_addr = args.nextString().unwrap();
  let nft_token_id = args.nextU256().unwrap();
  let price = args.nextU64().unwrap();
  let expireIn = args.nextU64().unwrap();
  let expirationTime = Context.timestamp() + expireIn;

  let key = sellOfferKey + nft_collection_addr + '_' + nft_token_id.toString();
  assert(
    !Storage.has(key),
    `Sell offer already exist for ${nft_collection_addr}/${nft_token_id.toString()}`,
  );

  // verify that the nft exists (or is from user collection)
  let nfts = new Args(Storage.get(nftArrayKey)).nextStringArray().unwrap();

  let user_key = stringToBytes(
    bytesToString(nftUserArrayKey) + Context.caller().toString(),
  );
  if (Storage.has(user_key)) {
    const user_nfts = new Args(Storage.get(user_key))
      .nextStringArray()
      .unwrap();
    assert(
      nfts.indexOf(nft_collection_addr) > -1 ||
        user_nfts.indexOf(nft_collection_addr) > -1,
      `NFT collection ${nft_collection_addr} is not registered`,
    );
  } else {
    assert(
      nfts.indexOf(nft_collection_addr) > -1,
      `NFT collection ${nft_collection_addr} is not registered`,
    );
  }

  // verify that the caller is the NFT's owner
  let owner = bytesToString(
    call(
      new Address(nft_collection_addr),
      'nft1_ownerOf',
      new Args().add(nft_token_id),
      ONE_TENTH,
    ),
  );
  assert(
    owner == Context.caller().toString(),
    `You are not the owner of ${nft_collection_addr}/${nft_token_id.toString()}`,
  );
  Storage.set(
    key,
    Context.caller().toString() +
      '_' +
      price.toString() +
      '_' +
      expirationTime.toString(),
  );
  generateEvent(
    `Sell offer created for ${nft_collection_addr}/${nft_token_id.toString()} 
    for ${price.toString()}, expires at ${expirationTime.toString()}`,
  );
  generateEvent('[ICO_QUEST] SELL: ' + Context.caller().toString());
}

export function remove_sell_offer(argsSerialized: StaticArray<u8>): void {
  let args = new Args(argsSerialized);
  let nft_collection_addr = args.nextString().unwrap();
  let nft_token_id = args.nextU256().unwrap();
  let key = sellOfferKey + nft_collection_addr + '_' + nft_token_id.toString();
  assert(
    Storage.has(key),
    `Sell offer doesn't exist for ${nft_collection_addr}/${nft_token_id.toString()}`,
  );

  // verify that the nft exists (or is from user collection)
  let nfts = new Args(Storage.get(nftArrayKey)).nextStringArray().unwrap();

  let user_key = stringToBytes(
    bytesToString(nftUserArrayKey) + Context.caller().toString(),
  );
  if (Storage.has(user_key)) {
    const user_nfts = new Args(Storage.get(user_key))
      .nextStringArray()
      .unwrap();
    assert(
      nfts.indexOf(nft_collection_addr) > -1 ||
        user_nfts.indexOf(nft_collection_addr) > -1,
      `NFT collection ${nft_collection_addr} is not registered`,
    );
  } else {
    assert(
      nfts.indexOf(nft_collection_addr) > -1,
      `NFT collection ${nft_collection_addr} is not registered`,
    );
  }

  // verify that the caller is the NFT's owner
  let owner = new Args(
    call(
      new Address(nft_collection_addr),
      'nft1_ownerOf',
      new Args().add(nft_token_id),
      ONE_TENTH,
    ),
  )
    .nextString()
    .unwrap();
  assert(
    owner == Context.caller().toString(),
    `You are not the owner of ${nft_collection_addr}/${nft_token_id.toString()}`,
  );

  Storage.del(key);
  generateEvent(
    `Sell offer removed for ${nft_collection_addr}/${nft_token_id.toString()}`,
  );
  generateEvent(`REMOVE_SELL: ${Context.caller().toString()}`);
}

export function buy_nft(argsSerialized: StaticArray<u8>): void {
  let args = new Args(argsSerialized);
  let nft_collection_addr = args.nextString().unwrap();
  let nft_collection_addr_as_addr = new Address(nft_collection_addr);
  let ContextCallerStr = Context.caller().toString();

  let nft_token_id = args.nextU256().unwrap();
  let key = sellOfferKey + nft_collection_addr + '_' + nft_token_id.toString();

  let storageGet = Storage.get(key);
  let storageGetSplit = storageGet.split('_');
  let price = U64.parseInt(storageGetSplit[1]);
  let expirationTime = U64.parseInt(storageGetSplit[2]);
  assert(Context.timestamp() <= expirationTime, `Sell offer has expired`);
  assert(
    Context.transferredCoins() >= price,
    'Not enough sent coins to buy this NFT',
  );

  let owner = bytesToString(
    call(
      nft_collection_addr_as_addr,
      'nft1_ownerOf',
      new Args().add(nft_token_id),
      ONE_TENTH,
    ),
  );
  call(
    nft_collection_addr_as_addr,
    'nft1_transferFrom',
    new Args().add(owner).add(Context.caller().toString()).add(nft_token_id),
    1 * ONE_UNIT,
  );
  transferCoins(new Address(owner), price);
  Storage.del(key);
  let historyKey =
    saleHistoryKey + nft_collection_addr + '_' + nft_token_id.toString();
  Storage.set(
    historyKey,
    ContextCallerStr +
      '_' +
      price.toString() +
      '_' +
      Context.timestamp().toString(),
  );
  generateEvent('[ICO_QUEST] BUY: ' + ContextCallerStr);
}
