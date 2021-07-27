import * as bridge from '../bridge.js';

const compat = Object.assign({}, bridge, {
  sendPromise: bridge.send
});

const context = window as unknown as Record<string, unknown>;

context.vkBridge = compat;
context.vkConnect = compat;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createBridge = (version: string) => {
  return compat;
};

export {
  compat as bridge,
  compat as default,
  createBridge
};
