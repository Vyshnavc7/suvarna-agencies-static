import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.scss']
})
export class TrackOrderComponent {
  orderIdInput: string = '';
  isSearching: boolean = false;
  hasSearched: boolean = false;
  trackingData: any[] = [];
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  searchOrder() {
    if (!this.orderIdInput.trim()) return;
    
    this.isSearching = true;
    this.hasSearched = true;
    this.errorMessage = '';
    this.trackingData = [];

    this.http.get<{data: any[]}>(`/server/store/track/${this.orderIdInput.trim()}`).subscribe({
      next: (res) => {
        this.trackingData = res.data;
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Tracking Error', err);
        this.errorMessage = 'We couldn\'t find any orders with that ID. Please check and try again.';
        this.isSearching = false;
      }
    });
  }

  getTimelineSteps(status: string): any[] {
    const s = (status || 'pending').toLowerCase();
    
    if (s === 'cancelled' || s === 'returned' || s === 'exchanged' || s === 'return_requested' || s === 'exchange_requested') {
      return [
        { id: 'pending', label: 'Order Placed', icon: 'fas fa-clipboard-check', completed: true, active: false },
        { id: s, label: s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: 'fas fa-times-circle', completed: true, active: true, isError: true }
      ];
    }

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
      active: index === currentStepIndex && currentStepIndex !== 3
    }));
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered': return 'text-success';
      case 'pending': return 'text-warning';
      case 'shipped': return 'text-info';
      case 'cancelled': return 'text-danger';
      default: return 'text-secondary';
    }
  }
}
