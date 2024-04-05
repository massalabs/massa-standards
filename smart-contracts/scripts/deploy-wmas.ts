import { readFileSync } from 'fs';
import path from 'path';
import { deploySC } from '@massalabs/massa-sc-deployer';
import { Args, fromMAS } from '@massalabs/web3-utils';
import { getClient } from './utils';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

const { account, chainId } = await getClient();

if (!process.env.JSON_RPC_URL_PUBLIC) {
  throw new Error('JSON_RPC_URL_PUBLIC env variable is not set');
}
await deploySC(
  process.env.JSON_RPC_URL_PUBLIC,
  account,
  [
    {
      data: readFileSync(path.join(__dirname, '..', 'smart-contracts/build', 'WMAS.wasm')),
      coins: fromMAS(0.0255),
      args: new Args()
        .addString('Wrapped Massa')
        .addString('WMAS')
        .addU8(9)
        .addU256(0n),
    },
  ],
  chainId,
  0n,
  1_000_000_000n,
  true,
);
