import { Component, OnInit, HostListener, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-shop',
  imports: [RouterLink, CommonModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent implements OnInit {
  products: any[] = [];
  isLoading = true;
  skeletonArray = Array(8).fill(0);

  currentPage = 1;
  hasMoreData = true;
  isLoadingMore = false;
  limit = 8;
  cartItems: any[] = [];

  productService = inject(ProductService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  isInCart(product: any): boolean {
    if (!product) return false;
    const pId = product.productId || product.id;
    return this.cartItems.some(item => item.productId === pId);
  }

  isWishlisted(product: any): boolean {
    if (!product || !product.wishlistItems) return false;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    return product.wishlistItems.some((item: any) => item.customerId === currentUser.id);
  }

  toggleWishlist(product: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.toastService.info('Please log in to add items to your wishlist.');
      return;
    }

    // Ensure wishlistItems array exists
    if (!product.wishlistItems) {
      product.wishlistItems = [];
    }

    if (this.isWishlisted(product)) {
      // Find the specific wishlist item ID for the current user to remove it
      const wishlistItem = product.wishlistItems.find((item: any) => item.customerId === currentUser.id);
      if (wishlistItem) {
        this.wishlistService.removeFromWishlist(wishlistItem.id).subscribe({
          next: () => {
            // Manipulate from frontend side: Remove it from the local product object instantly
            product.wishlistItems = product.wishlistItems.filter((item: any) => item.id !== wishlistItem.id);
          },
          error: () => {
            // Fallback: If it's a dummy ID and fails, refresh wishlist
            this.wishlistService.loadWishlist();
          }
        });
      }
    } else {
      this.wishlistService.addToWishlist(product.id).subscribe({
        next: (response: any) => {
          // Manipulate from frontend side: Add dummy entry to instantly turn heart red
          // Assuming the backend doesn't return the new wishlist item ID in a standard way,
          // we use a temporary ID just to satisfy the frontend check.
          const newItemId = (response && response.data && response.data.id) ? response.data.id : Date.now();
          product.wishlistItems.push({
            id: newItemId,
            customerId: currentUser.id,
            productId: product.id
          });
        }
      });
    }
  }

  ngOnInit() {
    this.isLoading = true;
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
    this.loadProducts(this.currentPage);
  }

  loadProducts(page: number) {
    if (page > 1) {
      this.isLoadingMore = true;
    }
    this.productService.getProducts(page, this.limit).subscribe({
      next: (data) => {
        const fetchedProducts = Array.isArray(data) ? data : (data.data || data.rows || []);

        // Artificial delay for better UX and to prevent rapid scroll firing
        setTimeout(() => {
          if (page === 1) {
            this.products = fetchedProducts;
          } else {
            this.products = [...this.products, ...fetchedProducts];
          }

          if (fetchedProducts.length < this.limit) {
            this.hasMoreData = false;
          }

          this.isLoading = false;
          this.isLoadingMore = false;
        }, 600);
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.isLoading = false;
        this.isLoadingMore = false;
      }
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    if (this.isLoading || this.isLoadingMore || !this.hasMoreData) return;

    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;

    // Load more when user is 200px from the bottom
    if (pos >= max - 200) {
      this.currentPage++;
      this.loadProducts(this.currentPage);
    }
  }

  isNew(dateString: string): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    return createdDate > tenDaysAgo;
  }
}
