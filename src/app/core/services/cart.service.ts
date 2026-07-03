import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';

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

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {
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
      Swal.fire({
        icon: 'info',
        title: 'Please Login',
        text: 'You need to be logged in to add items to the cart.',
        confirmButtonColor: '#ff5722',
        confirmButtonText: 'Login Now',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    const productId = product.productId || product.id;

    // Check if it's already in the cart locally
    const currentCart = this.cartItemsSubject.value;
    const existingItem = currentCart.find(item => item.productId === productId);

    if (existingItem) {
      // Just update quantity
      return this.updateQuantity(existingItem.id, existingItem.quantity + quantity).subscribe(() => {
        Swal.fire({
          icon: 'success',
          title: 'Cart Updated',
          text: `Increased quantity of ${product.productName || 'item'} in your cart.`,
          timer: 1500,
          showConfirmButton: false
        });
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
        this.loadCart(); // Reload cart to get updated state
        Swal.fire({
          icon: 'success',
          title: 'Added to Cart',
          text: `${product.productName || 'Item'} has been added to your cart.`,
          timer: 1500,
          showConfirmButton: false
        });
      }),
      catchError(err => {
        this.pendingAdditions.delete(productId);
        console.error('Add to cart failed', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add item to cart.',
          confirmButtonColor: '#333'
        });
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
        Swal.fire({
          icon: 'success',
          title: 'Removed',
          text: 'Item removed from cart',
          timer: 1500,
          showConfirmButton: false
        });
      })
    );
  }
}
