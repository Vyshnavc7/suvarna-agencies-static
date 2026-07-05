import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { CartAnimationService } from '../../core/services/cart-animation.service';

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
  toastService = inject(ToastService);
  cartAnimationService = inject(CartAnimationService);
  router = inject(Router);

  selectedImage: string | null = null;
  galleryImages: string[] = [];
  cartItems: any[] = [];

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
    
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
        this.setupGallery();
      },
      error: (err) => {
        console.error('Error fetching product details', err);
      }
    });
  }

  setupGallery() {
    this.galleryImages = [];
    if (this.product) {
      if (this.product.image) {
        this.galleryImages.push(this.product.image);
        this.selectedImage = this.product.image;
      }
      if (this.product.productImages && Array.isArray(this.product.productImages)) {
        this.product.productImages.forEach((img: any) => {
          if (img.filePath && !this.galleryImages.includes(img.filePath)) {
            this.galleryImages.push(img.filePath);
          }
        });
      }
      if (!this.selectedImage && this.galleryImages.length > 0) {
        this.selectedImage = this.galleryImages[0];
      }
    }
  }

  selectImage(imgUrl: string) {
    this.selectedImage = imgUrl;
  }

  addToCart(product: any, event: any) {
    this.cartService.addToCart(product, +this.selectedQuantity);
    this.cartAnimationService.animateToCart(event, this.selectedImage || product.image);
  }

  increaseQuantity() {
    const maxQty = this.product.quantity || 10;
    if (this.selectedQuantity < maxQty) {
      this.selectedQuantity++;
    } else {
      this.toastService.info(`Only ${maxQty} units of this item are available in stock.`);
    }
  }

  decreaseQuantity() {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
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

  addToWishlist(product: any) {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.toastService.info('Please log in to modify your wishlist.');
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
