import type { VKBridgeMethodParams, VKBridgeSend } from '../types/data.js';
import type { AnyHandler } from '../types/common.js';

import { nextId } from '../utils.js';
import { params } from './params.js';

const context = window as unknown as Record<string, unknown>;
const awaiters: Record<string, AnyHandler | null> = {};

context.__awaiters = awaiters;

// Detecting lang for API or fallback to user default
const langParam = params.language ? `&lang=${params.language}` : '';

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
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const id = nextId();

    const apiParams = params as VKBridgeMethodParams<'VKWebAppCallAPIMethod'>;
    const requestParams = stringifyParams(apiParams.params);

    const src = `https://api.vk.com/method/${apiParams.method}?${requestParams}${langParam}&callback=__awaiters.${id}`;

    const script = document.createElement('script');

    const remove = () => {
      // Sync => async
      requestAnimationFrame(() => {
        document.head.removeChild(script);
      });
    };

    const onerror = (error: Record<string, unknown>) => {
      remove();

      reject({
        error_type: 'api_error',
        error_data: {
          error_code: (error && error.code) || 1,
          error_msg: (error && error.message) || 'Unknown error',
          request_params: requestParams.split('&').map((param) => decodeURIComponent(param))
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
    document.head.appendChild(Object.assign(script, {
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

      return sendJSONP(safe) as Promise<any>;
    }

    return send(method, params);
  };
};
