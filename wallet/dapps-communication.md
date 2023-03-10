# Wallet-DApp communication standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/13>

## Abstract

## Motivation

## Specification

## Implementation

## Code sample

This section provides examples of how to use the Massa wallet-provider JS library from different perspectives.
We'll consider two potential users: Alice and Bob.

### Bob, the dApp developer

Bob wants to create a web page that can interact with any wallet provider within the Massa ecosystem.

Bob needs the ability to perform the following tasks:

- Determine if a wallet provider is available.
- Access the names of available wallet providers to personalize website messaging.
- Retrieve a list of all the wallets registered with each provider.
- Retrieve wallet information, such as address and balance.
- Perform actions on a wallet, such as signing a transaction or exporting a wallet.
- Remove a wallet from a provider.

To do this, he can use the Massa wallet-provider JS library:

```typescript
import { providers, Provider, Wallet, SignResult } from 'massa-wallet-provider';

async function interactWithMassaWallet() {
  // Get the available wallet providers
  const availableProviders: Provider[] = await providers();

  // Display the names of the available wallet providers on the website
  const providerNames: string[] = availableProviders.map(provider => provider.name());
  document.getElementById('provider-names').innerText = providerNames.join(', ');

  // Allow the user to select a wallet provider
  const selectedProvider: Provider = availableProviders[0];

  // Display the wallets registered with the selected provider on the website
  const wallets: Wallet[] = await selectedProvider.wallets();
  const walletAddresses: string[] = await Promise.all(wallets.map(async wallet => await wallet.address()));
  document.getElementById('wallet-addresses').innerText = walletAddresses.join(', ');

  // Allow the user to select a wallet
  const selectedWallet: Wallet = wallets[0];

  // Display the balance of the selected wallet on the website
  const walletBalance: BigInt = await selectedWallet.balance();
  document.getElementById('wallet-balance').innerText = walletBalance.toString();

  // Allow the user to sign a transaction
  const payload: Uint8Array = new Uint8Array([1, 2, 3]);
  const {pubKey, signature}: SignResult = await selectedWallet.sign(payload);
}
```

Bob can utilize our wallet-provider JS library, which provides the following functions:

```typescript
export async function providers(): Promise<Provider[]> { }

export interface SignResult {
  pubKey: string;
  signature: Uint8Array;
}

export class Wallet {
  async address(): Promise<string> { }

  async balance(): Promise<BigInt> { }

  async sign(payload: Uint8Array): Promise<SignResult> { }
}

export class Provider {
  name(): string { }

  async wallets(): Promise<Wallet[]> { }

  async importWallet(): Promise<Wallet> { }

  async deleteWallet(wallet: Wallet): Promise<void> { }
}
```

### Alice, the browser extension developer

Alice wants to create a browser extension that can interact with the Massa ecosystem using the wallet-provider JS library.
However, Alice needs to interact with the library from the
[content script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts),
which is separate from the webpage script.

Alice needs the ability to perform the following tasks:

- Register her wallet extension as a provider with the web page.
- Receive commands from the web page and respond to them accordingly.

To do this, she can use the Massa wallet-provider-content-script JS library:

```typescript
import {
  registerAsMassaWalletProvider,
  listWallet,
  deleteWallet,
  importWallet,
  balance,
  sign,
} from 'wallet-provider-content-script';


// Receive commands from the web page and respond to them accordingly
listWallet(() => {
  // Handle listWallet command from the web page
  const wallets = ['0x123456...', '0x789ABC...'];
  return wallets;
});

deleteWallet((address) => {
  // Handle deleteWallet command from the web page
  console.log(`Deleting wallet with address ${address}`);
});

importWallet((pubKey, privKey) => {
  // Handle importWallet command from the web page
  console.log(`Importing wallet with public key ${pubKey} and private key ${privKey}`);
});

balance((address) => {
  // Handle balance command from the web page
  const balanceAmount = BigInt(1000000);
  return balanceAmount;
});

sign((address, payload) => {
  // Handle sign command from the web page
  const signature = '0x123456...';
  return [signature, payload];
});

// Register Alice's wallet extension as a provider with the web page
registerAsMassaWalletProvider('Alice Wallet').then((success) => {
  if (success) {
    console.log('Registered as a provider with the web page');
  } else {
    console.log('Failed to register as a provider with the web page');
  }
});
```

Alice can utilize our wallet-provider-content-script JS library, which provides the following functions:

```typescript

export async function registerAsMassaWalletProvider(providerName: string): Promise<boolean> {}

export function listWallet(callback: () => string[]): void {}

export function deleteWallet(callback: (address: string) => void): void {}

export function importWallet(callback: (pubKey: string, privKey: string) => void): void {}

export function balance(callback: (address: string) => BigInt): void {}

export function sign(callback: (address: string, payload: Uint8Array) => [string, Uint8Array]): void {}

```

### Constraints to solve by the provided lib

The library needs to provide a secure and efficient way to communicate between the page script and the content script,
which allows for multiple requests to be processed in parallel.

To achieve this, we will use:

- An EventTarget attached to different window keys:
  - A generic massaWalletProvider for messages from the extension to the web page.
  - One per extension for messages from the web page to the content script.
- To allow multiple commands to be executed in parallel, we can set a correlation ID to each outgoing request that is
propagated in the response.

Here's some example code of massa-wallet-provider library that implements this approach:

```typescript
const extensionEventTarget = new EventTarget();
window[`massaWalletProvider-${walletProviderName}`] = extensionEventTarget;

interface Message {
  command: string;
  params: object;
  requestId: string;
}

const pendingRequests = new Map<string, ?>();

function sendMessageToContentScript(command, params, responseCallback) {
  const requestId = uuidv4();
  const message: Message = { command, params, requestId };
  pendingRequests.set(requestId, responseCallback);
  extensionEventTarget.dispatchEvent(new CustomEvent('message', { detail: message }));
}

function handleResponseFromContentScript(event) {
  const { result, error, requestId } = event.detail;
  const responseCallback = pendingRequests.get(requestId);

  if (responseCallback) {
    if (error) {
      responseCallback(new Error(error));
    } else {
      responseCallback(null, result);
    }
    pendingRequests.delete(requestId);
  }
}
```

History kept below:

Here is pseudo code for the two points of view:

- browser extension developer
- dapp builder

**As a browser extension developer, I would write...**

browser extension code, [content script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts):

```typescript
// the extension register itself
if (window.massaWalletProvider == undefined) { /* wait */ }

window.bearbyWalletProvider = new EventTarget()

window.massaWalletProvider.addEventListener('loaded', () => {
  window.massaWalletProvider.dispatchEvent(new CustomEvent('register', {
    ProviderName: "bearby",
    eventTarget: "bearbyWalletProvider",
    extensionID: "" // maybe not needed
  }))
})

window.bearbyWalletProvider.addEventListener('sign', ({messageToBeSigned, correlationId}) => {
  // validate the inputs
  ...

  // ask the background script to sign
  browser.runtime.sendMessage({
    messageToBeSigned,
    commandName: 'sign'
    }
  })
  .then((pkey, signature) => {
    // send back the signature to the page script (massa js library)
    window.bearbyWalletProvider.dispatchEvent(new CustomEvent('signed', {
      pkey,
      signature,
      correlationId
    }))
  });
})
```

browser extension code, [background script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts):

```typescript
browser.runtime.onMessage.addListener((message, sender, response) => {
  switch massage.commandName:
    case 'sign':
      return new Promise() // aks user authorization and password, sign message payload, return pkey and signature
      break
});
```

**Code snippet of massa javascript (or typescript) library:**

```typescript
registeredProviders = []
actions = [] // all the ongoing actions (sign, getBalance...)

// we start by listening register event
window.massaWalletProvider = new EventTarget()
window.massaWalletProvider.addEventListener('register', (payload) => {
  // add the new provider to the list
  // add the attribute wallets: list of wallets of this new provider
  // the first wallet is a newly created wallet, we give as constructor argument the event target name created by the extension
  registeredProviders.push({...payload, wallets: [new Wallet(payload.eventTarget)])
})

window.massaWalletProvider.dispatchEvent('loaded') // all wallet will catch this event and emit register event

export class Wallet {
  construct(eventTargetName: string) {}

  function sign(payload) {
    const action = {
      correlationId: uuid() // pick a correlation id to track the sign message request, it can simply be a int incremented
      payload,
      response: null
    }
    actions.push(action)

    // listen for the response
    window[this.eventTargetName].addEventListener('signed', ({ pkey, signature, correlationId }) => {
      // fill the response attribute of the action corresponding to the correlationId
      actions.find(a => a.correlationId == correlationId).response = { pkey, signature }
    })

    // trigger the signature
    window[this.eventTargetName].dispatchEvent(new CustomEvent('sign', action))

    return new Promise((resole, reject) => {
      // reject in 60 seconds to not let the user wait for hours
      setTimeOut(() => {
        reject('event timeout')
      }, 60000)

      setInterval(() => {
        if (action.response != null) {
          // remove this particular action from the action list
          actions.remove(action)

          // resolve the promise with the event response
          resolve(action.response) // here we define what Wallet.sign will return when doing await on it
        } 
      }, 500)
    })
  }
}

```

**As a dapp builder, I would write...**

```typescript
providers: [] = await massa-js-library.listWalletProviders()

for each providers as p
  for each p.wallets as wallet
    print wallet.getAddress()
    print wallet.getBalance()

wallet = providers.listWallets()[0]
pkey, signature = await wallet.sign([0, ...])

```

**Code snippet of massa javascript (or typescript) library:**

```typescript
export function listWalletProviders() {
  return registeredProviders // defined above as an array
}

export class Wallet {
  getAddress() {...}
  getBalance() {...}
  sign(payload: bytes): (string, bytes) {...} // defined above
}

export class Provider {
  listWallets() {...}
  importWallet() {...}
  deleteWallet() {...}
}
```
