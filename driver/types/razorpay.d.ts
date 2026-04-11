declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: number;
    name: string;
    order_id: string;
    prefill?: {
      contact?: string;
      email?: string;
      name?: string;
      method?: string;
    };
    notes?: {
      [key: string]: string;
    };
    theme?: {
      color?: string;
    };
    modal?: {
      confirm_close?: boolean;
      ondismiss?: () => void;
      escape?: boolean;
      animation?: boolean;
    };
    send_sms_hash?: boolean;
    readonly?: {
      contact?: boolean;
      email?: boolean;
      name?: boolean;
    };
    hidden?: {
      contact?: boolean;
      email?: boolean;
    };
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<{
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }>;
  }
}
