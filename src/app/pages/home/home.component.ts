import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-home',
    imports: [RouterLink, CommonModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  newArrivals: any[] = [];
  featuredProduct: any = null;
  productService = inject(ProductService);
  cartService = inject(CartService);

  ngOnInit() {
    this.productService.getProducts().subscribe({
      next: (data: any) => {
        const allProducts = Array.isArray(data) ? data : (data.data || data.rows || []);
        this.filterNewArrivals(allProducts);
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
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    this.newArrivals = products.filter(product => {
      const createdDate = new Date(product.createdAt);
      return createdDate > tenDaysAgo;
    });
  }

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }
}
