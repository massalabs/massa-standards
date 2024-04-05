import {
  Client,
  WalletClient,
  IAccount,
  IBaseAccount,
  PublicApiClient,
  ProviderType,
  Web3Account,
  IEvent,
  EOperationStatus,
} from '@massalabs/massa-web3';
import { scheduler } from 'timers/promises';

export const WAIT_STATUS_TIMEOUT = 300000;
export const STATUS_POLL_INTERVAL_MS = 1000;

export const getClient = async (): Promise<{
  client: Client;
  account: IAccount;
  baseAccount: IBaseAccount;
  chainId: bigint;
}> => {
  if (!process.env.WALLET_PRIVATE_KEY) {
    throw new Error('WALLET_PRIVATE_KEY env variable is not set');
  }
  if (!process.env.JSON_RPC_URL_PUBLIC) {
    throw new Error('JSON_RPC_URL_PUBLIC env variable is not set');
  }
  const account = await WalletClient.getAccountFromSecretKey(
    process.env.WALLET_PRIVATE_KEY,
  );

  const clientConfig = {
    retryStrategyOn: true,
    providers: [
      { url: process.env.JSON_RPC_URL_PUBLIC, type: ProviderType.PUBLIC },
    ],
    periodOffset: 9,
  };

  const publicApi = new PublicApiClient(clientConfig);
  const status = await publicApi.getNodeStatus();

  const web3account = new Web3Account(account, publicApi, status.chain_id);
  const client = new Client(clientConfig, web3account, publicApi);
  return {
    client,
    account,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    baseAccount: client.wallet().getBaseAccount()!,
    chainId: status.chain_id,
  };
};


export const waitFinalOperation = async (
  client: Client,
  opId: string,
): Promise<IEvent[]> => {
  const start = Date.now();
  let counterMs = 0;
  while (counterMs < WAIT_STATUS_TIMEOUT) {
    const status = await client.smartContracts().getOperationStatus(opId);
    if (status === EOperationStatus.FINAL_SUCCESS) {
      console.log(`Operation ${opId} finished successfully!`);
      return getOperationEvents(client, opId);
    }
    if (
      status === EOperationStatus.FINAL_ERROR ||
      status === EOperationStatus.SPECULATIVE_ERROR
    ) {
      const events = await getOperationEvents(client, opId);
      if (!events.length) {
        console.log(
          `Operation ${opId} failed with no events! Try to increase maxGas`,
        );
      }
      events.map((l) => console.log(`>>>> New event: ${l.data}`));
      throw new Error(`Operation ended with errors...`);
    }

    await scheduler.wait(STATUS_POLL_INTERVAL_MS);
    counterMs = Date.now() - start;
  }
  const status = await client.smartContracts().getOperationStatus(opId);
  throw new Error(
    `Wait operation timeout... status=${EOperationStatus[status]}`,
  );
};

export async function getOperationEvents(
  client: Client,
  opId: string,
): Promise<IEvent[]> {
  return client.smartContracts().getFilteredScOutputEvents({
    start: null,
    end: null,
    original_caller_address: null,
    original_operation_id: opId,
    emitter_address: null,
    is_final: null,
  });
}
