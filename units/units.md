### Massa Units

All Massa values that are being used or returned by web3 (gas, fees, coins and rolls) are expressed via BigInt's. Massa-web3 has however a few convenience methods and converters that might come handy. Below is a summary and some examples of the latter:

- **Rolls**: expressed in BigInt's. For Rolls there is no metric system as rolls are unit-less. 10 rolls is to be represented by a BigInt containing 10. Example:
```ts
const rolls = BigInt(10);
// or. ...
const rolls = 10n;
```
- **Gas/MaxGas**: expressed in BigInt's. For Gas/MaxGas there is no metric system as gas is unit-less. The gas represents the computational units required for a given operation to be executed by the network. Example:
```ts
const gas = BigInt(2000000);
// or. ...
const gas = 2000000n;
```
- **Coins/Fees**: expressed in BigInt's. Coins/fees do however have a metric system behind them. The smallest unit is 10**-9 `Massa`. All coins/fees are to be expressed as integers scaled by 10**9 and this way consumed by the network json-rpc protocol. Since gas/fees are to be used as BigInt's web3 adds in a few convenience utils allowing smaller units (e.g. 0.5 `Massa`) to be expressed.

The util function `fromMAS` and `toMAS` are used exactly for the latter purpose.
`fromMAS` receives any amount of type `number | string | BigNumber | bigint` and returns a scaled `bigint` for ready use.
`toMAS` on the contrary converts any amount from `nanoMassa` to `Massa` and returns a `BigNumber` representing the amount as a decimal.

Examples:
```ts
const coinsToTransfer = fromMAS("0.5"); // half a massa
// or. ...
const coinsToTransfer = 500n * MassaUnits.mMassa; // half a massa
```

```ts
const coinsToTransfer = fromMAS("1"); // one massa
// or. ...
const coinsToTransfer = 1n * MassaUnits.oneMassa; // one massa
```

Web3 exposes a collection `MassaUnits` which has three convenience `BigInt` constants that could be used for amount scaling:

- `MassaUnits.oneMassa` = 10**9
- `MassaUnits.mMassa` = 10**6
- `MassaUnits.uMassa` = 10**3
