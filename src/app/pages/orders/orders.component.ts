import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders: GroupedOrder[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  totalOrders: number = 0;
  hasMoreOrders: boolean = true;
  isLoading = true;
  errorMessage = '';

  // Return / Exchange inline state
  returnModalItem: any = null;
  returnType = 'return';
  returnReason = '';

  // Retry payment inline state
  retryOrder: GroupedOrder | null = null;
  retryMethod: 'Card' | 'UPI' | 'COD' | null = null;
  retryCardNumber = '';
  retryCardName = '';
  retryCardExpiry = '';
  retryCardCvv = '';
  retryUpiId = '';

  toast = inject(ToastService);

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(append: boolean = false, silent: boolean = false): void {
    if (!silent) this.isLoading = true;
    this.errorMessage = '';

    this.http.get<any>(`/server/orders?page=${this.currentPage}&limit=${this.pageSize}`).subscribe({
      next: (response) => {
        const rawOrders = response.data || [];
        this.totalOrders = response.count || 0;
        this.hasMoreOrders = (this.currentPage * this.pageSize) < this.totalOrders;

        if (silent) {
           const newGroups = this.groupOrders(rawOrders, append);
           // In-place merge to update tracking statuses without destroying DOM elements
           this.orders.forEach(existingOrder => {
             const updatedGroup = newGroups.find(g => g.paymentId === existingOrder.paymentId);
             if (updatedGroup) {
               existingOrder.status = updatedGroup.status;
               existingOrder.paymentStatus = updatedGroup.paymentStatus;
               existingOrder.items.forEach(existingItem => {
                 const updatedItem = updatedGroup.items.find(i => i.id === existingItem.id);
                 if (updatedItem) {
                   // Only update fields relevant to tracking and status to prevent DOM flicker
                   existingItem.status = updatedItem.status;
                   existingItem.updatedAt = updatedItem.updatedAt;
                   existingItem.paymentStatus = updatedItem.paymentStatus;
                 }
               });
             }
           });
        } else {
           this.orders = this.groupOrders(rawOrders, append);
           this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.errorMessage = 'Failed to load order history. Please try again later.';
        
        if (!silent) {
           this.isLoading = false;
        }
      }
    });
  }

  private groupOrders(orders: any[], append: boolean = false): GroupedOrder[] {
    const grouped: { [key: number]: GroupedOrder } = {};

    if (append) {
      this.orders.forEach(o => {
        grouped[o.paymentId] = o;
      });
    }

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
        isExchangeable: order.product?.isExchangeable !== undefined ? order.product.isExchangeable : true,
        exchangePeriod: order.product?.exchangePeriod !== undefined ? order.product.exchangePeriod : 7,
        isCancellable: order.product?.isCancellable !== undefined ? order.product.isCancellable : true,
        cancelPeriod: order.product?.cancelPeriod !== undefined ? order.product.cancelPeriod : 24,
        createdAt: order.createdAt,
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

  get filteredOrders() {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return this.orders;
    }
    const lowerQuery = this.searchQuery.toLowerCase();
    return this.orders.map(order => {
      const matchingItems = order.items.filter(item =>
        item.productName.toLowerCase().includes(lowerQuery) ||
        (order.paymentId || '').toString().includes(lowerQuery)
      );
      return { ...order, items: matchingItems };
    }).filter(order => order.items.length > 0);
  }

  showMoreOrders() {
    if (this.hasMoreOrders) {
      this.currentPage++;
      this.fetchOrders(true);
    }
  }

  isEligibleForReturn(item: any): boolean {
    if (item.status !== 'delivered') return false;
    if (!item.isReturnable) return false;

    const deliveryDate = new Date(item.updatedAt);
    const returnDeadline = new Date(deliveryDate.getTime() + item.returnPeriod * 24 * 60 * 60 * 1000);
    return new Date() <= returnDeadline;
  }

  isEligibleForExchange(item: any): boolean {
    if (item.status !== 'delivered') return false;
    if (!item.isExchangeable) return false;

    const deliveryDate = new Date(item.updatedAt);
    const exchangeDeadline = new Date(deliveryDate.getTime() + item.exchangePeriod * 24 * 60 * 60 * 1000);
    return new Date() <= exchangeDeadline;
  }

  isEligibleForCancellation(item: any): boolean {
    const s = item.status?.toLowerCase();
    
    // Status must be pending or processing
    if (s !== 'pending' && s !== 'processing') {
      return false;
    }
    
    // Check product specific policy
    if (item.isCancellable === false) {
      return false;
    }
    
    // Must be within cancellation period
    const cancelDeadlineHours = item.cancelPeriod !== undefined ? item.cancelPeriod : 24;
    const orderDate = new Date(item.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    
    return diffInHours <= cancelDeadlineHours;
  }

  cancelOrder(item: any): void {
    if (confirm('Are you sure you want to cancel this order item?')) {
      this.isLoading = true;
      this.http.post<any>('/server/orders/cancel', { orderId: item.id }).subscribe({
        next: (response) => {
          this.toast.success(response.message || 'Order cancelled successfully.');
          this.fetchOrders();
        },
        error: (err) => {
          console.error('Failed to cancel order', err);
          this.toast.error(err.error?.message || 'Cancellation failed. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  openReturnExchangeModal(item: any, type: 'return' | 'exchange'): void {
    this.returnModalItem = item;
    this.returnType = type;
    this.returnReason = '';
  }

  closeReturnModal(): void {
    this.returnModalItem = null;
  }

  submitReturnModal(): void {
    if (!this.returnReason || this.returnReason.trim().length < 10) {
      this.toast.error('Reason must be at least 10 characters long.');
      return;
    }
    this.submitReturnRequest(this.returnModalItem.id, this.returnType, this.returnReason);
    this.returnModalItem = null;
  }

  submitReturnRequest(orderId: number, type: string, reason: string): void {
    this.isLoading = true;
    this.http.post<any>('/server/orders/return-request', {
      orderId,
      type,
      reason
    }).subscribe({
      next: (response) => {
        this.toast.success(response.message || 'Your request has been successfully received and is pending review.');
        this.fetchOrders();
      },
      error: (err) => {
        console.error('Failed to submit return request', err);
        this.toast.error(err.error?.message || 'Submission failed. Please try again.');
        this.isLoading = false;
      }
    });
  }

  openCardPaymentModal(order: GroupedOrder): void {
    this.retryOrder = order;
    this.retryMethod = 'Card';
    this.retryCardNumber = '';
    this.retryCardName = '';
    this.retryCardExpiry = '';
    this.retryCardCvv = '';
  }

  submitCardPayment(): void {
    if (!this.retryCardNumber || !this.retryCardName || !this.retryCardExpiry || !this.retryCardCvv) {
      this.toast.error('Please fill in all card details.');
      return;
    }
    this.executeRetryPayment(this.retryOrder!.paymentId, 'Card');
    this.retryOrder = null;
    this.retryMethod = null;
  }

  openUPIPaymentModal(order: GroupedOrder): void {
    this.retryOrder = order;
    this.retryMethod = 'UPI';
    this.retryUpiId = '';
  }

  submitUpiPayment(): void {
    if (!this.retryUpiId) {
      this.toast.error('Please enter your UPI ID.');
      return;
    }
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
    if (!upiRegex.test(this.retryUpiId)) {
      this.toast.error('Please enter a valid UPI ID (e.g. username@upi or mobile@ybl).');
      return;
    }
    this.executeRetryPayment(this.retryOrder!.paymentId, 'UPI');
    this.retryOrder = null;
    this.retryMethod = null;
  }

  switchToCOD(order: GroupedOrder): void {
    this.executeRetryPayment(order.paymentId, 'COD');
  }

  closeRetryModal(): void {
    this.retryOrder = null;
    this.retryMethod = null;
  }

  executeRetryPayment(paymentId: number, method: string): void {
    this.isLoading = true;
    this.http.post<any>('/server/orders/retry-payment', {
      paymentId,
      paymentMethod: method
    }).subscribe({
      next: () => {
        this.toast.success(method === 'COD' ? 'Your order is now set to Cash on Delivery.' : 'Payment completed successfully.');
        this.fetchOrders();
      },
      error: (err) => {
        console.error('Failed to retry payment', err);
        this.toast.error(err.error?.message || 'Payment update failed. Please try again.');
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

  getTimelineSteps(status: string): any[] {
    const s = (status || 'pending').toLowerCase();
    
    // Cancelled flow
    if (s === 'cancelled') {
      return [
        { label: 'Order Placed', icon: 'fas fa-clipboard-check', completed: true, active: false },
        { label: 'Cancelled', icon: 'fas fa-times-circle', completed: true, active: true, isError: true }
      ];
    }
    
    // Return flow
    if (s.includes('return')) {
      return [
        { label: 'Delivered', icon: 'fas fa-home', completed: true, active: false },
        { label: 'Return Requested', icon: 'fas fa-undo', completed: true, active: s === 'return_requested' },
        { label: 'Returned', icon: 'fas fa-box-open', completed: s === 'returned', active: s === 'returned', isError: true }
      ];
    }

    // Standard flow mapping
    const standardSteps = [
      { id: 'pending', label: 'Order Placed', icon: 'fas fa-clipboard-check' },
      { id: 'processing', label: 'Processing', icon: 'fas fa-cog' },
      { id: 'shipped', label: 'Shipped', icon: 'fas fa-truck' },
      { id: 'delivered', label: 'Delivered', icon: 'fas fa-home' }
    ];

    let currentStepIndex = 0;
    if (s === 'processing') currentStepIndex = 1;
    else if (s === 'shipped') currentStepIndex = 2;
    else if (s === 'delivered' || s === 'completed') currentStepIndex = 3;

    return standardSteps.map((step, index) => ({
      ...step,
      completed: index <= currentStepIndex,
      // If it's fully delivered (index 3), it shouldn't pulse as "in-progress", it's completely done.
      active: index === currentStepIndex && currentStepIndex !== 3
    }));
  }

  refreshTracking(item: any, event: Event): void {
    event.stopPropagation();
    // Trigger a completely silent background fetch, with no visual loading indicators
    this.fetchOrders(false, true);
  }

  trackByStepId(index: number, step: any): string {
    return step.id;
  }
}
