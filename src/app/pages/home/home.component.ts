import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  newArrivals: any[] = [];
  productService = inject(ProductService);
  cartService = inject(CartService);

  ngOnInit() {
    this.productService.getProducts().subscribe({
      next: (data) => {
        const allProducts = Array.isArray(data) ? data : (data.data || data.rows || []);
        this.filterNewArrivals(allProducts);
      },
      error: (err) => {
        console.error('Error fetching products', err);
      }
    });
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
}
