// NicePay JS SDK TypeScript 선언

interface NicePayRequestOptions {
  clientId: string;
  method: string;
  orderId: string;
  amount: number;
  goodsName: string;
  returnUrl: string;
  mallUserId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
  useEscrow?: boolean;
  currency?: string;
  locale?: string;
  mallReserved?: string;
  fnError?: (result: { errorMsg: string }) => void;
}

interface AUTHNICE {
  requestPay(options: NicePayRequestOptions): void;
}

declare global {
  interface Window {
    AUTHNICE?: AUTHNICE;
  }
}

export {};