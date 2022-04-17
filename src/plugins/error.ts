import type { ErrorData, ErrorDataFullSpec, VKBridgeSend } from '../types/data.js';

import { isBridgeError } from '../utils.js';

const createErrorData = (error_type: string, error_code: number, error_reason: string) => {
  return {
    error_type,
    error_data: {
      error_code,
      error_reason
    }
  } as ErrorData;
};

export const UNKNOWN_ERROR =
  createErrorData('client_error', 1, 'Unknown error');
export const NETWORK_ERROR =
  createErrorData('client_error', 3, 'Connection lost');
export const USER_DENIED =
  createErrorData('client_error', 4, 'User denied');
export const UNSUPPORTED_PLATFORM =
  createErrorData('client_error', 6, 'Unsupported platform');

const getError = (error?: Record<string, unknown>): ErrorDataFullSpec => {
  // Native client error
  if (error == null || typeof error !== 'object' || !isBridgeError(error)) {
    return UNKNOWN_ERROR;
  }

  // Make safe
  return Object.assign({}, UNKNOWN_ERROR, error);
};

/** Gets error reason with fallback. */
export const getErrorReason = (unsafe?: Record<string, unknown>) => {
  const error = getError(unsafe);

  return error.error_data.error_reason || '';
};

/** Gets the deepest error type. */
export const getErrorType = (unsafe?: Record<string, unknown>): string => {
  const error = getError(unsafe);
  const error_reason = getErrorReason(error);

  return (error_reason as Record<string, string>).error_type || error.error_type;
};

/** Gets the deepest error code. */
export const getErrorCode = (unsafe?: Record<string, unknown>): number => {
  const error = getError(unsafe);
  const error_reason = getErrorReason(error);

  return (typeof error_reason === 'object' && (error_reason.code || error_reason.error_code)) || error.error_data.error_code || 1;
};

const isNetworkReason = (msg?: string) => {
  return msg === 'Network error' || msg === 'Connection lost';
};

const API_DENIED_CODES = [7, 15, 24, 27, 28, 200, 201, 203];
const isDeniedByAPI = (code?: number) => {
  return API_DENIED_CODES.includes(code!);
};

const CLIENT_DENIED_CODES = [4, 7, 8];
const isDeniedByClient = (code?: number) => {
  return CLIENT_DENIED_CODES.includes(code!);
};

/** Casts edge case errors to proper ones. */
export const castError = (unsafe?: Record<string, unknown>): ErrorData => {
  const error = getError(unsafe);

  const error_reason = getErrorReason(error);
  const error_type = getErrorType(error);
  const error_code = getErrorCode(error);

  const error_data = error.error_data;

  let has_params = 'request_params' in error_data;

  const msgs = [
    error_data.error,
    error_data.error_msg,
    error_data.error_text
  ];

  if (Array.isArray(error_data.error_description)) {
    msgs.push.apply(msgs, error_data.error_description);
  } else {
    msgs.push(error_data.error_description);
  }
  if (typeof error_reason === 'object') {
    has_params = 'request_params' in error_reason;

    msgs.push(
      error_reason.error_msg,
      error_reason.error_text
    );
  } else {
    msgs.push(error_reason);
  }

  if (error_type === 'client_error' && isDeniedByClient(error_code)) {
    return USER_DENIED;
  }

  if (error_type === 'api_error' && isDeniedByAPI(error_code)) {
    return USER_DENIED;
  }

  if (error_type === 'client_error' && error_code === 1 && msgs.some(isNetworkReason)) {
    return NETWORK_ERROR;
  }

  if (error_type === 'auth_error' && !error_data.error && !error_data.error_description && !error_reason) {
    return NETWORK_ERROR;
  }

  if ((error_type === 'auth_error' || (error_type === 'api_error' && !has_params)) && error_code < 0 && error_code > -4000) {
    return NETWORK_ERROR;
  }

  return error as unknown as ErrorData;
};

export const pluginError = (send: VKBridgeSend): VKBridgeSend => {
  return (method, params) => {
    return send(method, params).catch((ex) => {
      throw castError(ex);
    });
  };
};
