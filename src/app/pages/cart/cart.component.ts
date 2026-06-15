import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-cart',
    imports: [CommonModule, RouterModule],
    templateUrl: './cart.component.html',
    styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  cartItems$!: Observable<CartItem[]>;
  cartTotal = 0;

  constructor(private cartService: CartService, private router: Router) { }

  ngOnInit(): void {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartService.loadCart();
    this.cartItems$.subscribe(items => {
      this.calculateTotal(items);
    });
  }

  calculateTotal(items: CartItem[]) {
    this.cartTotal = items.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    this.cartService.updateQuantity(item.id, newQuantity).subscribe();
  }

  removeItem(item: CartItem) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to remove this item from cart?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.removeFromCart(item.id).subscribe();
      }
    });
  }

  checkout() {
    this.router.navigate(['/checkout']);
  }
}
