import { generateEvent } from '@massalabs/massa-as-sdk';

const ERROR_PREFIX = 'ERROR';

/**
 * Creates an event prefixing it with an error prefix
 * @param reason - the error context
 */
export function triggerError(reason: string): void {
  generateEvent(`${ERROR_PREFIX} : ${reason}`);
  assert(false, reason);
}
