import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../../core/services/cart.service';
import { SavedCardService, SavedCard } from '../../core/services/saved-card.service';
import { SavedUpiService, SavedUpi } from '../../core/services/saved-upi.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';

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
  mrpTotal = 0;
  discountTotal = 0;
  proDiscount = 0;
  isPro = false;
  proDiscountPercent = 5; // Default from settings
  
  // Wizard State
  currentStep = 1;
  
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
  savedCards: SavedCard[] = [];
  savedUpis: SavedUpi[] = [];
  selectedSavedCardId: number | null = null;
  selectedSavedUpiId: number | null = null;

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
        this.toast.success(res.message || 'Coupon applied!');
      },
      error: (err) => {
        this.isApplyingCoupon = false;
        this.appliedCoupon = null;
        this.discountAmount = 0;
        this.toast.error(err.error?.message || 'Invalid coupon code.');
      }
    });
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.discountAmount = 0;
  }

  // Wizard Navigation
  nextStep() {
    if (this.currentStep === 1) {
      if (!this.selectedAddressId) {
        this.toast.error('Please select a shipping address to continue.');
        return;
      }
      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (this.paymentMethod === 'Card' && !this.selectedSavedCardId && (!this.cardDetails.cardNumber || !this.cardDetails.expiry || !this.cardDetails.cvv)) {
         this.toast.error('Please select or enter valid card details.');
         return;
      }
      if (this.paymentMethod === 'UPI' && !this.selectedSavedUpiId && !this.upiDetails.upiId) {
         this.toast.error('Please select or enter a valid UPI ID.');
         return;
      }
      
      // Silently save newly entered credentials in the background
      if (this.paymentMethod === 'Card' && !this.selectedSavedCardId) {
        const expiryParts = this.cardDetails.expiry.split('/');
        const newCard: any = {
          cardHolderName: this.cardDetails.cardName || 'Cardholder',
          cardNumber: this.cardDetails.cardNumber.replace(/\s+/g, ''),
          expiryMonth: expiryParts[0] || '',
          expiryYear: expiryParts[1] || '',
          cardType: 'Credit',
          isDefault: true
        };
        this.savedCardService.addSavedCard(newCard).subscribe({
          next: (res) => {
            this.selectedSavedCardId = res.card.id!;
            this.savedCards.push(res.card);
          }
        });
      }

      if (this.paymentMethod === 'UPI' && !this.selectedSavedUpiId) {
        const newUpi: any = {
          upiId: this.upiDetails.upiId,
          providerName: 'New UPI',
          isDefault: true
        };
        this.savedUpiService.addSavedUpi(newUpi).subscribe({
          next: (res) => {
            this.selectedSavedUpiId = res.upi.id!;
            this.savedUpis.push(res.upi);
          }
        });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.currentStep = 3;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.currentStep--;
    }
  }

  // Status
  isPlacingOrder = false;
  isOrderPlaced = false;
  placedOrderDetails: any = null;
  finalAmountPaid = 0;

  private toast = inject(ToastService);

  constructor(
    private cartService: CartService,
    private savedCardService: SavedCardService,
    private savedUpiService: SavedUpiService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService
  ) { }

  cartItemId: number | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['cartItemId']) {
        this.cartItemId = parseInt(params['cartItemId'], 10);
      }
    });

    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.isPro = res.data?.type === 'pro';
        this.recalculateTotal();
      }
    });

    this.http.get<any>('/server/settings/public').subscribe({
      next: (res) => {
        if (res.data) {
          this.proDiscountPercent = res.data.proDiscountPercentage;
          this.recalculateTotal();
        }
      }
    });

    // Load cart items and calculation
    this.cartService.cartItems$.subscribe(items => {
      if (this.cartItemId) {
        this.cartItems = items.filter(item => item.id === this.cartItemId);
      } else {
        this.cartItems = items;
      }
      
      if (!this.isOrderPlaced) {
        this.recalculateTotal();
      }
      
      // If cart is empty and order is not placed, redirect to cart page
      if (this.cartItems.length === 0 && !this.isOrderPlaced) {
        this.router.navigate(['/cart']);
      }
    });

    this.cartService.loadCart();
    this.loadAddresses();
    this.loadSavedPaymentMethods();
  }

  recalculateTotal() {
    if (this.isOrderPlaced || !this.cartItems || this.cartItems.length === 0) return;
    
    this.cartTotal = this.cartItems.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
    this.mrpTotal = this.cartItems.reduce((acc, item) => acc + (item.quantity * (item.product.actualPrice || item.product.price)), 0);
    
    this.proDiscount = this.isPro ? (this.cartTotal * (this.proDiscountPercent / 100)) : 0;
    this.cartTotal -= this.proDiscount;
    
    this.discountTotal = this.mrpTotal - this.cartTotal;
  }

  loadSavedPaymentMethods() {
    this.savedCardService.getSavedCards().subscribe({
      next: (cards) => {
        this.savedCards = cards;
        const defaultCard = cards.find(c => c.isDefault);
        if (defaultCard) {
          this.selectedSavedCardId = defaultCard.id || null;
        } else if (cards.length > 0) {
          this.selectedSavedCardId = cards[0].id || null;
        }
      },
      error: (err) => console.error('Failed to load saved cards', err)
    });

    this.savedUpiService.getSavedUpis().subscribe({
      next: (upis) => {
        this.savedUpis = upis;
        const defaultUpi = upis.find(u => u.isDefault);
        if (defaultUpi) {
          this.selectedSavedUpiId = defaultUpi.id || null;
        } else if (upis.length > 0) {
          this.selectedSavedUpiId = upis[0].id || null;
        }
      },
      error: (err) => console.error('Failed to load saved upis', err)
    });
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

  getSelectedAddress() {
    return this.addresses.find(a => a.id === this.selectedAddressId);
  }

  getSelectedCard() {
    return this.savedCards.find(c => c.id === this.selectedSavedCardId);
  }

  getSelectedUpi() {
    return this.savedUpis.find(u => u.id === this.selectedSavedUpiId);
  }

  toggleNewAddressForm() {
    this.showNewAddressForm = !this.showNewAddressForm;
  }

  saveAddress() {
    if (!this.newAddress.fullName || !this.newAddress.addressLine1 || !this.newAddress.city || !this.newAddress.state || !this.newAddress.postalCode) {
      this.toast.error('Please fill in all required address fields.');
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
        this.toast.success('Address saved successfully.');
      },
      error: (err) => {
        console.error('Failed to save address', err);
        this.toast.error('Failed to save address.');
      }
    });
  }

  placeOrder() {
    if (!this.selectedAddressId && !this.showNewAddressForm) {
      this.toast.error('Please select or add a shipping address.');
      return;
    }

    if (this.showNewAddressForm) {
      this.toast.info('Please save your shipping address first.');
      return;
    }

    if (this.paymentMethod === 'Card') {
      if (this.selectedSavedCardId === null) {
        if (!this.cardDetails.cardNumber || this.cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
          this.toast.error('Please enter a valid 16-digit credit card number.');
          return;
        }
        if (!this.cardDetails.cardName || !this.cardDetails.cardName.trim()) {
          this.toast.error('Please enter the name on your card.');
          return;
        }
        if (!this.cardDetails.expiry || !/^(0[1-9]|1[0-2])\/\d{4}$/.test(this.cardDetails.expiry)) {
          this.toast.error('Please enter a valid expiry date in MM/YYYY format.');
          return;
        }
        if (!this.cardDetails.cvv || this.cardDetails.cvv.length < 3) {
          this.toast.error('Please enter a valid CVV (3 or 4 digits).');
          return;
        }
      }
    }

    if (this.paymentMethod === 'UPI') {
      if (this.selectedSavedUpiId === null) {
        if (!this.upiDetails.upiId) {
          this.toast.error('Please enter your UPI ID.');
          return;
        }
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
        if (!upiRegex.test(this.upiDetails.upiId)) {
          this.toast.error('Please enter a valid UPI ID (e.g. username@upi or mobile@ybl).');
          return;
        }
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
        this.finalAmountPaid = this.cartTotal - this.discountAmount;
        this.isPlacingOrder = false;
        this.isOrderPlaced = true;
        this.placedOrderDetails = res;
        this.cartService.loadCart(); // reset frontend cart items count to 0!
        this.toast.success('Order placed! Thank you for your purchase.');
      },
      error: (err) => {
        this.isPlacingOrder = false;
        console.error('Order placement failed', err);
        this.toast.error(err.error?.message || 'Failed to place order. Please try again.');
      }
    });
  }
}
