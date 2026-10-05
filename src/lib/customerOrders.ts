// Customer Order Storage & Sync Utility
// Stores order IDs and full order cache locally on the customer's browser for instant persistent display
import { Order } from '../types';

const STORAGE_KEY_ORDERS = 'seedance_customer_orders_v1';
const STORAGE_KEY_USER = 'seedance_customer_user_v1';
const STORAGE_KEY_ORDER_CACHE = 'seedance_customer_cached_orders_v1';

export interface SavedCustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export function saveCustomerOrderId(orderId: string, info?: SavedCustomerInfo): void {
  try {
    const existing = getCustomerSavedOrderIds();
    if (!existing.includes(orderId)) {
      existing.unshift(orderId);
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(existing.slice(0, 100)));
    }

    if (info) {
      const prevInfo = getCustomerSavedInfo();
      const updatedInfo: SavedCustomerInfo = {
        name: info.name?.trim() || prevInfo.name,
        email: info.email?.trim().toLowerCase() || prevInfo.email,
        phone: info.phone?.trim() || prevInfo.phone,
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedInfo));
    }

    // Notify listeners across the app
    window.dispatchEvent(new CustomEvent('customer_orders_changed', { detail: { orderId } }));
  } catch (e) {
    console.warn('Failed to save customer order locally:', e);
  }
}

export function getCustomerSavedOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCustomerSavedInfo(): SavedCustomerInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveCachedOrders(orders: Order[]): void {
  try {
    if (!Array.isArray(orders)) return;
    localStorage.setItem(STORAGE_KEY_ORDER_CACHE, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to cache customer orders locally:', e);
  }
}

export function getCachedOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDER_CACHE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function updateCachedOrder(order: Order): void {
  try {
    const cached = getCachedOrders();
    const idx = cached.findIndex(o => o.id === order.id || o.orderId === order.orderId);
    if (idx >= 0) {
      cached[idx] = { ...cached[idx], ...order };
    } else {
      cached.unshift(order);
    }
    saveCachedOrders(cached);
    saveCustomerOrderId(order.orderId);
  } catch (e) {
    console.warn('Failed to update cached order:', e);
  }
}
