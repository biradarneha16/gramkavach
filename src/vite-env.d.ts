/// <reference types="vite/client" />

interface Window {
  AndroidSmsBridge?: {
    sendSms: (
      phone: string,
      message: string
    ) => {
      ok?: boolean;
      mode?: string;
    } | void;
  };
}
