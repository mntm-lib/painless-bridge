import type { AnyHandler } from '../types/common.js';
import type { VKBridgeSend } from '../types/data.js';

import { USER_DENIED } from './error.js';

import { awaiters, isBridgeError, nextId } from '../utils.js';
import { invoke } from '../bridge.js';

const isScopeIdentical = (requested: string, received: string) => {
  if (requested && received && requested !== received) {
    const requestedScopes = requested.split(',');
    const receivedScopes = received.split(',');

    for (let i = requestedScopes.length; i--;) {
      if (!receivedScopes.includes(requestedScopes[i])) {
        return false;
      }
    }
  }

  return true;
};

const createTokenAwaiter = (params: Record<string, unknown>, resolve: AnyHandler, reject: AnyHandler) => {
  return (payload: Record<string, unknown>) => {
    if (isBridgeError(payload)) {
      return reject(payload);
    }

    if (!payload.access_token) {
      return reject(USER_DENIED);
    }

    if (!isScopeIdentical(params.scope as string, payload.scope as string)) {
      return reject(USER_DENIED);
    }

    payload.scope = params.scope;

    return resolve(payload);
  };
};

export const pluginToken = (send: VKBridgeSend): VKBridgeSend => {
  return (method, params) => {
    if (method === 'VKWebAppGetAuthToken' || method === 'VKWebAppGetCommunityToken') {
      return new Promise((resolve, reject) => {
        const safe = Object.assign({ request_id: nextId(), scope: '' }, params);

        awaiters.set(safe.request_id, createTokenAwaiter(safe, resolve as AnyHandler, reject));

        invoke(method, safe);
      });
    }

    return send(method, params);
  };
};
