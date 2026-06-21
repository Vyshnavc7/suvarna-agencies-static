import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-shop',
    imports: [RouterLink, CommonModule],
    templateUrl: './shop.component.html',
    styleUrl: './shop.component.scss'
})
export class ShopComponent implements OnInit {
  products: any[] = [];
  productService = inject(ProductService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);

  wishlistItems: any[] = [];

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistItems.some(item => item.productId === productId);
  }

  toggleWishlist(product: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const existingItem = this.wishlistItems.find(item => item.productId === product.id);
    if (existingItem) {
      this.wishlistService.removeFromWishlist(existingItem.id).subscribe();
    } else {
      this.wishlistService.addToWishlist(product.id).subscribe();
    }
  }

  ngOnInit() {
    this.productService.getProducts().subscribe({
      next: (data) => {
        console.log('API Response:', data); // Inspect structure
        this.products = Array.isArray(data) ? data : (data.data || data.rows || []);
        console.log('Products assigned:', this.products);
      },
      error: (err) => {
        console.error('Error fetching products', err);
      }
    });

    this.wishlistService.wishlistItems$.subscribe(items => {
      this.wishlistItems = items || [];
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
