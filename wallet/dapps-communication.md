# Wallet-DApp communication standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/13>

## Abstract

The idea of this RFC is to propose a general standard for communication between wallets (Thyra, Bearby, any external wallet) and massa-web3 such that both:
- Dapp creators could have a unified interface they could make use of in their dapps which would allow them to easily switch to another compatible to the stnadard wallet client if they need to without breaking a single line of code in their Dapps.
- Wallets (light or heavy) could implement the corresponding wallet standard and expose themselves for direct use this way ensuring that any massa dapp could make use of them or easily switch to them if needed.

## Motivation

Some inspiration could be gained from the previous implementations of our Metamask-alike wallet:
https://github.com/massalabs/massa-wallet/blob/main/inject.js

and 

an injected provider
https://github.com/massalabs/massa-react-wallet/blob/main/src/massaPlugin/MassaPlugin.ts

with some injected interface standards:
https://github.com/massalabs/massa-react-wallet/blob/main/src/massaPlugin/types.ts

The classical ethereum provider API could be also used as a motivation as defined in here: https://docs.metamask.io/guide/ethereum-provider.html#table-of-contents

A good example of provider detection: https://github.com/MetaMask/detect-provider

The Ethereum API provider specification: https://eips.ethereum.org/EIPS/eip-1193

## Specification

For the realization of this RFC we will need Wallet Side and Dapp Side interfaces to be defined and a communication channel to be outlined, representing the mechanics of wallet registry and discovery by web3.

As already tested, the window.massa object https://github.com/massalabs/massa-wallet/blob/main/inject.js#L240 could be injected by a plugin by means of creating a dom element script https://github.com/massalabs/massa-wallet/blob/main/inject.js#L63 and placing an eventListener for messages. The plugin e.g. itself could be registered via `window.postMessage(...)` in every pagegh auth login

The following diagrams reveal the communication patterns that wallet injector and dapp builder could employ to work as specified.

## Implementation

1. On the **Wallet Injector** side, we can have this interface:

```typescript
interface IWalletProvider {

  // root methods
  getMetadata(): { version: String, options: {...} } as IMetadata;
  getNetwork(): MassaNetwork;

  isConnected(network: MassaNetwork): boolean;
  async connect(massaNetwork: MassaNetwork);
  async disconnect();

  isEnabled(): boolean;
  enable: (toggle: boolean) => void;

  // client methods
  getWallet() -> IWallet;
}
```

and each client (no matter where it comes from) could implement it as a standard. For example:

```typescript
class BearbyWallet implements IWalletProvider {...}
class ThyraWallet implements IWalletProvider {...}
```


2. On the **Dapp Builder** side, there will be a massa object injected into the global space as shown below exposing one async method called `listWalletProviders` as shown below. Beware that it has arguments indicating if we want it in silent mode and what is the **timeout** we allocate for wallet discovery

```typescript
declare global {
    interface Window {
        massa: {listWalletProviders(silent: bool = false, timeout: number = 30000): Promise<[IWalletProvider]>};
    }
}
```
The method will return a list of all loaded `IWalletProvider`s available to the dApp.

The dapp itself however needs to check for the existence of those, check if the ones they desire to use is enabled by default (Metamask e.g. is not enabled by default), if not manually do so, connect and get a handle to all `IWallet` methods exposed by the wallet.

An example code that a dapp could utilize could be:

```typescript
if (window.massa && window.massa.listWalletProviders) {
    // get wallet providers
    const walletProviders = await window.massa.listWalletProviders(true, 20000);
    const myInjectedWalletClient = walletProviders[0]; // get some provider based on the metadata e.g.

    // enable some wallet provider if needed
    if (!myInjectedWalletClient.isEnabled()) {
       // ask user to enable the provider ?
        myInjectedWalletClient.enable(true);
    }

    // connect via the provider to mainnet if not already connected
    if (!myInjectedWalletClient.isConnected(MassaNetwork.Mainnet)) {
        await myInjectedWalletClient.connect(MassaNetwork.Mainnet);
    }
    // get handle to the IWallet methods
    const wallet: IWallet = myInjectedWalletClient.getWallet();
    // use the wallet methods ...
    await wallet.signMessage(....)
}
```

Here is a possible definition of all exposed `IWallet` methods:

```typescript
interface IWallet {

  // set signer account
  setDefaultSignerAccount(signerAddress: string);

   // get signer account
  getDefaultSignerAccount(): IAccount;

  // unlocking with a password (if needed and implemented)
  async unlock(password: string);

  // get the attached provider
  getAttachedProvider(): IProvider;

  // remove all wallet accounts
  cleanWallet(): void;

  // setters
  addSecretKeysToWallet(secretKeys: [string]): [IAccount];
  removeAccountsFromWallet(addresses: [string]);

  // getters
  getAccounts(addresses: [string]): [IAccount];
  getFullAccounts(addresses: [string]): [IAccountInfo];

  // balances
  async getAccountBalances(address: [string]): [IBalance];

  // transactions and signing
  async signMessage(data: string | Buffer, signerAddress?: string): ISignature;
  async sendSignedMessage(signedMessage: ISignature, signerAddress?: string): IOperationId;
  async sendTransaction(txData: ITransactionData, signerAddress?: string): IOperationId;
  async buyRolls(txData: IRollsData, signerAddress?: string): IOperationId;
  async sellRolls(txData: IRollsData, signerAddress?: string): IOperationId;

  // static helpers
  static async walletGenerateNewAccount(): IAccount;
  static async getAccountFromSecretKey(secretKeyBase58: string): IAccount;
}
```

Once connected, several EventEmitter-style hooks should be also made available if the dapp needs that (js ref: `on` and `removeListener`). The Provider MUST implement the following event handling methods:

```typescript
myInjectedWalletClient.on('connect', listener: (connectInfo: ConnectInfo) => void): IProvider;
myInjectedWalletClient.on('disconnect', listener: (error: ProviderError) => void): IProvider;
myInjectedWalletClient.on('networkChanged', listener: (previous: MassaNetwork, current: MassaNetwork) => void): IProvider;
myInjectedWalletClient.on('accountsChanged', listener: (added: IAccount, removed: IAccount) => void): IProvider;
myInjectedWalletClient.on('message', listener: (msg: MassaMessage) => void): IProvider;
```