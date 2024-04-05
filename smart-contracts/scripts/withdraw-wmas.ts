import { Args } from '@massalabs/massa-web3';
import { getClient, waitFinalOperation } from './utils';
import { config } from 'dotenv';
config();

export async function withdraw(fee: bigint, amount:bigint, withdrawer: string): Promise<void> {
  if(!process.env.WMAS_ADRS) {
    throw new Error('WMAS_ADRS env variable is not set');
  }
  const { client, baseAccount } = await getClient();
  let operationId = await client.smartContracts().callSmartContract(
    {
      fee: fee,
      maxGas: 2_100_000n,
      coins: 0n,
      targetAddress: process.env.WMAS_ADRS,
      targetFunction: 'withdraw',
      parameter: new Args()
        .addU64(amount)
        .addString(withdrawer)
        .serialize(),
    },
    baseAccount,
  );
  console.log(`withdraw operationId: ${operationId}`);
  waitFinalOperation(client, operationId);
}