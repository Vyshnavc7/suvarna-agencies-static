import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  productName: string;
  price: number;
  image?: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartKey = 'suvarna_cart';
  private cartItems = new BehaviorSubject<CartItem[]>(this.getCartFromStorage());
  cartItems$ = this.cartItems.asObservable();

  constructor() { }

  private getCartFromStorage(): CartItem[] {
    const storedCart = localStorage.getItem(this.cartKey);
    return storedCart ? JSON.parse(storedCart) : [];
  }

  getCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  addToCart(product: any) {
    const currentCart = this.getCartItems();
    const existingItem = currentCart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentCart.push({
        id: product.id,
        productName: product.productName,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }

    this.updateCart(currentCart);
  }

  removeFromCart(productId: number) {
    let currentCart = this.getCartItems();
    currentCart = currentCart.filter(item => item.id !== productId);
    this.updateCart(currentCart);
  }

  clearCart() {
    this.updateCart([]);
  }

  private updateCart(cart: CartItem[]) {
    this.cartItems.next(cart);
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
  }
}
