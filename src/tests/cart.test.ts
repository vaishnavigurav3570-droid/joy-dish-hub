import { describe, it, expect } from 'vitest';
import { CartItem, MenuItem } from '../types/order';

const mockMenuItem = (id: string, price: number): MenuItem => ({
  id,
  name: `Item ${id}`,
  price,
  category: 'Test',
  available: true,
  emoji: '🍔',
  image: ''
});

const addToCart = (cart: CartItem[], menuItem: MenuItem): CartItem[] => {
  const existing = cart.find(c => c.menuItem.id === menuItem.id);
  if (existing) return cart.map(c => c.menuItem.id === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c);
  return [...cart, { menuItem, quantity: 1 }];
};

const removeFromCart = (cart: CartItem[], id: string): CartItem[] => {
  const existing = cart.find(c => c.menuItem.id === id);
  if (existing && existing.quantity > 1) return cart.map(c => c.menuItem.id === id ? { ...c, quantity: c.quantity - 1 } : c);
  return cart.filter(c => c.menuItem.id !== id);
};

describe('Cart Interactions', () => {
  it('adds a new item to an empty cart', () => {
    const item = mockMenuItem('1', 100);
    const cart = addToCart([], item);
    expect(cart.length).toBe(1);
    expect(cart[0].menuItem.id).toBe('1');
    expect(cart[0].quantity).toBe(1);
  });

  it('increments quantity when adding an existing item', () => {
    const item = mockMenuItem('1', 100);
    const cart = addToCart([{ menuItem: item, quantity: 1 }], item);
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('decrements quantity when removing an item', () => {
    const item = mockMenuItem('1', 100);
    let cart = [{ menuItem: item, quantity: 2 }];
    cart = removeFromCart(cart, '1');
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(1);
  });

  it('removes item completely if quantity drops to 0', () => {
    const item = mockMenuItem('1', 100);
    let cart = [{ menuItem: item, quantity: 1 }];
    cart = removeFromCart(cart, '1');
    expect(cart.length).toBe(0);
  });

  it('calculates cart total correctly', () => {
    const item1 = mockMenuItem('1', 100);
    const item2 = mockMenuItem('2', 150);
    const cart = [
       { menuItem: item1, quantity: 2 },
       { menuItem: item2, quantity: 1 }
    ];
    const total = cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
    expect(total).toBe(350);
  });
});
