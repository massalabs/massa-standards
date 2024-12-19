# **Massa Wallet to DApp Communication Standard**

**Authors**: Massalabs Team  
**Version**: 1.0  
**Status**: Draft

---

## **Introduction**

This document outlines the communication standard between Massa wallets and decentralized applications (DApps). The goal is to provide a clear and unified interface that enhances interoperability and developer experience.

---

## **Global Injection: `window.massaWallets`**

To interact with Massa wallets, the DApp relies on the global object `window.massaWallets`, which serves as a centralized repository for wallet information.

### **Structure of `window.massaWallets`**

Each wallet is represented as an object containing the following properties:

```javascript
window.massaWallets = [
  {
    name: "Massa Wallet",
    uuid: "unique-identifier",
    icon: "data:image/svg+xml,<svg>...</svg>",
    provider: {
      request: Function, // Method for performing operations
      on: Function, // Method for subscribing to events
      off: Function, // Method for unsubscribing from events
    },
  },
];
```

---

## **Core Functionalities**

### **1. `request`: Execute Operations**

The `request` method allows the DApp to perform various wallet operations. It accepts a method name and corresponding parameters and returns a Promise.

#### **Interface**

```typescript
type Request = {
  (args: { method: string; params: object }): Promise<any>;
};
```

#### **Example Usage**

```javascript
massaWallets[0].provider
  .request({
    method: "account.list",
    params: {},
  })
  .then((result) => {
    console.log("Accounts:", result.accounts);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

---

### **2. `on`: Subscribe to Events**

The `on` method enables the DApp to subscribe to specific wallet events for real-time updates.

#### **Interface**

```typescript
type On = {
  (event: string, callback: Function): void;
};
```

#### **Example "Usage"**

```javascript
massaWallets[0].provider.on("accountChanged", (newAddress) => {
  console.log("New account:", newAddress);
});
```

---

### **3. `off`: Unsubscribe from Events**

The `off` method removes event listeners for specified events.

#### **Interface**

```typescript
type Off = {
  (event: string, callback: Function): void;
};
```

#### **Example Usage**

```javascript
massaWallets[0].provider.off("accountChanged", callback);
```

---

### **Wallet Methods**

- [wallet.accounts](#walletaccounts) - Retrieve a list of accounts managed by the wallet.
- [wallet.networkInfos](#walletnetworkinfos) - Get current network information.
- [wallet.setRpcUrl](#walletsetrpcurl) - Update the wallet's RPC URL.
- [wallet.connect](#walletconnect) - Connect the wallet to the DApp.
- [wallet.disconnect](#walletdisconnect) - Disconnect the wallet from the DApp.
- [wallet.connected](#walletconnected) - Check if the wallet is unlocked.
- [wallet.enabled](#walletenabled) - Verify if the wallet is enabled for the DApp.

### **Account Methods**

- [account.address](#accountaddress) - Get the account's address.
- [account.balance](#accountbalance) - Retrieve the account's balance.
- [account.sign](#accountsign) - Sign data using the account's private key.
- [account.buyRolls](#accountbuyrolls) - Purchase staking rolls for the account.
- [account.sellRolls](#accountsellrolls) - Sell staking rolls for the account.
- [account.transfer](#accounttransfer) - Transfer coins to another address.
- [account.callSC](#accountcallsc) - Call a smart contract method.
- [account.readSC](#accountreadsc) - Read data from a smart contract.
- [account.deploySC](#accountdeploysc) - Deploy a new smart contract.
- [account.executeSC](#accountexecutesc) - Execute a smart contract bytecode.
- [account.getOperationStatus](#accountgetoperationstatus) - Check the status of an operation.
- [account.getEvents](#accountgetevents) - Retrieve events emitted by smart contracts.
- [account.getNodeStatus](#accountgetnodestatus) - Get the current status of the Massa node.
- [account.getStorageKeys](#accountgetstoragekeys) - Retrieve storage keys from a smart contract.
- [account.readStorage](#accountreadstorage) - Read values from a smart contract's storage.

#### **`wallet.accounts`**

- **Description**: Retrieves a list of accounts managed by the wallet.
- **Parameters**: None
- **Returns**:

```typescript
type Account = {
  address: string;
};

type AccountsResponse = Account[];
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "wallet.accounts", params: {} })
  .then((accounts) => {
    console.log("Accounts:", accounts);
  })
  .catch((error) => {
    console.error("Error fetching accounts:", error);
  });
```

---

#### **`wallet.networkInfos`**

- **Description**: Retrieves information about the current network the wallet is connected to.
- **Parameters**: None
- **Returns**:

```typescript
type Network = {
  name: string;
  chainId: string;
  rpcUrl?: string;
  minimalFee: string;
};
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "wallet.networkInfos", params: {} })
  .then((network) => {
    console.log("Network Info:", network);
  })
  .catch((error) => {
    console.error("Error fetching network info:", error);
  });
```

---

#### **`wallet.setRpcUrl`**

- **Description**: Updates the RPC URL used by the wallet.
- **Parameters**:

```typescript
type SetRpcUrlParams = {
  url: string;
};
```

- **Returns**:

```typescript
Promise<void>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "wallet.setRpcUrl",
    params: { url: "https://new-rpc-url.com" },
  })
  .then(() => {
    console.log("RPC URL successfully updated.");
  })
  .catch((error) => {
    console.error("Error updating RPC URL:", error);
  });
```

---

#### **`wallet.connect`**

- **Description**: Requests the user to connect their wallet to the DApp, granting the DApp access to the accounts managed by the wallet.
- **Parameters**: None
- **Returns**:

```typescript
Promise<void>;
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "wallet.connect", params: {} })
  .then(() => {
    console.log("Successfully connected to the wallet.");
  })
  .catch((error) => {
    console.error("Error connecting to the wallet:", error);
  });
```

---

#### **`wallet.disconnect`**

- **Description**: Disconnects the wallet from the DApp, revoking the DApp's access to the wallet.
- **Parameters**: None
- **Returns**:

```typescript
Promise<void>;
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "wallet.disconnect", params: {} })
  .then(() => {
    console.log("Successfully disconnected from the wallet.");
  })
  .catch((error) => {
    console.error("Error disconnecting from the wallet:", error);
  });
```

---

#### **`wallet.connected`**

- **Description**: Checks whether the wallet is unlocked, indicating that the user has authenticated and the wallet is accessible for interactions.
- **Parameters**: None
- **Returns**:

```typescript
boolean;
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "wallet.connected", params: {} })
  .then((isConnected) => {
    if (isConnected) {
      console.log("The wallet is unlocked and ready to use.");
    } else {
      console.log("The wallet is locked or unavailable.");
    }
  })
  .catch((error) => {
    console.error("Error checking wallet connection:", error);
  });
```

---

#### **`wallet.enabled`**

- **Description**: Checks whether the wallet is enabled for the DApp, indicating that the user has granted permission for the DApp to access wallet features.
- **Parameters**: None
- **Returns**:

```typescript
boolean;
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "wallet.enabled", params: {} })
  .then((isEnabled) => {
    if (isEnabled) {
      console.log("The wallet is enabled for this DApp.");
    } else {
      console.log("The wallet is not enabled for this DApp.");
    }
  })
  .catch((error) => {
    console.error("Error checking if wallet is enabled:", error);
  });
```

---

### **Wallet Events**

#### ** On `wallet.accountChanged`**

- **Description**: Subscribes to account change events, allowing the DApp to be notified when the active account changes in the wallet.
- **Parameters**:

```typescript
(event: "wallet.accountChanged", callback: (address: string) => void) => void;
```

- **Returns**: None

#### Example:

```javascript
massaWallets[0].on("wallet.accountChanged", (newAddress) => {
  console.log("Account changed to:", newAddress);
});
```

---

#### **Off `wallet.accountChanged`**

- **Description**: Unsubscribes from account change events, stopping the DApp from receiving notifications when the active account changes.
- **Parameters**:

```javascript
(event: "wallet.accountChanged") => void;
```

- **Returns**: None

#### Example:

```javascript
massaWallets[0].off("wallet.accountChanged");
```

---

#### **On `wallet.networkChanged`**

- **Description**: Subscribes to network change events, allowing the DApp to be notified when the wallet switches to a new network.
- **Parameters**:

```typescript
(event: "wallet.networkChanged", callback: (network: { name: string; chainId: string; rpcUrl?: string; minimalFee: string }) => void) => void;
```

- **Returns**: None

#### Example:

```javascript
massaWallets[0].on("wallet.networkChanged", (newNetwork) => {
  console.log("Network changed to:", newNetwork.name);
});
```

---

#### ** Off `wallet.NetworkChanged`**

- **Description**: Unsubscribes from network change events, stopping the DApp from receiving notifications when the network changes.
- **Parameters**:

```typescript
(event: "wallet.networkChanged") => void;
```

- **Returns**: None

#### Example:

```javascript
massaWallets[0].off("wallet.networkChanged");
```

### **Account Methods**

#### **`account.address`**

- **Description**: Retrieves the account's address.
- **Parameters**: None
- **Returns**:

```typescript
Promise<string>;
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "account.address", params: {} })
  .then((accountAddress) => {
    console.log("Account address:", accountAddress);
  })
  .catch((error) => {
    console.error("Error fetching account address:", error);
  });
```

---

#### **`account.balance`**

- **Description**: Retrieves the account's balance, including both final and candidate balances.
- **Parameters**: None
- **Returns**:

```typescript
type AccountBalance = {
  final: string; // The final balance of the account.
  candidate: string; // The candidate balance of the account.
};

Promise<AccountBalance>;
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "account.balance", params: {} })
  .then((balance) => {
    console.log("Final balance:", balance.final);
    console.log("Candidate balance:", balance.candidate);
  })
  .catch((error) => {
    console.error("Error fetching balance:", error);
  });
```

---

#### **`account.sign`**

- **Description**: Signs data using the account's private key.
- **Parameters**:

```typescript
(data: Uint8Array | string) => Promise<SignedData>;
```

- **Returns**:

```typescript
type SignedData = {
  signature: string; // The generated signature for the provided data.
  publicKey: string; // The public key associated with the account.
};
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.sign",
    params: {
      data: "Hello, Massa!",
    },
  })
  .then((signedData) => {
    console.log("Signature:", signedData.signature);
    console.log("Public key:", signedData.publicKey);
  })
  .catch((error) => {
    console.error("Error signing data:", error);
  });
```

---

#### **`account.buyRolls`**

- **Description**: Purchases staking rolls for the account.
- **Parameters**:

```typescript
type BuyRollsParams = {
  amount: string; // The number of rolls to purchase.
  fee?: string;
  periodToLive?: number;
};
```

- **Returns**:

```typescript
type Operation = {
  operationId: string; // The ID of the operation.
};

Promise<Operation>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.buyRolls",
    params: {
      amount: "10",
    },
  })
  .then((operation) => {
    console.log("Operation ID:", operation.operationId);
  })
  .catch((error) => {
    console.error("Error purchasing rolls:", error);
  });
```

#### **`account.sellRolls`**

- **Description**: Sells staking rolls for the account.
- **Parameters**:

```typescript
type SellRollsParams = {
  amount: string; // The number of rolls to sell.
  fee?: string;
  periodToLive?: number;
};
```

- **Returns**:

```typescript
type Operation = {
  operationId: string; // The ID of the operation.
};

Promise<Operation>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.sellRolls",
    params: {
      amount: "5",
    },
  })
  .then((operation) => {
    console.log("Operation ID:", operation.operationId);
  })
  .catch((error) => {
    console.error("Error selling rolls:", error);
  });
```

#### **`account.transfer`**

- **Description**: Transfers coins from the account to another address.
- **Parameters**:

```typescript
type TransferParams = {
  to: string; // The recipient address.
  amount: string; // The amount to transfer.
  fee?: string;
  periodToLive?: number;
};
```

- **Returns**:

```typescript
type Operation = {
  operationId: string; // The ID of the operation.
};

Promise<Operation>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.transfer",
    params: {
      to: "recipient_address",
      amount: "100",
    },
  })
  .then((operation) => {
    console.log("Operation ID:", operation.operationId);
  })
  .catch((error) => {
    console.error("Error transferring tokens:", error);
  });
```

---

#### **`account.callSC`**

- **Description**: Calls a smart contract method.
- **Parameters**:

```typescript
type CallSCParams = {
  functionName: string; // The name of the function to call.
  targetAddress: string; // The address of the smart contract.
  parameters: Uint8Array | Args; // The parameters for the function. The Args object is defined in massa-web3 library.
  coins?: string;
  fee?: string;
  maxGas?: string;
  periodToLive?: number;
};
```

- **Returns**:

```typescript
type Operation = {
  operationId: string; // The ID of the operation.
};

Promise<Operation>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.callSC",
    params: {
      targetAddress: "contract_address",
      functionName: "mint",
      parameters: [],
    },
  })
  .then((operationId) => {
    console.log("Operation ID:", operation.operationId);
  })
  .catch((error) => {
    console.error("Error calling smart contract:", error);
  });
```

---

#### **`account.readSC`**

- **Description**: Reads data from a smart contract.
- **Parameters**:

```typescript
type ReadSCParams = {
  targetAddress: string; // The address of the smart contract.
  functionName: string; // The name of the function to read.
  parameters: Uint8Array | Args; // The parameters for the function. The Args object is defined in massa-web3 library.
  caller?: string; // The address of the caller (optional).
  coins?: string;
  fee?: string;
  maxGas?: string;
};
```

- **Returns**:

```typescript
export type ReadSCData = {
  value: Uint8Array;
  info: {
    error?: string;
    events: SCEvent[];
    gasCost: number;
  };
};

Promise<ReadSCData>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.readSC",
    params: {
      targetAddress: "contract_address",
      functionName: "balanceOf",
      parameters: [],
    },
  })
  .then((result) => {
    console.log("Smart contract returned:", result);
  })
  .catch((error) => {
    console.error("Error reading smart contract:", error);
  });
```

---

#### **`account.deploySC`**

- **Description**: Deploys a new smart contract.
- **Parameters**:

```typescript
type DeploySCParams = {
  byteCode: Uint8Array;
  parameter?: Args | Uint8Array;
  maxCoins?: string;
  periodToLive?: number;
  waitFinalExecution?: boolean;
  coins?: string;
  fee?: string;
  maxGas?: string;
};
```

- **Returns**:

```typescript
type Operation = {
  operationId: string; // The ID of the operation.
};

Promise<Operation>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.deploySC",
    params: {
      bytecode: "smart_contract_bytecode",
    },
  })
  .then((operationId) => {
    console.log("Operation ID:", operation.operationId);
  })
  .catch((error) => {
    console.error("Error deploying smart contract:", error);
  });
```

---

### **account.executeSC**

- **Description**: Executes a smart contract using provided bytecode and optional parameters.
- **Parameters**:

```typescript
export type ExecuteScParams = {
  byteCode: Uint8Array; // The smart contract bytecode to execute.
  datastore?: Map<Uint8Array, Uint8Array>; // Optional key-value datastore for the contract.
  periodToLive?: number; // Optional period for the transaction to remain valid.
  fee?: string; // Optional fee for the execution.
  maxGas?: string; // Optional maximum gas for the execution.
  maxCoins?: string; // Optional maximum coins to allocate for execution.
};
```

- **Returns**:

```typescript
type Operation = {
  operationId: string; // The ID of the operation.
};

Promise<Operation>; // Contains the operation ID.
```

- **Example**:

```javascript
massaWallets[0]
  .request({
    method: "account.executeSC",
    params: {
      byteCode: new Uint8Array([
        /* smart contract bytecode */
      ]),
    },
  })
  .then((operation) => {
    console.log("Operation ID:", operation.operationId);
  })
  .catch((error) => {
    console.error("Error executing smart contract:", error);
  });
```

---

#### **`account.getOperationStatus`**

- **Description**: Retrieves the status of an operation.
- **Parameters**:

```typescript
type OperationStatusParams = {
  opId: string; // The ID of the operation to check.
};
```

- **Returns**:

```typescript
type OperationTransaction = {
  result?: {
    id: string; // Operation id
    in_blocks: string[]; // Block ids
    in_pool: boolean;
    is_operation_final: boolean | null;
    thread: number;
    op_exec_status: boolean | null;
    operation: WrappedOperation;
  }[];
};

Promise<OperationStatus>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.getOperationStatus",
    params: {
      opId: "operation_id",
    },
  })
  .then((status) => {
    console.log("Operation status:", status.status);
  })
  .catch((error) => {
    console.error("Error fetching operation status:", error);
  });
```

---

#### **`account.getEvents`**

- **Description**: Retrieves events emitted by smart contracts.
- **Parameters**:

```typescript
type EventFilter = {
  contractAddress: string; // The address of the smart contract.
  startTime?: number; // The starting time for the events (optional).
  endTime?: number; // The ending time for the events (optional).
};
```

- **Returns**:

```typescript
Promise<SCEvent[]>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.getEvents",
    params: {
      contractAddress: "contract_address",
    },
  })
  .then((events) => {
    console.log("Events emitted by the contract:", events);
  })
  .catch((error) => {
    console.error("Error fetching events:", error);
  });
```

---

#### **`account.getNodeStatus`**

- **Description**: Retrieves the current status of the Massa node.
- **Parameters**: None
- **Returns**:

```typescript
export type NodeStatusInfo = {
  config: Config;
  connectedNodes: Record<string, unknown>;
  consensusStats: ConsensusStats;
  currentCycle: number;
  currentTime: number;
  currentCycleTime: number;
  nextCycleTime: number;
  lastSlot: t.Slot;
  nextSlot: t.Slot;
  networkStats: NetworkStats;
  nodeId: string;
  nodeIp?: null | string;
  poolStats: number[];
  version: string;
  executionStats: ExecutionStats;
  chainId: number;
  minimalFees?: string;
};

export type Config = {
  blockReward: string;
  deltaF0: number;
  endTimestamp?: number | null;
  genesisTimestamp: number;
  maxBlockSize?: number;
  operationValidityPeriods: number;
  periodsPerCycle: number;
  rollPrice: string;
  t0: number;
  threadCount: number;
};

export type ConsensusStats = {
  cliqueCount: number;
  endTimespan: number;
  finalBlockCount: number;
  staleBlockCount: number;
  startTimespan: number;
};

export type NetworkStats = {
  activeNodeCount: number;
  bannedPeerCount: number;
  inConnectionCount: number;
  knownPeerCount: number;
  outConnectionCount: number;
};

export type ExecutionStats = {
  timeWindowStart: number;
  timeWindowEnd: number;
  finalBlockCount: number;
  finalExecutedOperationsCount: number;
  activeCursor: t.Slot;
  finalCursor: t.Slot;
};

Promise<NodeStatusInfo>;
```

#### Example:

```javascript
massaWallets[0]
  .request({ method: "account.getNodeStatus", params: {} })
  .then((status) => {
    console.log("Node status:", status);
  })
  .catch((error) => {
    console.error("Error fetching node status:", error);
  });
```

---

#### **`account.getStorageKeys`**

- **Description**: Retrieves the keys from a smart contract's storage.
- **Parameters**:

```typescript
type StorageKeysParams = {
  address: string; // The address of the smart contract.
  filter: Uint8Array | string; // The filter for the keys to retrieve.
  final?: boolean; // Whether to fetch final state storage
};
```

- **Returns**:

```typescript
Promise<Uint8Array[]>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.getStorageKeys",
    params: {
      address: "contract_address",
      filter: "key_filter",
    },
  })
  .then((keys) => {
    console.log("Storage keys:", keys);
  })
  .catch((error) => {
    console.error("Error fetching storage keys:", error);
  });
```

---

#### **`account.readStorage`**

- **Description**: Reads values from a smart contract's storage.
- **Parameters**:

```typescript
type ReadStorageParams = {
  address: string; // The address of the smart contract.
  keys: Uint8Array[] | string[]; // The keys to read.
  final?: boolean; // Whether to fetch final state storage
};
```

- **Returns**:

```typescript
Promise<Uint8Array[]>;
```

#### Example:

```javascript
massaWallets[0]
  .request({
    method: "account.readStorage",
    params: {
      address: "contract_address",
      keys: ["key1", "key2"],
    },
  })
  .then((values) => {
    console.log("Storage values:", values);
  })
  .catch((error) => {
    console.error("Error reading storage:", error);
  });
```

## **Error Management**

Errors returned by the `request` method include a structured object with code, message, and optional data.

#### **Error Format**

```typescript
type RequestError = {
  code: number;
  message: string;
  data?: any;
};
```

#### **Common Error Codes**

| **Code** | **Name**                | **Description**                            |
| -------- | ----------------------- | ------------------------------------------ |
| 4001     | `User Rejected Request` | User has rejected the operation.           |
| 4100     | `Unauthorized`          | The operation or account lacks permission. |
| 4200     | `Unsupported Method`    | The requested method is not supported.     |
| 4300     | `Invalid Parameters`    | The provided parameters are invalid.       |
| 4400     | `Internal Error`        | An internal error occurred.                |
