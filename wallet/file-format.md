# Wallet file format standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/15>

**Authors:**

**Status:** Draft

**Version:** 0.1

## Abstract

## Motivation

## Specification

What needs to be specified:

- vocabulary: define Account, Wallet...
- algorithms used to hash, cipher privatekey

## Implementation

This section will be filled with links to reference implementations developed by MassaLabs.

## Code sample

### Reader point of view

The reader wants:

- to read the content of a file
- to get the key pair from that content
- ...

Here is how an application that wants to read a file would do:

```text
import unprotect from massa-wallet-file-utils

content = openFile('filename')

privateKey = unprotect('password', content)
...

```

### Writter point of view

The writter wants:

- to protect the private key (by encrypting it)
- to create a file
- ...

Here is how an application that wants to write a file would do:

```text
import protect from massa-wallet-file-utils

content = protect('password', privateKey)
content += ...

writeFileOnFileSystem(content)
```
