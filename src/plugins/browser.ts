import * as bridge from '../bridge.js';

const context = window as unknown as Record<string, unknown>;

context.vkBridge = bridge;
context.vkConnect = bridge;
