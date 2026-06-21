import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CartService } from './cart.service';

export interface SaveLaterItem {
  id: number;
  productId: number;
  customerId: number;
  quantity: number;
  product: any;
}

@Injectable({
  providedIn: 'root'
})
export class SaveLaterService {
  private savedItemsSubject = new BehaviorSubject<SaveLaterItem[]>([]);
  savedItems$ = this.savedItemsSubject.asObservable();

  constructor(private http: HttpClient, private cartService: CartService) { }

  loadSavedItems() {
    this.http.get<SaveLaterItem[]>('/server/savelater').subscribe({
      next: (items) => this.savedItemsSubject.next(items),
      error: (err) => console.error('Failed to load saved items', err)
    });
  }

  saveForLater(cartItemId: number): Observable<any> {
    return this.http.post('/server/savelater/save', { cartItemId }).pipe(
      tap(() => {
        this.loadSavedItems();
        this.cartService.loadCart(); // Refresh cart because item was removed
        Swal.fire({
          icon: 'success',
          title: 'Saved for later',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      })
    );
  }

  moveToCart(savedItemId: number): Observable<any> {
    return this.http.post('/server/savelater/movetocart', { savedItemId }).pipe(
      tap(() => {
        this.loadSavedItems();
        this.cartService.loadCart(); // Refresh cart because item was added back
        Swal.fire({
          icon: 'success',
          title: 'Moved to Cart',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      })
    );
  }

  removeSavedItem(id: number): Observable<any> {
    return this.http.delete(`/server/savelater/${id}`).pipe(
      tap(() => {
        this.loadSavedItems();
        Swal.fire({
          icon: 'success',
          title: 'Removed saved item',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      })
    );
  }
}
