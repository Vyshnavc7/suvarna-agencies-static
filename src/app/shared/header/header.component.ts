import { Component, inject, ElementRef, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { Subject, Subscription, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';

import { CartService } from '../../core/services/cart.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProfileService } from '../../core/services/profile.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
    selector: 'app-header',
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  cartService = inject(CartService);
  categoryService = inject(CategoryService);
  productService = inject(ProductService);
  notificationService = inject(NotificationService);
  profileService = inject(ProfileService);
  wishlistService = inject(WishlistService);
  toastService = inject(ToastService);
  router = inject(Router);

  cartItemCount$ = this.cartService.cartCount$;
  cartItems$ = this.cartService.cartItems$;
  isCartDrawerOpen = false;
  
  notifications$ = this.notificationService.notifications$;
  notificationUnreadCount$ = this.notificationService.unreadCount$;
  isNotificationDropdownOpen = false;

  wishlistItems$ = this.wishlistService.wishlistItems$;
  get wishlistCount$() {
    return this.wishlistItems$.pipe(
      map(items => items.length)
    );
  }

  get cartTotal$() {
    return this.cartItems$.pipe(
      map(items => items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0))
    );
  }

  isProfileDropdownOpen = false;
  isPro = false;
  categories: { name: string, subcategories: { name: string, products: any[] }[] }[] = [];

  filteredProducts: any[] = [];
  showSearchDropdown = false;
  isSearching = false;
  searchQuery = '';
  activeHighlightIndex = -1;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  @ViewChild('profileDropdownContainer') dropdownRef!: ElementRef;
  @ViewChild('searchContainerRef') searchContainerRef!: ElementRef;
  @ViewChild('notificationDropdownRef') notificationDropdownRef!: ElementRef;

  ngOnInit() {
    this.categoryService.getCategoriesForMenu().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => console.error('Failed to load categories', err)
    });

    if (this.authService.currentUserValue) {
      this.profileService.getProfile().subscribe({
        next: (res) => {
          this.isPro = res.data?.type === 'pro';
        }
      });
      this.wishlistService.loadWishlist();
    }

    // Set up reactive auto-complete search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.trim().length < 3) {
          return of({ data: [] });
        }
        this.isSearching = true;
        this.showSearchDropdown = true;
        this.activeHighlightIndex = -1;
        return this.productService.searchProducts(query).pipe(
          catchError(err => {
            console.error('Search API failed', err);
            return of({ data: [] });
          })
        );
      })
    ).subscribe({
      next: (response) => {
        const data = response.data || response;
        this.filteredProducts = Array.isArray(data) ? data : [];
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Search stream error', err);
        this.isSearching = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isProfileDropdownOpen && this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.isProfileDropdownOpen = false;
    }
    if (this.showSearchDropdown && this.searchContainerRef && !this.searchContainerRef.nativeElement.contains(event.target)) {
      this.showSearchDropdown = false;
    }
    if (this.isNotificationDropdownOpen && this.notificationDropdownRef && !this.notificationDropdownRef.nativeElement.contains(event.target)) {
      this.isNotificationDropdownOpen = false;
    }
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    
    if (query.trim().length >= 3) {
      this.searchSubject.next(query.trim());
    } else {
      this.filteredProducts = [];
      this.showSearchDropdown = false;
      this.isSearching = false;
      this.activeHighlightIndex = -1;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.showSearchDropdown || this.filteredProducts.length === 0) {
      if (event.key === 'Escape') {
        this.clearSearchBox();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeHighlightIndex = (this.activeHighlightIndex + 1) % this.filteredProducts.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeHighlightIndex = (this.activeHighlightIndex - 1 + this.filteredProducts.length) % this.filteredProducts.length;
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeHighlightIndex >= 0 && this.activeHighlightIndex < this.filteredProducts.length) {
          const selectedProduct = this.filteredProducts[this.activeHighlightIndex];
          this.router.navigate(['/product', selectedProduct.id]);
          this.clearSearch();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.clearSearch();
        break;
    }
  }

  clearSearchBox() {
    this.searchQuery = '';
    this.filteredProducts = [];
    this.showSearchDropdown = false;
    this.isSearching = false;
    this.activeHighlightIndex = -1;
  }

  clearSearch() {
    this.showSearchDropdown = false;
    this.activeHighlightIndex = -1;
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    if (this.isProfileDropdownOpen) this.isNotificationDropdownOpen = false;
  }

  toggleNotificationDropdown() {
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    if (this.isNotificationDropdownOpen) this.isProfileDropdownOpen = false;
  }

  loadNotifications() {
    this.notificationService.loadNotifications();
  }

  markNotificationAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllNotificationsAsRead() {
    this.notificationService.markAllAsRead().subscribe();
  }

  getCartCount(items: any[]): number {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }

  toggleCartDrawer() {
    this.isCartDrawerOpen = !this.isCartDrawerOpen;
  }
  
  closeCartDrawer() {
    this.isCartDrawerOpen = false;
  }
  
  removeFromCart(id: number) {
    this.cartService.removeFromCart(id).subscribe();
  }

  logout() {
    this.isProfileDropdownOpen = false;
    this.authService.logout();
    this.toastService.success('You have been logged out.');
  }
}
