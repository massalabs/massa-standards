# Wallet <> DApp communication

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/13>

**Authors:** G.Libert, N.Seva

**Status:** Draft

**Version:** 0.1

## Abstract

This standard defines a protocol for communication between a cryptocurrency wallet and a decentralized application
(DApp) running in a web browser. The protocol provides a standard interface for DApps to request user authorization for
blockchain transactions, as well as a standard mechanism for wallets to sign and broadcast those transactions.
By following this standard, DApp developers can provide a seamless user experience for users of any wallet that
implements the protocol, while wallet developers can ensure that their products are compatible with a wide range of
DApps.

## Targeted Audience

This standard is targeted towards developers who are building decentralized applications (DApps) and cryptocurrency
wallets that need to interact with each other in a browser environment.

The standard assumes a working knowledge of web development and blockchain technology. It is also assumed that the
reader has experience with browser extensions and understands the basic principles of secure communication between web
pages and extensions.

> _NOTE:_ For more information on
[content scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts) and
[background scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts), see
[MDN's browser extensions pages](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions).

## Specification

### Event-Based Communication

Communication between the DApp and the wallet will use event-based messaging. There are two types of events:

- those used by the extension to communicate with the web page. Those events are triggered on a static target:
an invisible paragraph with id `massaWalletProvider` attached `document.body`.
- those used by the web page to communicate with the extension. Those events are triggered on a extension specific
target: an invisible paragraph with id `massaWalletProvider-<wallet provider name>` attached `document.body`.

> _NOTE:_ If the wallet provider is named AwesomeWallet, the target for this extension would obtain an id:
`window.massaWalletProvider-AwesomeWallet`; so in javascript: `document.getElementById(providerEventTargetName)()'massaWalletProvider-AwesomeWallet')` would point to this target.

### Commands

#### Register

This event is used by the extension to register itself to the webpage as a wallet provider.

<table><thead><tr>
<th>Direction</th>
<th>Type</th>
<th>Format</th>
<th>Example</th>
</tr></thead><tbody><tr>
<td>Extension to webpage</td>
<td><code>register</code></td><td>

```yaml
type: 
  object
properties:  
  address:
    type: string
required:
  - address
```

</td><td>

```json
{
  "id": "awesomeWalletprovider",
  "name": "Your Awesome Wallet Provider"
}
```

</td></tr></tbody></table>

#### Account

##### List

This event is used by the webpage to list known accounts by the extension.

<table>
<thead>
<tr>
<th>Direction</th>
<th>Type</th>
<th>Format</th>
<th>Example</th>
</tr>
</thead>
<tbody>
<tr>
<td>Webpage to extension</td>
<td><code>account.list</code></td>
<td>none</td>
<td><code>null</code></td>
</tr>
<tr>
<td>Extension to webpage</td>
<td><code>account.list.response</code></td>
<td>

```yaml
type: array
items:
  type: object
  properties:
    address:
      type: string
      format: base58check
    name:
      type: string
  required:
    - address
```

</td><td>
  
```json
[
  {
    "address": "A12...",
    "name": "Account 1"
  },
  {
    "address": "A12..."
  },
]
```

</td></tr></tbody></table>

##### Balance

<table>
<thead>
<tr>
<th>Direction</th>
<th>Type</th>
<th>Format</th>
<th>Example</th>
</tr>
</thead>
<tbody>
<tr>
<td>Webpage to extension</td>
<td><code>account.balance</code></td>
<td>

```yaml
type: object
properties:
  address:
    type: string
    format: base58check
required:
  - address
```

</td><td>

```json
{
  "address": "A12..."
}
```

</td></tr><tr>
<td>Extension to webpage</td>
<td><code>account.balance.response</code></td>
<td>

```yaml
type: object
properties:
  balance:
    type: string
    format: BigInt
required:
  - balance
```

</td><td>
  
```json
{
  "balance": "1000"
}
```

</td></tr></tbody></table>

##### Delete

<table>
<thead>
<tr>
<th>Direction</th>
<th>Type</th>
<th>Format</th>
<th>Example</th>
</tr>
</thead>
<tbody>
<tr>
<td>Webpage to extension</td>
<td><code>account.delete</code></td>
<td>

```yaml
type: object
properties:
  address:
    type: string
    format: base58check
required:
  - address
```

</td>
<td>

```json
{
  "address": "A12..."
}
```

</td>
</tr>
<tr>
<td>Extension to webpage</td>
<td><code>account.delete.response</code></td>
<td>

```yaml
type: object
properties:
  response:
    type: string
    enum: ["OK", "REFUSED", "ERROR"]
  message:
    type: string
required:
  - response
```

</td><td>
  
```json
{
  "response": "REFUSED"
}
```

</td></tr></tbody></table>

##### Import

<table>
<thead>
<tr>
<th>Direction</th>
<th>Type</th>
<th>Format</th>
<th>Example</th>
</tr>
</thead>
<tbody>
<tr>
<td>Webpage to extension</td>
<td><code>account.import</code></td>
<td>

```yaml
type: object
properties:
  privateKey:
    type: string
    format: base58check
  publicKey:
    type: string
    format: base58check
required:
  - privateKey
  - publicKey
```

</td><td>

```json
{
  "privateKey": "S12...",
  "publicKey": "P12...",
}
```

</td>
</tr>
<tr>
<td>Extension to webpage</td>
<td><code>account.import.response</code></td>
<td>

```yaml
type: object
properties:
  response:
    type: string
    enum: ["OK", "REFUSED", "ERROR"]
  message:
    type: string
required:
  - response
```

</td><td>
  
```json
{
  "response": "ERROR",
  "message": "No connection with blockchain"
}
```

</td>
</tr>
</tbody>
</table>

#### Sign

<table>
<thead>
<tr>
<th>Direction</th>
<th>Type</th>
<th>Format</th>
<th>Example</th>
</tr>
</thead>
<tbody>
<tr>
<td>Webpage to extension</td>
<td><code>account.sign</code></td>
<td>

```yaml
type: object
properties:
  address:
    type: string
    format: base58check
  data:
    type: array
    items:
      type: integer
      format: uint8
required:
  - address
  - data
```

</td>
<td>

```json
{
 "address": "A12...",
 "data": [49, 3, 255]
}
```

</td>
</tr>
<tr>
<td>Extension to webpage</td>
<td><code>account.sign.response</code></td>
<td>

```yaml
type: object
properties:
  signature:
    type: array
    items:
      type: integer
      format: uint8
  publicKey:
    type: string
    format: base58check
required:
  - signature
  - publicKey
```

</td><td>
  
```json
{
 "signature": [49, 3, 255],
 "publicKey": "P12..."
}
```

</td>
</tr>
</tbody>
</table>

### Security Considerations

- The wallet provider must validate all inputs before performing any action.
- The webpage must validate all input before processing any action.
- The extension should ensure that communication is restricted to the intended parties and prevent any third-party
intervention.
- The wallet provider should be built with security as a primary concern, including measures such as encryption,
authentication, and authorization to prevent unauthorized access or data breaches.

## Implementation

This section will be filled with links to reference implementations developed by MassaLabs.

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

Alice wants to create a browser extension that can interact with the Massa ecosystem using the wallet-provider JS
library.
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
  const MASSA_WINDOW_OBJECT = 'massaWalletProvider';

  // global event target mapping to be used for all wallet providers
  registeredProviders = {}
  // a callback bench mapping request id to a callback function
  const pendingRequests = new Map<string, Function>();

  // add an invisible HTML element and set a listener to it like the following
  const inv = document.createElement('p');
  inv.id = MASSA_WINDOW_OBJECT;
  inv.setAttribute('style', 'display:none');
  document.body.appendChild(inv);

  // start listening to messages from content script with the MASSA_WINDOW_OBJECT
  // being the target for receiving these messages
  document
  .getElementById(MASSA_WINDOW_OBJECT)
  .addEventListener(
    'message',
    this.handleResponseFromContentScript.bind(this),
  );

  // hook up register handler
  document
    .getElementById(MASSA_WINDOW_OBJECT)
    .addEventListener('register', (evt: CustomEvent) => {
      const payload: IRegisterEvent = evt.detail;
      const providerEventTargetName = `${MASSA_WINDOW_OBJECT}_${payload.providerName}`;
      this.registeredProviders[payload.providerName] = providerEventTargetName;
    });

  export enum AvailableCommands {
    ProviderListAccounts = 'LIST_ACCOUNTS',
    ProviderDeleteAccount = 'DELETE_ACCOUNT',
    ProviderImportAccount = 'IMPORT_ACCOUNT',
    AccountBalance = 'ACCOUNT_BALANCE',
    AccountSign = 'ACCOUNT_SIGN',
  }

  // send a message from the webpage script to the content script
  function sendMessageToContentScript(
    providerName: string,
    command: AvailableCommands,
    params: AllowedRequests,
    responseCallback: CallbackFunction,
  ) {
    if (!Object.values(AvailableCommands).includes(command)) {
      throw new Error(`Unknown command ${command}`);
    }

    const requestId = uid();
    const eventMessageRequest: ICustomEventMessageRequest = {
      params,
      requestId,
    };
    this.pendingRequests.set(requestId, responseCallback);

    // dispatch an event to the specific provider event target
    const specificProviderEventTarget = document.getElementById(
      `${this.registeredProviders[providerName]}`,
    ) as EventTarget;

    specificProviderEventTarget.dispatchEvent(
      new CustomEvent(command, { detail: eventMessageRequest }),
    );
  }

  //receive a response from the content script
  function handleResponseFromContentScript(event) {
  const { result, error, requestId }: ICustomEventMessageResponse = event.detail;

      const responseCallback: CallbackFunction = this.pendingRequests.get(requestId);

      if (responseCallback) {
        if (error) {
          responseCallback(null, new Error(error.message));
        } else {
          responseCallback(result, null);
        }
        const deleted = this.pendingRequests.delete(requestId);
        if (!deleted) {
          console.error(`Error deleting a pending request with id ${requestId}`);
        }
      } else {
        console.error(
          `Request Id ${requestId} not found in response callback map`,
        );
      }
  }
```

Because it was requested, here a potential implementation of the `registerAsMassaWalletProvider` and `sign` in the
content script:

```typescript

  const providerName = "PROVIDER_NAME";
  // a bench with callbacks
  const actionToCallback = new Map<string, Function>()

  // the current provider has to create an invisible html element for communication with the web script
  const providerEventTargetName = `${MASSA_WINDOW_OBJECT}_${providerName}`;
  if (!document.getElementById(providerEventTargetName)) {
    const inv = document.createElement('p');
    inv.id = providerEventTargetName;
    document.body.appendChild(inv);
  }

  // an event handler needs to be attached to that element we can listen to dispatched command for signing from the web-script
  document.getElementById(providerEventTargetName)
  .addEventListener(AvailableCommands.AccountSign, (evt: CustomEvent) => {
    const payload: ICustomEventMessageRequest = evt.detail;
    // execute callback with the received payload
    this.actionToCallback.get(AvailableCommands.AccountSign)(payload);
  });

  // we also need to map the callback handler to the given command so that we can reply back to the webscript over the `message` event
  actionToCallback.set(AvailableCommands.AccountSign, async (payload: ICustomEventMessageRequest) => {
      const accountSignPayload = payload.params as IAccountSignRequest;
      const respMessage = {
        result: await this.sign(accountSignPayload),
        error: null,
        requestId: payload.requestId,
      } as ICustomEventMessageResponse;
      // answer to the message target
      document.getElementById(MASSA_WINDOW_OBJECT).dispatchEvent(
        new CustomEvent('message', { detail: respMessage }),
      );
    }
  )

  // this method is to be called the moment the content script is injected with the give provider name
  // so the content-script can register itself and be made known to the wallet-providers on the web script side.
  function async registerAsMassaWalletProvider(
    providerName: string,
  ): Promise<boolean> {
      return new Promise((resolve) => {
        const registerProvider = () => {
          if (!document.getElementById(MASSA_WINDOW_OBJECT)) {
            return resolve(false);
          }

          // answer to the register target
          const isRegisterEventSent = document
            .getElementById(MASSA_WINDOW_OBJECT)
            .dispatchEvent(
              new CustomEvent('register', {
                detail: {
                  providerName: providerName,
                  eventTarget: providerName,
                } as IRegisterEvent,
              }),
            );
          return resolve(isRegisterEventSent);
        };

        if (
          document.readyState === 'complete' ||
          document.readyState === 'interactive'
        ) {
          registerProvider();
        } else {
          document.addEventListener('DOMContentLoaded', registerProvider);
        }
      })
    }
```
