import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CartService } from './cart.service';
import { ToastService } from './toast.service';

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
  private toast = inject(ToastService);

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
        this.cartService.loadCart();
        this.toast.info('Item saved for later.');
      })
    );
  }

  moveToCart(savedItemId: number): Observable<any> {
    return this.http.post('/server/savelater/movetocart', { savedItemId }).pipe(
      tap(() => {
        this.loadSavedItems();
        this.cartService.loadCart();
        this.toast.success('Item moved to cart.');
      })
    );
  }

  removeSavedItem(id: number): Observable<any> {
    return this.http.delete(`/server/savelater/${id}`).pipe(
      tap(() => {
        this.loadSavedItems();
        this.toast.info('Saved item removed.');
      })
    );
  }
}
