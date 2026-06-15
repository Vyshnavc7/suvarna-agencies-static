import { Component, inject, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { CartService } from '../../core/services/cart.service';
import { CategoryService } from '../../core/services/category.service';

@Component({
    selector: 'app-header',
    imports: [RouterLink, CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  authService = inject(AuthService);
  cartService = inject(CartService);
  categoryService = inject(CategoryService);

  cartItemCount$ = this.cartService.cartCount$;
  isProfileDropdownOpen = false;
  categories: any[] = [];

  @ViewChild('profileDropdownContainer') dropdownRef!: ElementRef;

  ngOnInit() {
    this.categoryService.getCategoriesForMenu().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isProfileDropdownOpen && this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.isProfileDropdownOpen = false;
    }
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  getCartCount(items: any[]): number {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }

  logout() {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        Swal.fire(
          'Logged Out!',
          'You have been logged out.',
          'success'
        )
      }
    })
  }
}
