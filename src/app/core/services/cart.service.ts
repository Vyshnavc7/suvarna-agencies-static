import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export interface CartItem {
  id: number;
  productId: number;
  product: {
    id: number;
    productName: string;
    price: number;
    actualPrice: number;
    discountPercentage: number;
    discountPrice: number;
    image: string;
    description: string;
    quantity: number;
  };
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = '/server/cart';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private pendingAdditions = new Set<number>();
  cartItems$ = this.cartItemsSubject.asObservable();

  public cartCount$ = this.cartItems$.pipe(
    map(items => items.length)
  );

  constructor(private http: HttpClient, private authService: AuthService, private router: Router, private toast: ToastService) {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.loadCart();
      } else {
        this.cartItemsSubject.next([]);
      }
    });
  }

  loadCart() {
    this.http.get<CartItem[]>(this.apiUrl).subscribe({
      next: (items) => this.cartItemsSubject.next(items),
      error: (err) => console.error('Failed to load cart', err)
    });
  }

  addToCart(product: any, quantity: number = 1) {
    if (!this.authService.currentUserValue) {
      this.toast.info('Please log in to add items to the cart.');
      this.router.navigate(['/login']);
      return;
    }

    const productId = product.productId || product.id;

    // Check if it's already in the cart locally
    const currentCart = this.cartItemsSubject.value;
    const existingItem = currentCart.find(item => item.productId === productId);

    if (existingItem) {
      // Just update quantity
      return this.updateQuantity(existingItem.id, existingItem.quantity + quantity).subscribe(() => {
        this.toast.success(`${product.productName || 'Item'} quantity updated in cart.`);
      });
    }

    // Prevent spam clicks
    if (this.pendingAdditions.has(productId)) {
      return; 
    }
    this.pendingAdditions.add(productId);

    return this.http.post(this.apiUrl + '/add', { productId: productId, quantity }).pipe(
      tap(() => {
        this.pendingAdditions.delete(productId);
        this.loadCart();
        this.toast.success(`${product.productName || 'Item'} added to cart.`);
      }),
      catchError(err => {
        this.pendingAdditions.delete(productId);
        console.error('Add to cart failed', err);
        return throwError(() => err);
      })
    ).subscribe();
  }

  updateQuantity(cartItemId: number, quantity: number) {
    return this.http.put(`${this.apiUrl}/${cartItemId}`, { quantity }).pipe(
      tap(() => this.loadCart())
    );
  }

  removeFromCart(cartItemId: number) {
    return this.http.delete(`${this.apiUrl}/${cartItemId}`).pipe(
      tap(() => {
        this.loadCart();
      })
    );
  }

  clearCart() {
    return this.http.delete(`${this.apiUrl}/clear`).pipe(
      tap(() => {
        this.loadCart();
      })
    );
  }
}
