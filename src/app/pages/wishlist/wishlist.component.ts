import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WishlistService, WishlistItem } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss'
})
export class WishlistComponent implements OnInit {
  wishlistItems$!: Observable<WishlistItem[]>;

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.wishlistItems$ = this.wishlistService.wishlistItems$;
    this.wishlistService.loadWishlist();
  }

  moveToCart(item: WishlistItem) {
    this.cartService.addToCart(item.product);
    this.wishlistService.removeFromWishlist(item.id).subscribe();
  }

  removeItem(item: WishlistItem) {
    this.wishlistService.removeFromWishlist(item.id).subscribe();
  }
}
