import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';

export interface WishlistItem {
  id: number;
  productId: number;
  customerId: number;
  product: any;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistItemsSubject = new BehaviorSubject<WishlistItem[]>([]);
  wishlistItems$ = this.wishlistItemsSubject.asObservable();
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.loadWishlist();
      } else {
        this.wishlistItemsSubject.next([]);
      }
    });
  }

  loadWishlist() {
    this.http.get<WishlistItem[]>('/server/wishlist').subscribe({
      next: (items) => this.wishlistItemsSubject.next(items),
      error: (err) => console.error('Failed to load wishlist', err)
    });
  }

  addToWishlist(productId: number): Observable<any> {
    return this.http.post('/server/wishlist/add', { productId }).pipe(
      tap(() => {
        this.loadWishlist();
        this.toast.success('Added to wishlist.');
      })
    );
  }

  removeFromWishlist(id: number): Observable<any> {
    return this.http.delete(`/server/wishlist/${id}`).pipe(
      tap(() => {
        this.loadWishlist();
        this.toast.info('Removed from wishlist.');
      })
    );
  }
}
