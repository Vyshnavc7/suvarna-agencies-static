import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../../core/services/cart.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal = 0;
  
  // Addresses
  addresses: any[] = [];
  selectedAddressId: number | null = null;
  showNewAddressForm = false;
  
  // New address input
  newAddress = {
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    type: 'shipping'
  };

  // Payment
  paymentMethod = 'COD'; // default Cash on Delivery
  cardDetails = {
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  };
  upiDetails = {
    upiId: ''
  };

  onCardNumberInput(event: any) {
    let inputElement = event.target;
    let digits = inputElement.value.replace(/\D/g, '').substring(0, 16);
    let formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.cardDetails.cardNumber = formatted;
    inputElement.value = formatted;
  }

  onExpiryInput(event: any) {
    let inputElement = event.target;
    let digits = inputElement.value.replace(/\D/g, '').substring(0, 6);
    let formatted = digits;
    if (digits.length >= 2) {
      formatted = digits.substring(0, 2) + '/' + digits.substring(2);
    }
    this.cardDetails.expiry = formatted;
    inputElement.value = formatted;
  }

  onCvvInput(event: any) {
    let inputElement = event.target;
    let formatted = inputElement.value.replace(/\D/g, '').substring(0, 4);
    this.cardDetails.cvv = formatted;
    inputElement.value = formatted;
  }

  // Coupon
  couponCode = '';
  appliedCoupon: any = null;
  discountAmount = 0;
  isApplyingCoupon = false;

  applyCoupon() {
    if (!this.couponCode) return;
    this.isApplyingCoupon = true;
    this.http.post<any>('/server/coupons/validate', { code: this.couponCode, cartTotal: this.cartTotal }).subscribe({
      next: (res) => {
        this.isApplyingCoupon = false;
        this.appliedCoupon = res.coupon;
        this.discountAmount = res.coupon.discountAmount;
        Swal.fire({
          icon: 'success',
          title: 'Coupon Applied',
          text: res.message,
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.isApplyingCoupon = false;
        this.appliedCoupon = null;
        this.discountAmount = 0;
        Swal.fire('Error', err.error?.message || 'Invalid coupon code', 'error');
      }
    });
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.discountAmount = 0;
  }

  // Status
  isPlacingOrder = false;
  isOrderPlaced = false;
  placedOrderDetails: any = null;

  constructor(
    private cartService: CartService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  cartItemId: number | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['cartItemId']) {
        this.cartItemId = parseInt(params['cartItemId'], 10);
      }
    });

    // Load cart items and calculation
    this.cartService.cartItems$.subscribe(items => {
      if (this.cartItemId) {
        this.cartItems = items.filter(item => item.id === this.cartItemId);
      } else {
        this.cartItems = items;
      }
      
      this.cartTotal = this.cartItems.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
      
      // If cart is empty and order is not placed, redirect to cart page
      if (this.cartItems.length === 0 && !this.isOrderPlaced) {
        this.router.navigate(['/cart']);
      }
    });

    this.cartService.loadCart();
    this.loadAddresses();
  }

  loadAddresses() {
    this.http.get<any[]>('/server/addresses').subscribe({
      next: (data) => {
        this.addresses = data;
        if (data.length > 0) {
          this.selectedAddressId = data[0].id;
        } else {
          this.showNewAddressForm = true;
        }
      },
      error: (err) => console.error('Failed to load addresses', err)
    });
  }

  toggleNewAddressForm() {
    this.showNewAddressForm = !this.showNewAddressForm;
  }

  saveAddress() {
    if (!this.newAddress.fullName || !this.newAddress.addressLine1 || !this.newAddress.city || !this.newAddress.state || !this.newAddress.postalCode) {
      Swal.fire('Error', 'Please fill in all required address fields.', 'error');
      return;
    }

    this.http.post<any>('/server/addresses', this.newAddress).subscribe({
      next: (savedAddr) => {
        this.addresses.push(savedAddr);
        this.selectedAddressId = savedAddr.id;
        this.showNewAddressForm = false;
        // Reset form
        this.newAddress = {
          fullName: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
          type: 'shipping'
        };
        Swal.fire({
          icon: 'success',
          title: 'Address Saved',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Failed to save address', err);
        Swal.fire('Error', 'Failed to save address.', 'error');
      }
    });
  }

  placeOrder() {
    if (!this.selectedAddressId && !this.showNewAddressForm) {
      Swal.fire('Error', 'Please select or add a shipping address.', 'error');
      return;
    }

    if (this.showNewAddressForm) {
      Swal.fire('Info', 'Please save your shipping address first.', 'info');
      return;
    }

    if (this.paymentMethod === 'Card') {
      if (!this.cardDetails.cardNumber || this.cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
        Swal.fire('Error', 'Please enter a valid 16-digit credit card number.', 'error');
        return;
      }
      if (!this.cardDetails.cardName || !this.cardDetails.cardName.trim()) {
        Swal.fire('Error', 'Please enter the name on your card.', 'error');
        return;
      }
      if (!this.cardDetails.expiry || !/^(0[1-9]|1[0-2])\/\d{4}$/.test(this.cardDetails.expiry)) {
        Swal.fire('Error', 'Please enter a valid expiry date in MM/YYYY format.', 'error');
        return;
      }
      if (!this.cardDetails.cvv || this.cardDetails.cvv.length < 3) {
        Swal.fire('Error', 'Please enter a valid CVV (3 or 4 digits).', 'error');
        return;
      }
    }

    if (this.paymentMethod === 'UPI') {
      if (!this.upiDetails.upiId) {
        Swal.fire('Error', 'Please enter your UPI ID.', 'error');
        return;
      }
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
      if (!upiRegex.test(this.upiDetails.upiId)) {
        Swal.fire('Error', 'Please enter a valid UPI ID (e.g. username@upi or mobile@ybl).', 'error');
        return;
      }
    }

    this.isPlacingOrder = true;

    this.http.post<any>('/server/orders/checkout', {
      paymentMethod: this.paymentMethod,
      addressId: this.selectedAddressId,
      cartItemId: this.cartItemId,
      couponCode: this.appliedCoupon ? this.appliedCoupon.code : null
    }).subscribe({
      next: (res) => {
        this.isPlacingOrder = false;
        this.isOrderPlaced = true;
        this.placedOrderDetails = res;
        this.cartService.loadCart(); // reset frontend cart items count to 0!
        Swal.fire({
          icon: 'success',
          title: 'Order Placed!',
          text: 'Thank you for your purchase.',
          confirmButtonColor: '#333'
        });
      },
      error: (err) => {
        this.isPlacingOrder = false;
        console.error('Order placement failed', err);
        Swal.fire('Error', err.error?.message || 'Failed to place order. Please try again.', 'error');
      }
    });
  }
}
