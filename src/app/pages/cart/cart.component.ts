import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';
import { SaveLaterService, SaveLaterItem } from '../../core/services/savelater.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import Swal from 'sweetalert2';
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
    private http: HttpClient
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

    this.cartService.updateQuantity(item.id, newQuantity).subscribe();
  }

  removeItem(item: CartItem) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to remove this item from cart?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.removeFromCart(item.id).subscribe();
      }
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
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to remove this item from saved items?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.saveLaterService.removeSavedItem(savedItem.id).subscribe();
      }
    });
  }
}
