// import { Address, mockScCall } from '@massalabs/massa-as-sdk';
// import { NFTWrapper } from '../NFTWrapper';
// import { stringToBytes, u64ToBytes } from '@massalabs/as-types';

// describe('NFT wrapper', () => {
//   test('demonstrative test', () => {
//     const NFTaddr = new Address(
//       'A1C5bqToGpzCg3K4yQkuto69KhxcC5AtrsA11zyuC3cd1QeHmgU',
//     );
//     const myAddress = new Address(
//       'A1qDAxGJ387ETi9JRQzZWSPKYq4YPXrFvdiE4VoXUaiAt38JFEC',
//     );
//     const NFT = new NFTWrapper(NFTaddr);
//     mockScCall(stringToBytes('NFT name'));
//     NFT.name();
//     mockScCall(stringToBytes('NFT'));
//     NFT.symbol();
//     mockScCall(stringToBytes('test.massa/'));
//     NFT.baseURI();
//     mockScCall(stringToBytes('test.massa/2'));
//     NFT.tokenURI(2);
//     mockScCall(u64ToBytes(3));
//     NFT.totalSupply();
//     for (let i = 0; i < 3; i++) {
//       mockScCall(stringToBytes('toto'));
//       NFT.mint(myAddress.toString());
//     }
//     mockScCall(u64ToBytes(3));
//     NFT.currentSupply();
//     mockScCall(stringToBytes(myAddress.toString()));
//     NFT.ownerOf(1);
//     mockScCall([]); // mocked calls need a mocked value, this may change is the future
//     NFT.transfer('1x', 1);
//     mockScCall(stringToBytes(myAddress.toString()));
//     NFT.ownerOf(1);
//   });
// });
