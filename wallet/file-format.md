# Wallet file format standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/15>

**Authors:**

**Status:** Draft

**Version:** 0.1

## Abstract

## Motivation

## Specification

A wallet contains multiple accounts.

The specification define how an account is generated, protected and serialized.

**How keys are generated?**

Asymmetrical algorithm: Ed25519

This algorithm will create a private key and a public key.

**How the address is generated?**

1. compute the BLAKE3 hash of the public key
2. truncate to 256 bits
3. encode with Base58Check, provide the version (0)
4. add prefix "AU"

**What makes up an account?**

- nickname
- private key
- public key
- address
- salt
- nonce
- version

**How the private key is protected?**

The private key is encrypted with a symmetrical algorithm.

1. get a secret key from the user password and salt with PBKDF2
2. Galois Counter Mode (GCM) with nonce as initialization vector

**What is the purpose of the salt?**

The salt is used to protect the private key.

It's 16 bytes random array.

**What is nonce?**

It's 12 bytes random array.

**How the account is serialized?**

It is serialized in YAML:

```yaml
---
Version: 0
Nickname: wallet-nickname
Address: AU...
KeyPair:
  PrivateKey: ...
  PublicKey: ...
  Salt:
  - 57
  - 125
  - 102
  - 235
  - 118
  - 62
  - 21
  - 145
  - 126
  - 197
  - 242
  - 54
  - 145
  - 50
  - 178
  - 98
  Nonce:
  - 119
  - 196
  - 31
  - 33
  - 211
  - 243
  - 26
  - 58
  - 102
  - 180
  - 47
  - 57
```

with:

- Address: plain text address
- KeyPair.PrivateKey: cipher text of the private key
- KeyPair.PublicKey: plain text public key

## Implementation

This section will be filled with links to reference implementations developed by MassaLabs.

## Code sample

Here is a golang implementation:

**Generate key pair**:

```go
publicKey, privateKey, err := ed25519.GenerateKey(nil)
```

**Generate address:**

```go
publicKeyHash := blake3.Sum256(pubKeyBytes)
address := "AU" + base58.CheckEncode(publicKeyHash[:], Base58Version)
```

**Protect the secret key:**

TBD
