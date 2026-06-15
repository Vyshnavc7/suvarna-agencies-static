import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
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

  addToCart(product: any) {
    this.cartService.addToCart(product);
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
  }

  isNew(dateString: string): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    return createdDate > tenDaysAgo;
  }
}
