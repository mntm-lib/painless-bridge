import type { VKBridgeMethodResult, VKBridgeSend } from '../types/data.js';

export const pluginStorage = (send: VKBridgeSend): VKBridgeSend => {
  return (method, params) => {
    if (method === 'VKWebAppStorageGet') {
      return send(method, params).then((payload) => {
        return Promise.all((payload as VKBridgeMethodResult<'VKWebAppStorageGet'>).keys.map((pair) => {
          return send('VKWebAppStorageSet', pair);
        })).then(() => payload, () => payload);
      });
    }

    return send(method, params);
  };
};
