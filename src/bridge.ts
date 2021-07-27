import type { AnyHandler, VKBridgeContext } from './types/common.js';
import type { VKBridgeEvent, VKBridgeMethod, VKBridgeSend, VKBridgeSubscribeHandler } from './types/data.js';

import { assertSupport, isBridgeError, isBridgeEvent, nextId } from './utils.js';
import { awaiters } from './awaiters.js';

const context = window as unknown as VKBridgeContext;

/** Android VK Bridge interface. */
const android = context.AndroidBridge;

/** iOS VK Bridge interface. */
const ios = context.webkit && context.webkit.messageHandlers;

/** Native VK Bridge interface. */
const native = android || ios;

/**
 * Checks if a method is supported on runtime platform.
 *
 * @param method Method (event) name to check.
 * @returns Result of checking.
 */
const supports = (() => {
  if (native) {
    return <M extends string>(method: VKBridgeMethod<M>) => {
      return method in native;
    };
  }

  return () => {
    console.warn('support lookup is not supported yet');
    return false;
  };
})();

const handlers: VKBridgeSubscribeHandler[] = [];
const emit = (event: VKBridgeEvent) => {
  if (!isBridgeEvent(event)) {
    return;
  }

  const payload = event.detail.data;
  const id = payload.request_id as string;

  if (id && awaiters[id]) {
    (awaiters[id] as AnyHandler)(payload);
    awaiters[id] = null;
  }

  handlers.slice(0).forEach((handler) => {
    handler(event);
  });
};

// Subscribe to events
if (native) {
  window.addEventListener('VKWebAppEvent', emit as unknown as EventListener);
} else {
  window.addEventListener('message', (event) => {
    emit({ detail: event.data });
  });
}

/**
 * Adds an event listener. It will be called any time a data is received.
 *
 * @param listener A callback to be invoked on every event receive.
 */
const subscribe = (listener: VKBridgeSubscribeHandler) => {
  handlers.push(listener);
};

/**
 * Removes an event listener which has been subscribed for event listening.
 *
 * @param listener A callback to unsubscribe.
 */
const unsubscribe = (listener: VKBridgeSubscribeHandler) => {
  const index = handlers.indexOf(listener);
  if (index !== -1) {
    handlers.splice(index, 1);
  }
};

/** Sends events through runtime interface. */
export const invoke = (() => {
  if (android) {
    return (method: string, params: Record<string, unknown>) => {
      assertSupport(method);
      android[method](JSON.stringify(params));
    };
  }

  if (ios) {
    return (method: string, params: Record<string, unknown>) => {
      assertSupport(method);
      ios[method].postMessage(params);
    };
  }

  return (handler: string, params: Record<string, unknown>) => {
    window.parent.postMessage({
      type: 'vk-connect',
      handler,
      params
    }, '*');
  };
})();

const createAwaiter = (resolve: AnyHandler, reject: AnyHandler) => {
  return (payload: Record<string, unknown>) => {
    if (isBridgeError(payload)) {
      return reject(payload);
    }
    return resolve(payload);
  };
};

/**
 * Sends an event to the runtime env. In the case of Android/iOS application
 * env is the application itself. In the case of the browser, the parent
 * frame in which the event handlers is located.
 *
 * @param method The method (event) name to send
 * @param props Method properties
 */
const send: VKBridgeSend = (method, params) => {
  return new Promise((resolve, reject) => {
    const id = nextId();
    const safe: Record<string, unknown> = params == null ? {} : params;
    safe.request_id = id;
    awaiters[id] = createAwaiter(resolve as AnyHandler, reject);
    invoke(method, safe);
  });
};

/**
 * Checks whether the runtime is a WebView.
 *
 * @returns Result of checking.
 */
const isWebView = () => {
  return !!native;
};

/**
 * Checks whether the runtime is an iframe.
 *
 * @returns Result of checking.
 */
const isIframe = () => {
  return window.parent !== window;
};

/**
 * Checks whether the runtime is embedded.
 *
 * @returns Result of checking.
 */
const isEmbedded = () => {
  return isWebView() || isIframe();
};

/**
 * Checks whether the runtime is standalone.
 *
 * @returns Result of checking.
 */
const isStandalone = () => {
  return !isEmbedded();
};

export {
  send,
  subscribe,
  unsubscribe,
  supports,
  isWebView,
  isIframe,
  isEmbedded,
  isStandalone
};
