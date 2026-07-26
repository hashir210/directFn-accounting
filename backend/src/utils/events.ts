import { EventEmitter } from 'events';

// Create a global event emitter for internal pub/sub
const eventEmitter = new EventEmitter();

// Define standard event names to avoid typos
export const EventTypes = {
  INVOICE_PAID: 'invoice.paid',
  STOCK_LOW: 'stock.low',
  AUTH_LOGIN_ALERT: 'auth.login_alert',
  PURCHASE_RECEIVED: 'purchase.received',
  AUDIT_LOG: 'audit.log',
} as const;

export default eventEmitter;
