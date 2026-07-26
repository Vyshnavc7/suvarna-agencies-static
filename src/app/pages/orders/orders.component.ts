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
  returnAttachments: { name: string; type: string; url: string; size: number; isVideo?: boolean }[] = [];

  quickReturnReasons = [
    'Damaged on arrival',
    'Defective or not working properly',
    'Wrong product / model received',
    'Missing accessories or parts',
    'Quality not as expected'
  ];

  selectQuickReason(reason: string): void {
    if (!this.returnReason || this.returnReason.trim() === '') {
      this.returnReason = reason + ' - ';
    } else if (!this.returnReason.includes(reason)) {
      this.returnReason = reason + ' - ' + this.returnReason;
    }
  }

  isReasonValid(): boolean {
    if (!this.returnReason) return false;
    const trimmed = this.returnReason.trim();
    if (trimmed.length < 15) return false;
    // Require at least 3 separate words (to reject single gibberish strings like 'dsacsdcdsacsd')
    const words = trimmed.split(/\s+/).filter(w => w.length > 1);
    return words.length >= 3;
  }

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
        updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
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
    if (item.status?.toLowerCase() !== 'delivered') return false;
    const isRet = item.isReturnable !== false && item.isReturnable !== 0 && item.isReturnable !== 'false' && item.isReturnable !== '0';
    if (!isRet) return false;

    const deliveryDate = new Date(item.updatedAt || item.createdAt || Date.now());
    const returnDays = Number(item.returnPeriod) > 0 ? Number(item.returnPeriod) : 7;
    const returnDeadline = new Date(deliveryDate.getTime() + returnDays * 24 * 60 * 60 * 1000);
    return new Date() <= returnDeadline;
  }

  isEligibleForExchange(item: any): boolean {
    if (item.status?.toLowerCase() !== 'delivered') return false;
    const isExch = item.isExchangeable !== false && item.isExchangeable !== 0 && item.isExchangeable !== 'false' && item.isExchangeable !== '0';
    if (!isExch) return false;

    const deliveryDate = new Date(item.updatedAt || item.createdAt || Date.now());
    const exchangeDays = Number(item.exchangePeriod) > 0 ? Number(item.exchangePeriod) : 7;
    const exchangeDeadline = new Date(deliveryDate.getTime() + exchangeDays * 24 * 60 * 60 * 1000);
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
    this.returnAttachments = [];
  }

  closeReturnModal(): void {
    this.returnModalItem = null;
    this.returnAttachments = [];
  }

  compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.7): Promise<{ url: string; size: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ url: e.target.result, size: file.size });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          // Approximate byte size of compressed Base64 string
          const head = 'data:image/jpeg;base64,';
          const size = Math.round((compressedDataUrl.length - head.length) * 0.75);
          resolve({ url: compressedDataUrl, size });
        };
        img.onerror = () => resolve({ url: e.target.result, size: file.size });
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  onSelectAttachments(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    if (this.returnAttachments.length + files.length > 3) {
      this.toast.error('You can upload a maximum of 3 files (images/videos).');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        this.toast.error(`File "${file.name}" exceeds the 15MB limit.`);
        continue;
      }

      const isVideo = file.type.startsWith('video/');
      if (!isVideo && file.type.startsWith('image/')) {
        // Client-side HTML5 canvas compression to shrink image Base64 URLs by ~90-95%
        this.compressImage(file, 1024, 1024, 0.7).then(compressed => {
          this.returnAttachments.push({
            name: file.name,
            type: 'image/jpeg',
            url: compressed.url,
            size: compressed.size,
            isVideo: false
          });
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.returnAttachments.push({
            name: file.name,
            type: file.type,
            url: e.target.result,
            size: file.size,
            isVideo
          });
        };
        reader.readAsDataURL(file);
      }
    }
    event.target.value = '';
  }

  removeAttachment(index: number): void {
    this.returnAttachments.splice(index, 1);
  }

  submitReturnModal(): void {
    if (!this.returnReason || this.returnReason.trim().length < 10) {
      this.toast.error('Reason must be at least 10 characters long.');
      return;
    }
    this.submitReturnRequest(this.returnModalItem.id, this.returnType, this.returnReason, this.returnAttachments);
    this.returnModalItem = null;
    this.returnAttachments = [];
  }

  submitReturnRequest(orderId: number, type: string, reason: string, attachments?: any[]): void {
    this.isLoading = true;
    this.http.post<any>('/server/orders/return-request', {
      orderId,
      type,
      reason,
      attachments: attachments && attachments.length > 0 ? attachments : null
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
