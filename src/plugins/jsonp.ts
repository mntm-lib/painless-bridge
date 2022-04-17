import type { VKBridgeMethodParams, VKBridgeSend } from '../types/data.js';
import type { AnyHandler, VKBridgeContext } from '../types/common.js';

import { nextId } from '../utils.js';

const context = window as unknown as VKBridgeContext;
const awaiters: Record<string, AnyHandler | null> = {};

context.__awaiters = awaiters;

// For internal use only
const stringifyParams = (params: Record<string, unknown>): string => {
  let result = '';

  for (const key in params) {
    const param = `${key}=${encodeURIComponent(`${params[key]}`)}`;

    if (result === '') {
      result = param;
    } else {
      result += `&${param}`;
    }
  }

  return result;
};

const sendJSONP = (params: Record<string, unknown>) => {
  return new Promise<any>((resolve, reject) => {
    const id = nextId();

    const apiParams = params as VKBridgeMethodParams<'VKWebAppCallAPIMethod'>;
    const requestParams = stringifyParams(apiParams.params);

    const src = `https://api.vk.com/method/${apiParams.method}?${requestParams}&callback=__awaiters.${id}`;

    const script = context.document.createElement('script');

    const remove = () => {
      // Sync => async
      requestAnimationFrame(() => {
        context.document.head.removeChild(script);
      });
    };

    const onerror = (error: Record<string, unknown>) => {
      remove();

      reject({
        error_type: 'api_error',
        error_data: {
          error_code: (error && (error.code || error.error_code)) || 1,
          error_msg: (error && (error.message || error.error_message || error.error_msg)) || 'Unknown error',
          request_params: requestParams.split('&').map(decodeURIComponent)
        }
      });
    };

    const onsuccess = (payload: Record<string, unknown>) => {
      remove();

      resolve(payload);
    };

    awaiters[id] = (payload: Record<string, unknown>) => {
      awaiters[id] = null;

      const safePayload = payload || {};

      if ('response' in safePayload) {
        onsuccess(safePayload);
      } else {
        onerror(safePayload.error as Record<string, unknown> || {});
      }
    };

    // Async but sync for src assigning
    context.document.head.appendChild(Object.assign(script, {
      id,
      src,
      async: true,
      importance: 'high',
      onerror
    }));
  });
};

export const pluginJSONP = (send: VKBridgeSend): VKBridgeSend => {
  return (method, params) => {
    if (method === 'VKWebAppCallAPIMethod') {
      const safe: Record<string, unknown> = params == null ? {} : params;

      return sendJSONP(safe);
    }

    return send(method, params);
  };
};
