export type AnyHandler = (payload: Record<string, unknown>) => void;

export type VKBridgeContext = {
  requestAnimationFrame: Window['requestAnimationFrame'];
  addEventListener: Window['addEventListener'];
  postMessage: Window['postMessage'];

  parent: VKBridgeContext;
  document: Window['document'];

  __awaiters: Record<string, AnyHandler | null>;

  AndroidBridge?: Record<string, (serializedData: string) => void>;
  webkit?: {
    messageHandlers: Record<string, {
      postMessage: (data: Record<string, unknown>) => void;
    }>;
  };
};
