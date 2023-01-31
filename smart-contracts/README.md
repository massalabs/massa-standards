# Massa Smart-contract Standards

- [fungible token](assembly/contracts/FT): implementation of the ERC20 token.
- [non-fungible token](assembly/contracts/NFT)

## Documentation

Complete documentation of all available functions and objects is here:

- [`massa-sc-standards documentation`](https://sc-standards.docs.massa.net)

## Usage

### Install

```sh
npm i @massalabs/sc-standards
```

### Example

```typescript
import { Args } from '@massalabs/as-types';
import { callerHasWriteAccess } from '@massalabs/massa-as-sdk';
import * as FT from '@massalabs/sc-standards/assembly/contracts/FT/index';
export * from '@massalabs/sc-standards/assembly/contracts/FT/token';

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param _ - not used
 */
export function constructor(_: StaticArray<u8>): StaticArray<u8> {
// This line is important. It ensures that this function can't be called in the future.
// If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!callerHasWriteAccess()) {
    return [];
  }

  FT.constructor(
    new Args().add('MY_TOKEN').add('MTK').add(4).add(100000).serialize(),
  );

  return [];
}
```
