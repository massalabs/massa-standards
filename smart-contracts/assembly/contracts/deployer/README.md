# Smart Contract Deployer Documentation

## Overview

The `deployer.ts` smart contract is designed to facilitate the deployment of multiple smart contracts in a single operation. It automates the process of deploying smart contracts, calling their constructor functions (if available), and passing the necessary arguments and coins. This is achieved by leveraging the operation datastore to store and retrieve the required information for each contract.
This smart contract is aimed to be run in an ExecuteSC operation.
The deployed contract address(es) are retrived from execution events.

## How It Works

The deployer smart contract reads the information about the contracts to be deployed from the operation datastore. For each contract, it performs the following steps:

1. Retrieves the bytecode of the smart contract.
2. Deploys the smart contract.
3. Checks if the smart contract has a `constructor` function.
4. If a `constructor` function exists, it calls the function with the provided arguments and coins.
5. Generates an event indicating the address of the deployed contract.
6. Collects the addresses of all deployed contracts and generates a raw event containing this list.

## Operation Datastore Structure

The operation datastore is used to store the information required for deploying the smart contracts. The structure is as follows:

- **Key `[0]`**: Contains the number of smart contracts to deploy.
- **Key `[x, x, x, x]`**: Contains the bytecode of each smart contract. The 4 bytes of the key represent the index of the contract in the list.
- **Key `[x, x, x, x, 0, 0, 0, 0]`**: (Optional) Contains the arguments for the constructor function of each contract.
- **Key `[x, x, x, x, 0, 0, 0, 1]`**: (Optional) Contains the coins to be sent to the constructor function of each contract.

## Functions

### `main(_: StaticArray<u8>): void`

The entry point of the deployer smart contract. It deploys all the smart contracts and calls their constructors if available.

- **Parameters**: `_` (not used)
- **Behavior**:
  - Retrieves the number of contracts to deploy.
  - Iterates through each contract, deploying it and calling its constructor if applicable.
  - Generates events for each deployed contract and a raw event with the list of all deployed contract addresses.

---

### `getNbSC(): u64`

Retrieves the number of smart contracts to deploy.

- **Returns**: The number of smart contracts to deploy.
- **Throws**: If the number of smart contracts is not defined in the datastore.

---

### `getScByteCode(i: u64): StaticArray<u8>`

Retrieves the bytecode of the smart contract at the specified index.

- **Parameters**: `i` - The index of the smart contract.
- **Returns**: The bytecode of the smart contract.
- **Throws**: If the bytecode is not defined in the datastore.

---

### `argsKey(i: u64): StaticArray<u8>`

Generates the key for retrieving the constructor arguments of the smart contract at the specified index.

- **Parameters**: `i` - The index of the smart contract.
- **Returns**: The key for the constructor arguments.

---

### `getConstructorArgs(i: u64): Args`

Retrieves the arguments for the constructor function of the smart contract at the specified index.

- **Parameters**: `i` - The index of the smart contract.
- **Returns**: The arguments for the constructor function.

---

### `coinsKey(i: u64): StaticArray<u8>`

Generates the key for retrieving the coins to be sent to the constructor function of the smart contract at the specified index.

- **Parameters**: `i` - The index of the smart contract.
- **Returns**: The key for the coins.

---

### `getCoins(i: u64): u64`

Retrieves the amount of coins to be sent to the constructor function of the smart contract at the specified index.

- **Parameters**: `i` - The index of the smart contract.
- **Returns**: The amount of coins to send.

## Events

- **Contract Deployment Event**: For each deployed contract, an event is generated with the address of the deployed contract.
- **Raw Event**: A raw event is generated containing the list of all deployed contract addresses.

## Usage

To use the deployer smart contract, you need to:

1. Populate the operation datastore with the required information (number of contracts, bytecode, constructor arguments, and coins).
2. Execute the deployer smart contract using an `ExecuteSC` operation.
3. Monitor the events to retrieve the addresses of the deployed contracts.

## Massa-web3
    This contract is fully integrated in [@massalabs/massa-web3](https://github.com/massalabs/massa-web3) typescript library, and can is currently used to deploy Smart contracts on Massa

## Remarks

- The deployer smart contract ensures that all contracts are deployed and initialized in a single transaction.
- If any required information is missing in the datastore, the deployment will fail with an appropriate error message.