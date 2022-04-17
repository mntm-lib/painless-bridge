import type { VKBridgeSend } from './types/data.js';

import { pluginError } from './plugins/error.js';
import { pluginJSONP } from './plugins/jsonp.js';
import { pluginStorage } from './plugins/storage.js';
import { pluginToken } from './plugins/token.js';

export const painless = (send: VKBridgeSend): VKBridgeSend => {
  /* eslint-disable sonarjs/prefer-immediate-return */

  // Order is important
  const withJSONP = pluginJSONP(send);
  const withStorage = pluginStorage(withJSONP);
  const withToken = pluginToken(withStorage);
  const withError = pluginError(withToken);

  return withError;
};
