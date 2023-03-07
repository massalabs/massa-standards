# Wallet-DApp communication standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/13>

## Abstract

## Motivation

## Specification

Here is pseudo code for the two points of view:

- browser extension developer
- dapp builder

**As a browser extension developer, I would write...**

browser extension code:

```text
// the extension register itself
window.massaWalletProvider.addEventListener('loaded', () => {
  window.massaWalletProvider.emit('register', {
    ProviderName: "bearby",
    htmlObject: "window.bearyWalletProvider"
  })
})
```

**Code snippet of massa javascript (or typescript) library:**

```text
registeredProviders = []

// we start by listening register event
window.massaWalletProvider.addEventListener('register', (payload) => {
  registeredProviders.push(payload)
})

window.massaWalletProvider.emit('loaded') // all wallet will catch this event and emit register event
```

**As a dapp builder, I would write...**

```text
providers Provider[] = await massa-library.listWalletProviders()

for each providers as p
  for each p.listWallets as wallet
    print wallet.getAddress()
    print wallet.getBalance()

wallet = providers.listWallets()[0]
pkey, signature = await wallet.sign([...])
```

**Code snippet of massa javascript (or typescript) library:**

```text
export function listWalletProviders() {...}

export class Wallet {
  getAddress() {...}
  getBalance() {...}
  sign(payload: bytes): (string, bytes) {...}
}

export class Provider {
  listWallets() {...}
  sayHello() {...}
}
```

## Implementation
