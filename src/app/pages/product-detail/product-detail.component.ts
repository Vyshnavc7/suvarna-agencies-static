import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  productService = inject(ProductService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  route = inject(ActivatedRoute);
  selectedQuantity: number = 1;

  authService = inject(AuthService);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchProduct(id);
      }
    });
  }

  fetchProduct(id: string) {
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data.data || data; // Handle potential wrapper
      },
      error: (err) => {
        console.error('Error fetching product details', err);
      }
    });
  }

  addToCart(product: any) {
    this.cartService.addToCart(product, +this.selectedQuantity);
    Swal.fire({
      icon: 'success',
      title: 'Added to Cart',
      text: `${product.productName} has been added to your cart.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  }

  isWishlisted(product: any): boolean {
    if (!product || !product.wishlistItems) return false;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;
    
    return product.wishlistItems.some((item: any) => item.customerId === currentUser.id);
  }

  addToWishlist(product: any) {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      Swal.fire('Please Login', 'You need to be logged in to modify your wishlist.', 'info');
      return;
    }

    if (!product.wishlistItems) product.wishlistItems = [];

    if (this.isWishlisted(product)) {
      const wishlistItem = product.wishlistItems.find((item: any) => item.customerId === currentUser.id);
      if (wishlistItem) {
        this.wishlistService.removeFromWishlist(wishlistItem.id).subscribe({
          next: () => {
            product.wishlistItems = product.wishlistItems.filter((item: any) => item.id !== wishlistItem.id);
          },
          error: () => this.wishlistService.loadWishlist()
        });
      }
    } else {
      this.wishlistService.addToWishlist(product.id).subscribe({
        next: (response: any) => {
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

  isNew(dateString: string): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    return createdDate > tenDaysAgo;
  }
}
