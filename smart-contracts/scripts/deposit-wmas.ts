import { getClient, waitFinalOperation } from './utils';
import { config } from 'dotenv';
config();

export async function deposit(fee:bigint, amount:bigint): Promise<void> {
  if(!process.env.WMAS_ADRS) {
    throw new Error('WMAS_ADRS env variable is not set');
  }
  const { client, baseAccount } = await getClient();
  let operationId = await client.smartContracts().callSmartContract(
    {
      fee: fee,
      maxGas: 2_100_000n,
      coins: amount,
      targetAddress: process.env.WMAS_ADRS,
      targetFunction: 'deposit',
      parameter: [],
    },
    baseAccount,
  );
  console.log(`deposit operationId: ${operationId}`);
  waitFinalOperation(client, operationId);

}