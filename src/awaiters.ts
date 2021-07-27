import type { AnyHandler } from './types/common.js';

const context = window as unknown as Record<string, unknown>;
const awaiters: Record<string, AnyHandler | null> = {};
context.__awaiters = awaiters;

export { awaiters };
