import { Component, inject, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { CartService } from '../../core/services/cart.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';

@Component({
    selector: 'app-header',
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  authService = inject(AuthService);
  cartService = inject(CartService);
  categoryService = inject(CategoryService);
  productService = inject(ProductService);

  cartItemCount$ = this.cartService.cartCount$;
  isProfileDropdownOpen = false;
  categories: { name: string, subcategories: { name: string, products: any[] }[] }[] = [];

  filteredProducts: any[] = [];
  showSearchDropdown = false;
  isSearching = false;
  searchQuery = '';
  searchTimeout: any;

  @ViewChild('profileDropdownContainer') dropdownRef!: ElementRef;
  @ViewChild('searchContainerRef') searchContainerRef!: ElementRef;

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
    if (this.showSearchDropdown && this.searchContainerRef && !this.searchContainerRef.nativeElement.contains(event.target)) {
      this.showSearchDropdown = false;
    }
  }

  onSearchInput(event: any) {
    const query = event.target.value.trim();
    this.searchQuery = query;
    
    if (query.length >= 3) {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      this.isSearching = true;
      this.showSearchDropdown = true;
      
      // Debounce API calls by 300ms
      this.searchTimeout = setTimeout(() => {
        this.productService.searchProducts(query).subscribe({
          next: (response) => {
            const data = response.data || response;
            this.filteredProducts = Array.isArray(data) ? data : [];
            this.isSearching = false;
          },
          error: (err) => {
            console.error('Search API failed', err);
            this.isSearching = false;
          }
        });
      }, 300);
    } else {
      this.filteredProducts = [];
      this.showSearchDropdown = false;
      this.isSearching = false;
    }
  }

  clearSearchBox() {
    this.searchQuery = '';
    this.filteredProducts = [];
    this.showSearchDropdown = false;
    this.isSearching = false;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  clearSearch() {
    this.showSearchDropdown = false;
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
