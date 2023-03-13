# Wallet-DApp communication standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/13>

## Abstract

## Motivation

## Specification

Definitions:

- Wallet Provider: software that provides a way for the user to manage the wallet.
- Wallet: same as the one in the pocket but as a digital device.
- Account: contained in a wallet, represents massa blockchain key pair & address.

### How the browser extension communicate with the webpage?

*Security model of browser extension:*

**Content Script**: Content scripts are JavaScript files that run in the context of web pages. They are used to modify
the content and appearance of web pages. Content scripts can access the DOM of the page they are injected into and can
communicate with their parent extension. Content scripts can also send messages to other scripts, such as background
scripts and web page scripts.

**Background Script**: Background scripts are JavaScript files that are loaded in the background and are used to control
the overall behavior of the extension. They can access APIs that let them interact with the browser and the web pages it
visits.

**Web Page Script**: Web page scripts are JavaScript files that run in the context of web pages. They are used to modify
the behavior of web pages, such as adding custom functionality or integrating with existing web services.

The browser extension needs to have a **provider name** that will by passed to the web page during registration as a
wallet provider.

To perform this registration, the browser extension will dispatch a
[custom event](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) named `register` to
`window.massaWalletProvider`. The [detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail) property
of the event is an object with two attributes:

- providerName: the name of the wallet provider, for example 'Simple and versatile wallet'
- eventTarget: technical name used for the event target, for example 'simple-versatile-wallet'.

An [`EventTarge`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) will be created and dedicated to the
registered wallet provider and saved as an attribute of the `window` global variable. The attribute name starts with
'massaWalletProvider-' and is followed buy the given `eventTarget`, for example
'massaWalletProvider-simple-versatile-wallet'.

The browser extension can perform actions by listening for events on its event target. Here are the event names it needs
to listen for and the corresponding `CustomEvent.detail` object interface:

| Event name    | CustomEvent.detail                    |
|---------------|---------------------------------------|
| listAccounts  |                                       |
| deleteAccount | address :  string                     |
| importAccount | pubKey :  string ,  privKey :  string |
| balance       | address :  string                     |
| sign          | address :  string                     |



## Implementation

## Code sample

This section provides examples of how to use the Massa wallet-provider JS library from different perspectives.
We'll consider two potential users: Alice and Bob.

### Bob, the dApp developer

Bob wants to create a web page that can interact with any wallet provider within the Massa ecosystem.

Bob needs the ability to perform the following tasks:

- Determine if a wallet provider is available.
- Access the names of available wallet providers to personalize website messaging.
- Retrieve a list of all the accounts registered with each provider.
- Retrieve account information, such as address and balance.
- Perform actions on an account, such as signing a transaction or exporting an account.
- Remove a account from a provider.

To do this, he can use the Massa wallet-provider JS library:

```typescript
import { providers, Provider, Account, SignResult } from 'massa-wallet-provider';

async function interactWithMassaWallet() {
  // Get the available wallet providers
  const availableProviders: Provider[] = await providers();

  // Display the names of the available wallet providers on the website
  const providerNames: string[] = availableProviders.map(provider => provider.name());
  document.getElementById('provider-names').innerText = providerNames.join(', ');

  // Allow the user to select a wallet provider
  const selectedProvider: Provider = availableProviders[0];

  // Display the accounts registered with the selected provider on the website
  const accounts: Account[] = await selectedProvider.accounts();
  const accountAddresses: string[] = await Promise.all(accounts.map(async account => await account.address()));
  document.getElementById('account-addresses').innerText = accountAddresses.join(', ');

  // Allow the user to select an account
  const selectedAccount: Account = accounts[0];

  // Display the balance of the selected account on the website
  const accountBalance: BigInt = await selectedAccount.balance();
  document.getElementById('account-balance').innerText = accountBalance.toString();

  // Allow the user to sign a transaction
  const payload: Uint8Array = new Uint8Array([1, 2, 3]);
  const {pubKey, signature}: SignResult = await selectedAccount.sign(payload);
}
```

Bob can utilize our wallet-provider JS library, which provides the following classes:

```typescript
export async function providers(): Promise<Provider[]> { }

export interface SignResult {
  pubKey: string;
  signature: Uint8Array;
}

export class Account {
  async address(): Promise<string> { }

  async balance(): Promise<BigInt> { }

  async sign(payload: Uint8Array): Promise<SignResult> { }
}

export class Provider {
  name(): string { }

  async accounts(): Promise<Account[]> { }

  async importAccount(): Promise<Account> { }

  async deleteAccount(account: Account): Promise<void> { }
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
  listAccounts,
  deleteAccount,
  importAccount,
  balance,
  sign,
} from 'wallet-provider-content-script';

// Receive commands from the web page and respond to them accordingly
listAccounts(() => {
  // Handle listAccounts command from the web page
  const accounts = ['0x123456...', '0x789ABC...'];
  return accounts;
});

deleteAccount((address) => {
  // Handle deleteAccount command from the web page
  console.log(`Deleting account with address ${address}`);
});

importAccount((pubKey, privKey) => {
  // Handle importAccount command from the web page
  console.log(`Importing account with public key ${pubKey} and private key ${privKey}`);
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

export function listAccounts(callback: () => string[]): void {}

export function deleteAccount(callback: (address: string) => void): void {}

export function importAccount(callback: (pubKey: string, privKey: string) => void): void {}

export function balance(callback: (address: string) => BigInt): void {}

export function sign(callback: (address: string, payload: Uint8Array) => [string, Uint8Array]): void {}

```

### Constraints to solve by the provided lib

The library needs to provide a secure and efficient way to communicate between the page script and the content script,
which allows for multiple requests to be processed in parallel.

> _NOTE:_
>
> - The communication between the web page script and the content script is contained by the security model retained by
browsers. More information
[here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#communicating_with_the_web_page).
> - this is also true for the communication between the content script and the background script. More information
[here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#communicating_with_background_scripts)
or [here](https://developer.chrome.com/docs/extensions/mv3/messaging/).

To achieve this, we will use:

- An EventTarget attached to different window keys:
  - A generic massaWalletProvider for messages from the extension content script to the web page.
  - One per extension for messages from the web page to the content script.
- To allow multiple commands to be executed in parallel, we can set a correlation ID to each outgoing request that is
propagated in the response.

Here's some example code of massa-wallet-provider library that implements this approach in the webpage script:

```typescript

// global event target to use for all wallet provider
window.massaWalletProvider = new EventTarget()
registeredProviders = {}

// Register
window.massaWalletProvider.addEventListener('register', (payload) => {
  const extensionEventTarget = new EventTarget();
  window[`massaWalletProvider-${payload.eventTarget}`] = extensionEventTarget;
  registeredProviders[payload.providerName] = payload.eventTarget;
})

interface Message {
  params: object;
  requestId: string;
}

const availableCommands = ['ListAccounts', 'DeleteAccount', 'ImportAccount', 'Balance', 'Sign']

const pendingRequests = new Map<string, Function>();

//send a message from the webpage script to the content script
function sendMessageToContentScript(provider, command, params, responseCallback) {
  const requestId = uuidv4();
  const message: Message = { params, requestId };
  pendingRequests.set(requestId, responseCallback);

  if (!availableCommands.includes(command)) throw new Error('Unhandled command)

  window[`massaWalletProvider-${registeredProviders[provider]}`].dispatchEvent(
    new CustomEvent(command, { detail: message })
    );
}

//receive a response from the content script
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

window.massaWalletProvider.addEventListener('message', handleResponseFromContentScript);
```

Because it was requested, here a potential implementation of the `registerAsMassaWalletProvider` and `sign` in the
content script:

```typescript
interface RegistrationPayload {
  providerName: string;
  eventTarget: string;
}

function registerAsMassaWalletProvider(providerName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const registerProvider = () => {
      window.massaWalletProvider.dispatchEvent(
        new CustomEvent('register', {
          detail: { providerName: providerName, eventTarget: providerName } as RegistrationPayload
        })
      );
      resolve(true);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      registerProvider();
    } else {
      document.addEventListener('DOMContentLoaded', registerProvider);
    }
  });
}

const actionToCallback = new Map<string, Function>()

function sign(callback: Function): void {
  actionToCallback.set('sign', callback);
}

// and how the content script listen for commands
window[`massaWalletProvider-${eventTarget}`].addEventListener('sign', payload => {
  actionToCallback.get('sign')(...payload.detail.params);
})
```
