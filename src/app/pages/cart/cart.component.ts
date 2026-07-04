import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';
import { SaveLaterService, SaveLaterItem } from '../../core/services/savelater.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-cart',
    imports: [CommonModule, RouterModule],
    templateUrl: './cart.component.html',
    styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  cartItems$!: Observable<CartItem[]>;
  savedItems$!: Observable<SaveLaterItem[]>;
  cartTotal = 0;
  mrpTotal = 0;
  discountTotal = 0;
  proDiscount = 0;
  isPro = false;
  proDiscountPercent = 5;

  constructor(
    private cartService: CartService, 
    private saveLaterService: SaveLaterService,
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private http: HttpClient,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.cartItems$ = this.cartService.cartItems$;
    this.savedItems$ = this.saveLaterService.savedItems$;
    
    this.cartService.loadCart();
    this.saveLaterService.loadSavedItems();
    
    // Fetch fresh profile data to get the accurate 'type'
    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.isPro = res.data?.type === 'pro';
        this.calculateTotal(); // recalculate now that we know they are Pro
      }
    });

    this.http.get<any>('/server/settings/public').subscribe({
      next: (res) => {
        if (res.data) {
          this.proDiscountPercent = res.data.proDiscountPercentage;
          this.calculateTotal();
        }
      }
    });
    
    this.cartItems$.subscribe(items => {
      this.calculateTotal(items);
    });
  }

  private currentCartItems: CartItem[] = [];

  calculateTotal(items?: CartItem[]) {
    if (items) {
      this.currentCartItems = items;
    }
    const currentItems = this.currentCartItems;
    
    this.cartTotal = currentItems.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
    this.mrpTotal = currentItems.reduce((acc, item) => acc + (item.quantity * (item.product.actualPrice || item.product.price)), 0);
    
    // Apply Pro Discount to the cart total
    this.proDiscount = this.isPro ? (this.cartTotal * (this.proDiscountPercent / 100)) : 0;
    this.cartTotal -= this.proDiscount;
    
    this.discountTotal = this.mrpTotal - this.cartTotal;
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;
    
    // Check stock limit
    if (newQuantity > item.product.quantity) {
      this.toast.info(`Only ${item.product.quantity} units of this item are available in stock.`);
      return;
    }

    this.cartService.updateQuantity(item.id, newQuantity).subscribe();
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.id).subscribe({
      next: () => this.toast.info('Item removed from cart.')
    });
  }

  checkout(itemId?: number) {
    if (itemId) {
      this.router.navigate(['/checkout'], { queryParams: { cartItemId: itemId } });
    } else {
      this.router.navigate(['/checkout']);
    }
  }

  saveForLater(item: CartItem) {
    this.saveLaterService.saveForLater(item.id).subscribe();
  }

  moveToCart(savedItem: SaveLaterItem) {
    this.saveLaterService.moveToCart(savedItem.id).subscribe();
  }

  removeSavedItem(savedItem: SaveLaterItem) {
    this.saveLaterService.removeSavedItem(savedItem.id).subscribe({
      next: () => this.toast.info('Item removed from saved list.')
    });
  }

  trackByItemId(index: number, item: any): number {
    return item.id;
  }
}
