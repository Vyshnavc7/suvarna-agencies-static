import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

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
  productService = inject(ProductService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  authService = inject(AuthService);

  addToCart(product: any) {
    this.cartService.addToCart(product);
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
      Swal.fire('Please Login', 'You need to be logged in to add items to your wishlist.', 'info');
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
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = Array.isArray(data) ? data : (data.data || data.rows || []);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.isLoading = false;
      }
    });
  }

  isNew(dateString: string): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    return createdDate > tenDaysAgo;
  }
}
