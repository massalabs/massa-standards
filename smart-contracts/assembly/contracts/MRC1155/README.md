# MRC1155

This repository contains a set of smart contracts to implement the ERC1155 standard on the Massa blockchain.
see [ERC1155 documentation](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC1155)

On top of that it also includes multiples extensions to the standard to allow for more complex use cases:
- [burnable](./assembly/contracts/burnable.sol)
- [mintable](./assembly/contracts/mintable.sol)
- [metadata](./assembly/contracts/metadata.sol)

It can be easily merged into massa-standards as this repository contains a set of smart contracts that are fully compatible with the ERC1155 standard with the only common depencies being ownership contract.

## Documentation

A documentation for each functions internals or externals has been created that can be found just before the functions declarations.

## Unit tests

A big set of unit tests has been written to ensure the correctness of the smart contracts compared to the standard and some security related checks.

The only missing coverage is for the call of the ERC1155Receiver function which cannot be tested with the current mocked tests environment.

