import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import Swal from 'sweetalert2';

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

  constructor(private http: HttpClient) { }

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
        Swal.fire({
          icon: 'success',
          title: 'Added to Wishlist',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      })
    );
  }

  removeFromWishlist(id: number): Observable<any> {
    return this.http.delete(`/server/wishlist/${id}`).pipe(
      tap(() => {
        this.loadWishlist();
        Swal.fire({
          icon: 'success',
          title: 'Removed from Wishlist',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      })
    );
  }
}
