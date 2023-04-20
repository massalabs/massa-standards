# Wallet <> DApp communication

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/13>

**Authors:** G.Libert, N.Seva

**Status:** Draft

**Version:** 0.3

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

To facilitate communication between a DApp and a wallet, an event-based messaging system will be employed. There are two types of events that can be used in this system:

1. Events used by the wallet extension to communicate with the web page. These events are triggered on a static target, specifically an invisible HTML element that is attached to the document body and assigned an ID of `massaWalletProvider`.

2. Events used by the web page to communicate with the wallet extension. These events are triggered on an extension-specific target, which is an invisible HTML element with an ID of `massaWalletProvider-<wallet provider name>`, also attached to the document body.


For instance, if the wallet provider name is "AwesomeWallet," the second target ID for this extension would be the element returned by `document.getElementById('massaWalletProvider-AwesomeWallet')`.

It's worth noting that this implementation follows the considerations set forth by Mozilla in [this section](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#using_window.postmessage_in_extensions_non-standard).

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
  finalBalance:
    type: string
    format: BigInt
  candidateBalance:
    type: string
    format: BigInt
required:
  - finalBalance
  - candidateBalance
```

</td><td>
  
```json
{
  "finalBalance": "1000",
  "currentBalance": "10"
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

#### Rolls

##### Sell

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
<td><code>account.sellRolls</code></td>
<td>

```yaml
type: object
properties:
  fee:
    type: string
    format: BigInt
  amount:
    type: string
    format: BigInt
required:
  - fee
  - amount
```

</td><td>
  
```json
{
 "fee": "12000000",
 "amount": "10"
}
```

</td>
</tr>



<tr>
<td>Extension to webpage</td>
<td><code>account.sellRolls.response</code></td>
<td>

```yaml
type: object
properties:
  operationId:
    type: string
required:
  - operationId
```

</td><td>
  
```json
{
 "operationId": "O1sBc7PanPjB8tEadNC4t4GGPFM5kqC8yTKqwzHHV9q7FksuBoE"
}
```

</td>
</tr>



</tbody>
</table>

##### Buy

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
<td><code>account.buyRolls</code></td>
<td>

```yaml
type: object
properties:
  fee:
    type: string
    format: BigInt
  amount:
    type: string
    format: BigInt
required:
  - fee
  - amount
```

</td><td>
  
```json
{
 "fee": "12000000",
 "amount": "10"
}
```

</td>
</tr>



<tr>
<td>Extension to webpage</td>
<td><code>account.buyRolls.response</code></td>
<td>

```yaml
type: object
properties:
  operationId:
    type: string
required:
  - operationId
```

</td><td>
  
```json
{
 "operationId": "O1sBc7PanPjB8tEadNC4t4GGPFM5kqC8yTKqwzHHV9q7FksuBoE"
}
```

</td>
</tr>



</tbody>
</table>

#### Transaction

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
<td><code>account.sendTransaction</code></td>
<td>

```yaml
type: object
properties:
  fee:
    type: string
    format: BigInt
  amount:
    type: string
    format: BigInt
  recipientAddress:
    type: string
required:
  - fee
  - amount
  - recipientAddress
```

</td><td>
  
```json
{
 "fee": "12000000",
 "amount": "2000000000",
 "recipientAddress": "AU19tCSKtiE4k9MJLyLH5sWGDZ7Rr2SiBf1ti3XqeCptwsXGvkef"
}
```

</td>
</tr>



<tr>
<td>Extension to webpage</td>
<td><code>account.sendTransaction.response</code></td>
<td>

```yaml
type: object
properties:
  operationId:
    type: string
required:
  - operationId
```

</td><td>
  
```json
{
 "operationId": "O1sBc7PanPjB8tEadNC4t4GGPFM5kqC8yTKqwzHHV9q7FksuBoE"
}
```

</td>
</tr>



</tbody>
</table>

#### Node URLs

This method is used to get the node URLs known by the extension.

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
<td><code>Provider.getNodeUrls</code></td>
<td>none</td>
<td><code>null</code></td>
</tr>
<tr>
<td>Extension to webpage</td>
<td><code>Provider.getNodeUrls.response</code></td>
<td>

```yaml
type: array
items:  
    type: string
    format: URL
```

</td><td>
  
```json
[
  "http://localhost:1234", 
  "https://massa-nodes.net"
]
```

</td>
</tr>
</tbody>
</table>

#### Generating New Accounts

This method will generate a new account upon request with a specified name defined by the user. The account shall be added to the wallet automatically.

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
<td><code>account.generateNewAccount</code></td>
<td>

```yaml
type: object
properties:
  name:
    type: string
```

</td><td>
  
```json
{
 "name": "my-trading-account"
}
```

</td>
</tr>


<tr>
<td>Extension to webpage</td>
<td><code>account.generateNewAccount.response</code></td>
<td>

```yaml
type: object
properties:
  name:
    type: string
  address:
    type: string
required:
  - address
```

</td><td>
  
```json
{
 "name": "my-trading-account",
 "address": "AU12..."
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

The Massalabs implementation  of this standard can be found on GitHub at https://github.com/massalabs/wallet-provider.

### Usage from a DApp point of view

Here's an example of how to use it:

```javascript
import { providers } from "@massalabs/wallet-provider";

// Get all available Massa wallet providers.
const availableProviders = providers();

// Get a provider.
const myProvider = availableProviders[0];

// Import an account via the Massa wallet provider.
const privateKey = "Sxxxxxxxxxxxxxx";
const publicKey = "Pxxxxxxxxxxxxxxx";
await myProvider.importAccount(publicKey, privateKey);

// Get accounts.
const myAccounts = await myProvider.accounts();

// Get one account.
const myAccount = myAccounts[0];

// Get the account's address.
const accountAddress = myAccount.address();

// Get the account's balances.
const accountBalance = await myAccount.balance();

// Sign a message.
const signature = await myAccount.sign([0, 1, 2]);

// Delete an account.
await myProvider.importAccount(myAccount.address());

// Get nodes url
const urls = await myProvider.getNodeUrls();

// buy rolls
const buyOperationId = await myAccount.buyRolls("10", "12000000");

// sell rolls
const sellOperationId = await myAccount.sellRolls("3", "12000000");

// send transaction
const sendTransactionId = await myAccount.sendTransaction("2000000000", "AU19tCSKtiE4k9MJLyLH5sWGDZ7Rr2SiBf1ti3XqeCptwsXGvkef", "12000000");

// generate and add a new random account
const newAccountDetails = await myProvider.generateNewAccount("my-trading-account");
```
