# Wallet-DApp communication standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/13>

## Abstract

## Motivation

## Specification

Here is pseudo code for the two points of view:

- browser extension developer
- dapp builder

**As a browser extension developer, I would write...**

browser extension code, [content script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts):

```text
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

window.bearbyWalletProvider.addEventListener('sign', () => {
  // validate the inputs
  ...

  // ask the background script to sign
  browser.runtime.sendMessage({...})
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

```text
browser.runtime.onMessage.addListener((message, sender, response) => {
  switch massage.command.name:
    case 'sign':
      return new Promise() // aks user authorization and password, sign message payload, return pkey and signature
      break
});
```

**Code snippet of massa javascript (or typescript) library:**

```text
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
  construct(private eventTargetName) {}

  function sign(payload) {
    const action = {
      correlationId: uuid() // pick a correlation id to track the sign message request, it can simply be a int incremented
      payload,
      response: null
    }
    actions.push(action)

    // listen for the response
    window[eventTargetName].addEventListener('signed', ({ pkey, signature, correlationId }) => {
      actions.find(a => a.correlationId == correlationId).response = { pkey, signature }
    })

    // trigger the signature
    window[eventTargetName].dispatchEvent(new CustomEvent('sign', action))

    return new Promise((resole, reject) => {
      // reject in 60 seconds to not let the user wait for hours
      setTimeOut(() => {
        reject('event timeout')
      }, 60000)

      setInterval(() => {
        if (action.response != null) {
          resolve(action.response) // here we define what Wallet.sign will return when doing await on it
        } 
      }, 500)
    })
  }
}

```

**As a dapp builder, I would write...**

```text
providers: [] = await massa-js-library.listWalletProviders()

for each providers as p
  for each p.wallets as wallet
    print wallet.getAddress()
    print wallet.getBalance()

wallet = providers.listWallets()[0]
pkey, signature = await wallet.sign([0, ...])
.then(response => {
  { pkey, signature } = response
  console.log(pkey)
  console.log(signature)
})

```

**Code snippet of massa javascript (or typescript) library:**

```text
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

## Implementation
