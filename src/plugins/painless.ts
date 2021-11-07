import type { VKBridgeSend } from '../types/data.js';

import { pluginError } from './error.js';
import { pluginJSONP } from './jsonp.js';
import { pluginStorage } from './storage.js';
import { pluginToken } from './token.js';

export const pluginPainless = (send: VKBridgeSend): VKBridgeSend => {
  /* eslint-disable sonarjs/prefer-immediate-return */

  // Order is important
  const withJSONP = pluginJSONP(send);
  const withStorage = pluginStorage(withJSONP);
  const withToken = pluginToken(withStorage);
  const withError = pluginError(withToken);

  return withError;
};
