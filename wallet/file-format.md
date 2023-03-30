# Wallet file format standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/15>

**Authors:** N. Seva, G. Libert, V. Deshpande

**Status:** Review

**Version:** 0.1

## Introduction

The Wallet file format standard provides a specification for protection and serialization of accounts within a wallet. This standard doesn't specify the address object nor the cryptography used by the Massa blockchain to sign operation.

### Targeted Audience

This specification is intended for software developers, security professionals, and organizations who are developing or implementing wallet software.

### Vocabulary

**Account:** A collection of information that represents a user's identity.

**Wallet:** An application handling multiple accounts and offering multiple services such as signing transactions or access to the blockchain.

**Salt:** A random sequence of bytes used as an additional input to a key derivation function.

**Nonce:** A random sequence of bytes used as an initialization vector for symmetric encryption.

**Private key:** A key used to sign transactions and authenticate the account holder.

**Public key:** A key used to identify the account holder and verify digital signatures generated using a private key.

**Address:** A unique identifier that represents the account.

**YAML:** A human-readable data serialization format.

## Specification

### Cryptography

#### PBKDF2

To protect the private key, a symmetric key is derived from the user password using the PBKDF2 algorithm, as defined in IETF [RFC 2898](https://www.ietf.org/rfc/rfc2898.txt).

> _NOTE:_ The user input password is first converted to bytes using utf-8 encoding before passing it to PBKDF2.

Specifically, the PBKDF2 arguments defined in section 5.2 of the aforementioned standard must follow the followings:

- 16-byte salt,
- 600,000 iterations, and a
- derived key length of 32 bytes.

The hash function utilized in this process is SHA-256, as specified in the NIST [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf) document.

These values align with the recommendations set forth in the NIST [Special Publication 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf)
and [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2). 

#### AES-GCM

After deriving the symmetric key (the derived key from PBKDF2), the account's private key is encrypted using AES-256 with Galois/Counter Mode (GCM), as defined by the NIST in the [Special Publication 800-38D](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-38d.pdf). The AES-256 algorithm is specified in the NIST [FIPS 197](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.197.pdf) document.

##### Nonce
The nonce, used as initialization vector for AES-GCM, must have a size of 96 bits (12 bytes) as recommended in Special Publication 800-38D.

##### Authentication tag

The authentication tag is appended to the end of the ciphered private key.

The size of the authentication tag is 16 bytes (128 bits).

### Serialization

An account, in a serialized form, consists of various components, including the account's private and public keys, a salt, a nonce, a version, and optionally, an address and nickname to aid in wallet recognition.
The account should be serialized using YAML to enable human readability of the file's contents, particularly the address and nickname.

The following table summarize the format:

| Field | Presence | Format | Comment | Example |
| ----- | -------- | ------ | ------- | ------- |
| Version | Mandatory | Integer | Entire part of this specification version | 0 |
| Nickname | Optional | String || "Savings" |
| Address | Optional | String || "AU12..." |
| Salt | Mandatory | Byte array | Salt for PBKDF2 (16 Bytes) | [57, 125, 102, 235, 118, 62, 21, 145, 126, 197, 242, 54, 145, 50, 178, 98] |
| Nonce | Mandatory | Byte array | Initialization Vector (12 Bytes) for AES-GCM | [119, 196, 31, 33, 211, 243, 26, 58, 102, 180, 47, 57] |
| CipheredData | Mandatory | Byte array | Ciphered Private Key Bytes (using AES-GCM) followed by Authentication Tag (16 Bytes) | [17, 42 ...] |
| PublicKey | Mandatory | Byte array || [21, 126 ...] |

#### Example

Here is an example of YAML serialization:

```yaml
---
Version: 0
Nickname: Savings
Address: AU12...
Salt: [57, 125, 102, 235, 118, 62, 21, 145, 126, 197, 242, 54, 145, 50, 178, 98]
Nonce: [119, 196, 31, 33, 211, 243, 26, 58, 102, 180, 47, 57]
CipheredData: [17, 42, ...]
PublicKey: [21, 126, ...]
```
#### Decryption of the Private Key

In order to decrypt the private key, following steps are followed:
1. User inputs a password.
2. Password is converted to bytes (utf-8 encoding).
3. Symmetric key is derived using PBKDF2 with this password (bytes) and the salt (bytes) as input.
4. This derived symmetric key is then used as AES-GCM Key along with the nonce (IV) to decrypt the ciphered private key.
5. The authentication tag at the end of ciphered data checks if the derived symmetric key used in point 4. is right.

## Security Concerns

The wallet file format specification aims to ensure the security and integrity of user accounts. Then, several security concerns must be taken into account:

### Encryption and Decryption

The encryption and decryption of the private key must be performed correctly to ensure the confidentiality and integrity of the account. If the encryption algorithm or key derivation function is weak, the private key may be vulnerable to attacks. It is therefore crucial to use strong and proven encryption algorithms and key derivation functions.

### Salt Generation

The generation of random and unpredictable values for the salt is critical in protecting the private key. If the values are not truly random or can be easily guessed, the encryption of the private key may be compromised. It is therefore essential to use a robust and reliable method.

### Password Strength

The strength of the user's password is crucial to the security of the wallet. If the password is weak or easily guessable, the private key's confidentiality may be compromised. Therefore, it is essential to educate users on creating strong passwords and implementing password policies that enforce minimum complexity requirements.

## Implementation

This section will be updated with links to reference implementations developed by MassaLabs.
These implementations will follow the wallet file format specification to ensure compatibility across different platforms.

By providing these references, we aim to facilitate adoption and promote security and interoperability.
