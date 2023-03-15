# Massa Units

**Authors:** G. Libert

**Status:** Effective

**Version:** 1.0

**History:**

| Date | Comment |
| ---- | ------- |
| 03/2023 | The standard is effective |

## Abstract

This specification defines the units used to measure the different objects of the Massa blockchain. It aims to provide a standardized format for the different units to offer the simplest and most readable user experience possible while being consistent from one application to another within our ecosystem.

> _NOTE:_ The manipulation of very large or very small numbers will be simplified by the use of [metric prefixes](https://en.wikipedia.org/wiki/Metric_prefix) of the [SI](https://en.wikipedia.org/wiki/International_System_of_Units).

## Targeted Audience

This specification is intended for developers who wish to interact with the Massa blockchain network using various tools and applications such as node API, smart contract tooling, dApps tooling, Thyra, and Thyra plugins.

## Units

### Massa coin

Massa coin is the name of the native coin on the Massa blockchain.
Massa coin is expressed as an unsigned 64-bit integer.

1 Massa is equivalent to 1,000,000,000 nanoMassa, the smallest unit of Massa coin.

To simplify usage, the following standard units implemenation are recommended:

- milliMassa (mMASSA): 1 milliMassa represents 1,000,000 nanoMassa and also 1/1000th of a Massa.
- microMassa (µMASSA): 1 microMassa represents 1,000 nanoMassa and also 1/1,000,000th of a Massa.
- nanoMassa (nMASSA): 1 nanoMassa represents the smallest unit of Massa coin and also 1/1,000,000,000th of a Massa.

### Gas

Gas is a virtual unit used to measure the computational complexity of executing transactions on the Massa blockchain. Each operation requires a certain amount of Gas, and the amount of Gas consumed is proportional to the computational complexity of the operation.
Gas is expressed as an unsigned 64-bit integer.

1 gas unit (GAS) is the smallest unit of gas.

To simplify usage, the following standard units implemenation are recommended:

- kiloGas (kGAS): 1 kiloGas represents 1,000 gas units.
- megaGas (MGAS): 1 megaGas represents 1,000 kGAS or 1,000,000 gas units.
- gigaGas (GGAS): 1 gigaGas represents 1,000 MGAS or 1,000,000 kGAS or 1,000,000,000 gas units.

### Roll

Roll is a specific token used for staking on the Massa blockchain. A Roll token is required to create and endorse a block on the blockchain. The probability of being drawn to create or endorse a block is correlated to the number of rolls possessed.
Roll is expressed as an unsigned 64-bit integer.

To simplify usage, the following standard units are recommended:

- kiloRoll (kROLL): 1 kiloRoll represents 1,000 rolls.
- megaRoll (MROLL): 1 megaRoll represents 1,000 kiloRolls or 1,000,000 rolls.

### Transaction Fee

A transaction fee is a small amount of Massa coin paid by the sender of a transaction to compensate the nodes in the Massa network for validating and executing the transaction.

Transaction fees are denominated in Massa coin and are paid by the sender in addition to the amount being transacted. The fee amount is determined by the sender and is included in the transaction data.

Note: Developers should use the same units implementation as for Massa coin values when handling transaction fee values.

## Usage

When interacting with the Massa blockchain and its objects, it is recommended to use the native types provided by the programming language when available. For instance, when working with the Massa coin, an unsigned 64-bit integer can be used to represent the coin's value.

To make code more readable and avoid errors, it is recommended to use useful constants such as mMASSA or kROLL to express values. For instance, to represent 1 milliMassa, one can write:

```text
const amount = 1 * mMASSA;
```

In JavaScript, which does not natively support unsigned 64-bit integers, the BigInt type should be used to represent Massa objects such as the Massa coin or Roll tokens. For example, to represent 1 Massa coin, one can write:

```javascript
const amount = 1n * mMASSA;
```

In programming languages that allow underscores to be used in numbers for better readability, such as TypeScript and Rust, it is recommended to use them when expressing Massa values. For example, to represent 12,500 milliMassa, one can write:

```typescript
const amount = 12_500n * mMASSA;
```
