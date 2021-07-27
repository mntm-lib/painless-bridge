export type AnyHandler = (payload: Record<string, unknown>) => void;

export type VKBridgeContext = {
  AndroidBridge?: Record<string, (serializedData: string) => void>;
  webkit?: {
    messageHandlers: Record<string, {
      postMessage: (data: Record<string, unknown>) => void;
    }>;
  };
};
