import { resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import {
  _update,
  _balanceOf,
  _totalSupply,
  _constructor,
  _ownerOf,
  _transferFrom,
  _decreaseTotalSupply,
  _increaseTotalSupply,
} from '../NFTEnumerable-internals';
import { getOwnedTokens } from './helpers';

const caller = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const owner1 = caller;
const owner2 = 'AU178qZCfaNXkz9tQiXJcVfAEnYGJ27UoNtFFJh3BiT8jTfY8P2D';
const zeroAddress = '';
const tokenIds: u64[] = [1, 2, 3, 4, 5];

const NFTName = 'MASSA_NFT';
const NFTSymbol = 'NFT';

function mint(to: string, tokenId: u64): void {
  _update(to, tokenId, zeroAddress);
}

function transfer(from: string, to: string, tokenId: u64): void {
  _update(to, tokenId, from);
}

function burn(owner: string, tokenId: u64): void {
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
      expect(_totalSupply()).toStrictEqual(0);
    });
  });

  describe('Total Supply Management', () => {
    it('should update total supply when token is minted', () => {
      mint(owner1, tokenIds[0]);
      expect(_totalSupply()).toStrictEqual(1);
    });

    it('should update total supply when token is burned', () => {
      mint(owner1, tokenIds[0]);
      expect(_totalSupply()).toStrictEqual(1);
      burn(owner1, tokenIds[0]);
      expect(_totalSupply()).toStrictEqual(0);
    });

    it('should not allow total supply to exceed u64.Max', () => {
      // Set total supply to u64.Max - 1
      const nearMaxSupply = u64.MAX_VALUE - 1;
      _increaseTotalSupply(nearMaxSupply);
      expect(_totalSupply()).toStrictEqual(nearMaxSupply);

      // Mint one more token should succeed (totalSupply = u64.Max)
      mint(owner1, tokenIds[0]);
      expect(_totalSupply()).toStrictEqual(u64.MAX_VALUE);

      // Minting another token should fail due to overflow
      expect(() => {
        _increaseTotalSupply(1);
      }).toThrow('Total supply overflow'); // Ensure your contract throws this exact error
    });

    it('should not allow total supply to underflow', () => {
      // Ensure total supply is zero
      expect(_totalSupply()).toStrictEqual(0);

      // Attempt to decrease supply by 1 should fail
      expect(() => {
        _decreaseTotalSupply(1);
      }).toThrow('Total supply underflow'); // Ensure your contract throws this exact error

      // Set total supply to 1
      _increaseTotalSupply(1);
      expect(_totalSupply()).toStrictEqual(1);

      // Decrease supply by 1 should succeed
      _decreaseTotalSupply(1);
      expect(_totalSupply()).toStrictEqual(0);

      // Attempt to decrease supply by another 1 should fail
      expect(() => {
        _decreaseTotalSupply(1);
      }).toThrow('Total supply underflow'); // Ensure your contract throws this exact error
    });
  });

  describe('Owner Token Enumeration', () => {
    it('should return correct balances and owned tokens after minting', () => {
      mint(owner1, tokenIds[0]);
      mint(owner1, tokenIds[1]);
      mint(owner2, tokenIds[2]);

      expect(_balanceOf(owner1)).toStrictEqual(2);
      expect(_balanceOf(owner2)).toStrictEqual(1);

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

      expect(_balanceOf(owner1)).toStrictEqual(1);
      expect(_balanceOf(owner2)).toStrictEqual(1);

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
      expect(_balanceOf(owner1)).toStrictEqual(0);
      expect(_balanceOf(owner2)).toStrictEqual(1);

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
      expect(_balanceOf(owner1)).toStrictEqual(0);
      expect(_balanceOf(owner2)).toStrictEqual(2);

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

      expect(_balanceOf(owner1)).toStrictEqual(1);
      expect(_totalSupply()).toStrictEqual(1);

      // Verify that accessing the burned token's owner returns zero address
      expect(_ownerOf(tokenIds[0])).toStrictEqual(zeroAddress);

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

      expect(_balanceOf(owner1)).toStrictEqual(0);
      expect(_totalSupply()).toStrictEqual(0);

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
      expect(_totalSupply()).toStrictEqual(2);

      // Verify balances
      expect(_balanceOf(owner1)).toStrictEqual(0);
      expect(_balanceOf(owner2)).toStrictEqual(2);

      // Verify ownership
      expect(_ownerOf(tokenIds[1])).toStrictEqual(owner2);
      expect(_ownerOf(tokenIds[2])).toStrictEqual(owner2);

      // Verify that accessing the burned token's owner returns zero address
      expect(_ownerOf(tokenIds[0])).toStrictEqual(zeroAddress);

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

    it('should not transfer to zero address', () => {
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

      expect(_totalSupply()).toStrictEqual(0);

      // Check token ownership has been cleared
      expect(_ownerOf(tokenIds[0])).toStrictEqual(zeroAddress);

      // Verify owned tokens
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(0);
    });

    it('should mint a token with id=u64.Max', () => {
      mint(owner1, u64.MAX_VALUE);
      expect(_totalSupply()).toStrictEqual(1);
      expect(_balanceOf(owner1)).toStrictEqual(1);
      expect(_ownerOf(u64.MAX_VALUE)).toStrictEqual(owner1);
      const owner1Tokens = getOwnedTokens(owner1);
      expect(owner1Tokens.length).toBe(1);
      expect(owner1Tokens).toContainEqual(u64.MAX_VALUE);
    });
  });
});
