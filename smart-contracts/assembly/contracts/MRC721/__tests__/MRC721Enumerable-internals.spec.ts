import { resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import { u256 } from 'as-bignum/assembly';
import {
  _update,
  _balanceOf,
  _totalSupply,
  _constructor,
  _ownerOf,
  _transferFrom,
  _decreaseTotalSupply,
  _increaseTotalSupply,
} from '../enumerable/MRC721Enumerable-internals';
import { getOwnedTokens } from './helpers';

const caller = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const owner1 = caller;
const owner2 = 'AU178qZCfaNXkz9tQiXJcVfAEnYGJ27UoNtFFJh3BiT8jTfY8P2D';
const zeroAddress = '';
const tokenIds = [
  u256.fromU32(1),
  u256.fromU32(2),
  u256.fromU32(3),
  u256.fromU32(4),
  u256.fromU32(5),
];

const NFTName = 'MASSA_NFT';
const NFTSymbol = 'NFT';

function mint(to: string, tokenId: u256): void {
  _update(to, tokenId, zeroAddress);
}

function transfer(from: string, to: string, tokenId: u256): void {
  _update(to, tokenId, from);
}

function burn(owner: string, tokenId: u256): void {
  _update(zeroAddress, tokenId, owner);
}

describe('NFT Enumerable Internals', () => {
  beforeEach(() => {
    resetStorage();
    setDeployContext(caller);
    _constructor(NFTName, NFTSymbol);
  });

  describe('Initialization', () => {
    it('should have zero total supply initially', () => {
      expect(_totalSupply()).toStrictEqual(u256.Zero);
    });
  });

  describe('Total Supply Management', () => {
    it('should update total supply when token is minted', () => {
      mint(owner1, tokenIds[0]);
      expect(_totalSupply()).toStrictEqual(u256.One);
    });

    it('should update total supply when token is burned', () => {
      mint(owner1, tokenIds[0]);
      expect(_totalSupply()).toStrictEqual(u256.One);
      burn(owner1, tokenIds[0]);
      expect(_totalSupply()).toStrictEqual(u256.Zero);
    });

    it('should not allow total supply to exceed u256.Max', () => {
      // Set total supply to u256.Max - 1
      // @ts-ignore
      const nearMaxSupply = u256.Max - u256.One;
      // @ts-ignore
      _increaseTotalSupply(nearMaxSupply);
      // @ts-ignore
      expect(_totalSupply()).toStrictEqual(nearMaxSupply);

      // Mint one more token should succeed (totalSupply = u256.Max)
      mint(owner1, tokenIds[0]);
      expect(_totalSupply()).toStrictEqual(u256.Max);

      // Minting another token should fail due to overflow
      expect(() => {
        _increaseTotalSupply(u256.One);
      }).toThrow('Total supply overflow'); // Ensure your contract throws this exact error
    });

    it('should not allow total supply to underflow', () => {
      // Ensure total supply is zero
      expect(_totalSupply()).toStrictEqual(u256.Zero);

      // Attempt to decrease supply by 1 should fail
      expect(() => {
        _decreaseTotalSupply(u256.One);
      }).toThrow('Total supply underflow'); // Ensure your contract throws this exact error

      // Set total supply to 1
      _increaseTotalSupply(u256.One);
      expect(_totalSupply()).toStrictEqual(u256.One);

      // Decrease supply by 1 should succeed
      _decreaseTotalSupply(u256.One);
      expect(_totalSupply()).toStrictEqual(u256.Zero);

      // Attempt to decrease supply by another 1 should fail
      expect(() => {
        _decreaseTotalSupply(u256.One);
      }).toThrow('Total supply underflow'); // Ensure your contract throws this exact error
    });
  });

  describe('Owner Token Enumeration', () => {
    it('should return correct balances and owned tokens after minting', () => {
      mint(owner1, tokenIds[0]);
      mint(owner1, tokenIds[1]);
      mint(owner2, tokenIds[2]);

      expect(_balanceOf(owner1)).toStrictEqual(u256.fromU32(2));
      expect(_balanceOf(owner2)).toStrictEqual(u256.One);

      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(2);
      expect(owner1Tokens).toContainEqual(tokenIds[0]);
      expect(owner1Tokens).toContainEqual(tokenIds[1]);

      const owner2Tokens = getOwnedTokens(owner2);
      expect(owner2Tokens.length).toBe(1);
      expect(owner2Tokens).toContainEqual(tokenIds[2]);
    });

    it('should update balances and tokens after transfer', () => {
      mint(owner1, tokenIds[0]);
      mint(owner1, tokenIds[1]);

      transfer(owner1, owner2, tokenIds[0]);

      expect(_balanceOf(owner1)).toStrictEqual(u256.One);
      expect(_balanceOf(owner2)).toStrictEqual(u256.One);

      // Verify ownership
      expect(_ownerOf(tokenIds[0])).toStrictEqual(owner2);
      expect(_ownerOf(tokenIds[1])).toStrictEqual(owner1);

      // Verify owned tokens
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(1);
      expect(owner1Tokens).toContainEqual(tokenIds[1]);

      const owner2Tokens = getOwnedTokens(owner2);
      expect(owner2Tokens.length).toBe(1);
      expect(owner2Tokens).toContainEqual(tokenIds[0]);
    });
  });

  describe('Token Transfers and Ownership', () => {
    it('should update ownership after transfer', () => {
      mint(owner1, tokenIds[0]);
      transfer(owner1, owner2, tokenIds[0]);

      expect(_ownerOf(tokenIds[0])).toStrictEqual(owner2);
      expect(_balanceOf(owner1)).toStrictEqual(u256.Zero);
      expect(_balanceOf(owner2)).toStrictEqual(u256.One);

      // Verify owned tokens
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(0);

      const owner2Tokens = getOwnedTokens(owner2);
      expect(owner2Tokens.length).toBe(1);
      expect(owner2Tokens).toContainEqual(tokenIds[0]);
    });

    it('should handle transfer to owner with balance', () => {
      mint(owner1, tokenIds[0]);
      mint(owner2, tokenIds[1]);

      transfer(owner1, owner2, tokenIds[0]);

      expect(_ownerOf(tokenIds[0])).toStrictEqual(owner2);
      expect(_balanceOf(owner1)).toStrictEqual(u256.Zero);
      expect(_balanceOf(owner2)).toStrictEqual(u256.fromU32(2));

      // Verify owned tokens
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(0);

      const owner2Tokens = getOwnedTokens(owner2);
      expect(owner2Tokens.length).toBe(2);
      expect(owner2Tokens).toContainEqual(tokenIds[0]);
      expect(owner2Tokens).toContainEqual(tokenIds[1]);
    });
  });

  describe('Token Burning and Ownership', () => {
    it('should update balances and tokens after burning', () => {
      mint(owner1, tokenIds[0]);
      mint(owner1, tokenIds[1]);

      burn(owner1, tokenIds[0]);

      expect(_balanceOf(owner1)).toStrictEqual(u256.One);
      expect(_totalSupply()).toStrictEqual(u256.One);

      // Verify that accessing the burned token's owner returns empty string
      expect(_ownerOf(tokenIds[0])).toStrictEqual('');

      // Verify owned tokens
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(1);
      expect(owner1Tokens).toContainEqual(tokenIds[1]);
    });

    it('should handle burning multiple tokens', () => {
      mint(owner1, tokenIds[0]);
      mint(owner1, tokenIds[1]);

      burn(owner1, tokenIds[0]);
      burn(owner1, tokenIds[1]);

      expect(_balanceOf(owner1)).toStrictEqual(u256.Zero);
      expect(_totalSupply()).toStrictEqual(u256.Zero);

      // Verify owned tokens
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(0);
    });
  });

  describe('Complex Token Interactions', () => {
    it('should handle mints, transfers, and burns correctly', () => {
      // Mint tokens to owner1 and owner2
      mint(owner1, tokenIds[0]);
      mint(owner1, tokenIds[1]);
      mint(owner2, tokenIds[2]);

      // Transfer tokenIds[1] from owner1 to owner2
      transfer(owner1, owner2, tokenIds[1]);

      // Burn tokenIds[0] owned by owner1
      burn(owner1, tokenIds[0]);

      // Verify total supply
      expect(_totalSupply()).toStrictEqual(u256.fromU32(2));

      // Verify balances
      expect(_balanceOf(owner1)).toStrictEqual(u256.Zero);
      expect(_balanceOf(owner2)).toStrictEqual(u256.fromU32(2));

      // Verify ownership
      expect(_ownerOf(tokenIds[1])).toStrictEqual(owner2);
      expect(_ownerOf(tokenIds[2])).toStrictEqual(owner2);

      // Verify that accessing the burned token's owner returns empty string
      expect(_ownerOf(tokenIds[0])).toStrictEqual('');

      // Verify owned tokens
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(0);

      const owner2Tokens = getOwnedTokens(owner2);
      expect(owner2Tokens.length).toBe(2);
      expect(owner2Tokens).toContainEqual(tokenIds[1]);
      expect(owner2Tokens).toContainEqual(tokenIds[2]);
    });
  });

  describe('Error Handling and Boundary Conditions', () => {
    it('should not mint existing token ID', () => {
      mint(owner1, tokenIds[0]);

      expect(() => {
        mint(owner1, tokenIds[0]);
      }).toThrow('Token already minted');
    });

    it('should not transfer nonexistent token', () => {
      expect(() => {
        transfer(owner1, owner2, tokenIds[0]);
      }).toThrow('Nonexistent token');
    });

    it('should not transfer to an invalid address', () => {
      mint(owner1, tokenIds[0]);

      expect(() => {
        _transferFrom(owner1, zeroAddress, tokenIds[0]);
      }).toThrow('Unauthorized to');
    });

    it('should not burn nonexistent token', () => {
      expect(() => {
        burn(owner1, tokenIds[0]);
      }).toThrow('Nonexistent token');
    });

    it('should have zero total supply after all tokens are burned', () => {
      mint(owner1, tokenIds[0]);
      burn(owner1, tokenIds[0]);

      expect(_totalSupply()).toStrictEqual(u256.Zero);

      // Check token ownership has been cleared
      expect(_ownerOf(tokenIds[0])).toStrictEqual(zeroAddress);

      // Verify owned tokens
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(0);
    });

    it('should mint a token with id=u256.Max', () => {
      mint(owner1, u256.Max);
      expect(_totalSupply()).toStrictEqual(u256.One);
      expect(_balanceOf(owner1)).toStrictEqual(u256.One);
      expect(_ownerOf(u256.Max)).toStrictEqual(owner1);
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(1);
      expect(owner1Tokens).toContainEqual(u256.Max);
    });
  });
});
