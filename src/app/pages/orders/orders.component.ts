import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

interface GroupedOrder {
  paymentId: number;
  paymentDetails: any;
  createdAt: string;
  status: string;
  paymentStatus: string;
  items: any[];
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders: GroupedOrder[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<any[]>('/server/orders').subscribe({
      next: (data) => {
        this.orders = this.groupOrders(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.errorMessage = 'Failed to load order history. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private groupOrders(orders: any[]): GroupedOrder[] {
    const grouped: { [key: number]: GroupedOrder } = {};

    orders.forEach(order => {
      const payId = order.paymentId || 0;
      if (!grouped[payId]) {
        grouped[payId] = {
          paymentId: payId,
          paymentDetails: order.paymentDetails,
          createdAt: order.createdAt,
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: []
        };
      }
      grouped[payId].items.push({
        id: order.id,
        productId: order.productId,
        quantity: order.quantity,
        price: order.price,
        productName: order.product?.productName || 'Unknown Product',
        image: order.product?.image || 'assets/images/default-product.png',
        orderId: order.orderId,
        status: order.status,
        isReturnable: order.product?.isReturnable !== undefined ? order.product.isReturnable : true,
        returnPeriod: order.product?.returnPeriod !== undefined ? order.product.returnPeriod : 7,
        updatedAt: order.updatedAt,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentDetails?.paymentMethod || 'Original Payment Method'
      });
    });

    // Sort by date descending (newest first)
    return Object.values(grouped).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  isEligibleForReturn(item: any): boolean {
    if (item.status !== 'delivered') return false;
    if (!item.isReturnable) return false;

    const deliveryDate = new Date(item.updatedAt);
    const returnDeadline = new Date(deliveryDate.getTime() + item.returnPeriod * 24 * 60 * 60 * 1000);
    return new Date() <= returnDeadline;
  }

  openReturnExchangeModal(item: any): void {
    Swal.fire({
      title: 'Request Return / Exchange',
      html:
        '<div class="text-left mb-2"><label for="swal-req-type" style="font-weight: 600; font-size: 0.95rem;">Request Type:</label></div>' +
        '<select id="swal-req-type" class="form-control mb-3" style="padding: 8px; border-radius: 6px; font-size: 0.9rem;">' +
          '<option value="return">Return & Refund</option>' +
          '<option value="exchange">Product Exchange</option>' +
        '</select>' +
        '<div class="text-left mb-2"><label for="swal-req-reason" style="font-weight: 600; font-size: 0.95rem;">Reason for Request:</label></div>' +
        '<textarea id="swal-req-reason" class="form-control" rows="4" placeholder="Please describe the reason (min 10 characters)..." style="padding: 10px; border-radius: 6px; font-size: 0.9rem;"></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Submit Request',
      confirmButtonColor: '#ff9800',
      preConfirm: () => {
        const type = (document.getElementById('swal-req-type') as HTMLSelectElement).value;
        const reason = (document.getElementById('swal-req-reason') as HTMLTextAreaElement).value;
        
        if (!type) {
          Swal.showValidationMessage('Please select a request type');
          return false;
        }
        if (!reason || reason.trim().length < 10) {
          Swal.showValidationMessage('Reason must be at least 10 characters long');
          return false;
        }
        return { type, reason };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.submitReturnRequest(item.id, result.value.type, result.value.reason);
      }
    });
  }

  submitReturnRequest(orderId: number, type: string, reason: string): void {
    this.isLoading = true;
    this.http.post<any>('/server/orders/return-request', {
      orderId,
      type,
      reason
    }).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Request Submitted!',
          text: response.message || 'Your request has been successfully received and is pending review.',
          timer: 2500,
          showConfirmButton: false
        });
        this.fetchOrders();
      },
      error: (err) => {
        console.error('Failed to submit return request', err);
        Swal.fire('Error', err.error?.message || 'Submission failed. Please try again.', 'error');
        this.isLoading = false;
      }
    });
  }

  openCardPaymentModal(order: GroupedOrder): void {
    Swal.fire({
      title: 'Pay with Credit / Debit Card',
      html:
        '<div class="text-left mb-3"><strong style="font-size: 1.1rem; color: #222;">Total Amount: ₹' + (order.paymentDetails?.totalAmount || 0).toFixed(2) + '</strong></div>' +
        '<input id="swal-card-number" class="form-control mb-2" placeholder="Card Number (16 digits)" maxlength="16" style="padding: 10px; border-radius: 6px;">' +
        '<input id="swal-card-name" class="form-control mb-2" placeholder="Name on Card" style="padding: 10px; border-radius: 6px;">' +
        '<div class="row g-2" style="display: flex; gap: 8px;">' +
          '<div style="flex: 1;"><input id="swal-card-expiry" class="form-control" placeholder="MM/YY" maxlength="5" style="padding: 10px; border-radius: 6px;"></div>' +
          '<div style="flex: 1;"><input id="swal-card-cvv" type="password" class="form-control" placeholder="CVV" maxlength="3" style="padding: 10px; border-radius: 6px;"></div>' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Pay Now',
      confirmButtonColor: '#ff5722',
      preConfirm: () => {
        const cardNumber = (document.getElementById('swal-card-number') as HTMLInputElement).value;
        const cardName = (document.getElementById('swal-card-name') as HTMLInputElement).value;
        const expiry = (document.getElementById('swal-card-expiry') as HTMLInputElement).value;
        const cvv = (document.getElementById('swal-card-cvv') as HTMLInputElement).value;
        
        if (!cardNumber || !cardName || !expiry || !cvv) {
          Swal.showValidationMessage('Please fill in all card details');
          return false;
        }
        return { cardNumber, cardName, expiry, cvv };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeRetryPayment(order.paymentId, 'Card');
      }
    });
  }

  openUPIPaymentModal(order: GroupedOrder): void {
    Swal.fire({
      title: 'Pay with UPI',
      html:
        '<div class="text-left mb-3"><strong style="font-size: 1.1rem; color: #222;">Total Amount: ₹' + (order.paymentDetails?.totalAmount || 0).toFixed(2) + '</strong></div>' +
        '<input id="swal-upi-id" class="form-control mb-2" placeholder="Enter UPI ID (e.g. mobile@ybl, username@upi)" style="padding: 10px; border-radius: 6px;">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Pay Now',
      confirmButtonColor: '#17a2b8',
      preConfirm: () => {
        const upiId = (document.getElementById('swal-upi-id') as HTMLInputElement).value;
        if (!upiId) {
          Swal.showValidationMessage('Please enter your UPI ID');
          return false;
        }
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
        if (!upiRegex.test(upiId)) {
          Swal.showValidationMessage('Please enter a valid UPI ID (e.g. username@upi or mobile@ybl)');
          return false;
        }
        return { upiId };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeRetryPayment(order.paymentId, 'UPI');
      }
    });
  }

  switchToCOD(order: GroupedOrder): void {
    Swal.fire({
      title: 'Switch to Cash on Delivery (COD)?',
      text: 'You will pay ₹' + (order.paymentDetails?.totalAmount || 0).toFixed(2) + ' in cash upon delivery of your products. Your order status will be marked as Success (Pending delivery).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Switch to COD',
      confirmButtonColor: '#ff5722',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeRetryPayment(order.paymentId, 'COD');
      }
    });
  }

  executeRetryPayment(paymentId: number, method: string): void {
    this.isLoading = true;
    this.http.post<any>('/server/orders/retry-payment', {
      paymentId,
      paymentMethod: method
    }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          text: method === 'COD' ? 'Your order is now set to Cash on Delivery.' : 'Your card payment completed successfully.',
          timer: 2000,
          showConfirmButton: false
        });
        this.fetchOrders();
      },
      error: (err) => {
        console.error('Failed to retry payment', err);
        Swal.fire('Error', err.error?.message || 'Payment update failed. Please try again.', 'error');
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'shipped':
        return 'badge-info';
      case 'cancelled':
        return 'badge-danger';
      case 'return_requested':
      case 'exchange_requested':
        return 'badge-warning';
      case 'returned':
        return 'badge-secondary';
      case 'exchanged':
        return 'badge-primary';
      default:
        return 'badge-secondary';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'failed':
        return 'text-danger';
      case 'refunded':
        return 'text-info';
      default:
        return 'text-muted';
    }
  }
}
