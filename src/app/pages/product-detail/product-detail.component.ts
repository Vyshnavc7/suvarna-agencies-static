import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  productService = inject(ProductService);
  cartService = inject(CartService);
  route = inject(ActivatedRoute);
  selectedQuantity: number = 1;

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

  isNew(dateString: string): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    return createdDate > tenDaysAgo;
  }
}
