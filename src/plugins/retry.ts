import type { VKBridgeSend } from '../types/data.js';

import { backOff } from 'exponential-backoff';

import { getErrorCode } from './error.js';

const API_RETRY_CODES = [1, 3, 6, 9, 10];

export const pluginRetry = (send: VKBridgeSend): VKBridgeSend => {
  return (method, params) => {
    return backOff(() => send(method, params), {
      delayFirstAttempt: false,
      jitter: 'full',
      maxDelay: 10000,
      numOfAttempts: 6,
      startingDelay: 500,
      timeMultiple: 2,
      retry(e) {
        return API_RETRY_CODES.includes(getErrorCode(e));
      }
    });
  };
};
