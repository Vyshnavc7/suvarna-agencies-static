import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CartAnimationService } from '../../core/services/cart-animation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  newArrivals: any[] = [];
  featuredProducts: any[] = [];
  suggestedProducts: any[] = [];
  featuredProduct: any = null;
  cartItems: any[] = [];
  productService = inject(ProductService);
  cartService = inject(CartService);
  cartAnimationService = inject(CartAnimationService);
  router = inject(Router);

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });

    this.productService.getProducts().subscribe({
      next: (data: any) => {
        const allProducts = Array.isArray(data) ? data : (data.data || data.rows || []);

        // Sort by newest first
        const sortedProducts = [...allProducts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Latest 4 new arrivals
        this.newArrivals = sortedProducts.slice(0, 4);

        // Latest 4 featured
        let feats = sortedProducts.filter(p => p.isFeatured);
        if (feats.length < 4) {
          feats = [...feats, ...sortedProducts.filter(p => !p.isFeatured)].slice(0, 4);
        }
        this.featuredProducts = feats.slice(0, 4);

        // Latest 4 suggested (just take top 4 or a different mix)
        this.suggestedProducts = [...sortedProducts].sort(() => 0.5 - Math.random()).slice(0, 4);

        this.selectFeaturedProduct(allProducts);
      },
      error: (err: any) => {
        console.error('Error fetching products', err);
      }
    });
  }

  selectFeaturedProduct(products: any[]) {
    // 1. Try to find a product that has both isFeatured=true and an image
    this.featuredProduct = products.find(p => p.isFeatured && p.image);

    // 2. If none, find a product with an image
    if (!this.featuredProduct) {
      this.featuredProduct = products.find(p => p.image);
    }

    // 3. If still none, find any product that isFeatured
    if (!this.featuredProduct) {
      this.featuredProduct = products.find(p => p.isFeatured);
    }

    // 4. Finally, just pick the first product
    if (!this.featuredProduct && products.length > 0) {
      this.featuredProduct = products[0];
    }
  }

  filterNewArrivals(products: any[]) {
    // Replaced by inline logic in ngOnInit
  }

  addToCart(product: any, event: any) {
    this.cartService.addToCart(product);
    this.cartAnimationService.animateToCart(event, product.image);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  isInCart(product: any): boolean {
    if (!product) return false;
    const pId = product.productId || product.id;
    return this.cartItems.some(item => item.productId === pId);
  }
}
