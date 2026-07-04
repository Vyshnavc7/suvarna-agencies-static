import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        class="toast-item toast-{{ toast.type }}"
        [class.toast-exit]="dismissing.has(toast.id)"
        (click)="dismiss(toast.id)"
      >
        <span class="toast-icon">
          <i *ngIf="toast.type === 'success'" class="fas fa-check-circle"></i>
          <i *ngIf="toast.type === 'error'"   class="fas fa-times-circle"></i>
          <i *ngIf="toast.type === 'warning'" class="fas fa-exclamation-triangle"></i>
          <i *ngIf="toast.type === 'info'"    class="fas fa-info-circle"></i>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="dismiss(toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
      pointer-events: none;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 14px;
      min-width: 280px;
      max-width: 380px;
      background: #fff;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid transparent;
      cursor: pointer;
      pointer-events: all;
      animation: toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    .toast-item.toast-exit {
      animation: toastSlideOut 0.25s ease forwards;
    }

    .toast-success { border-left-color: #22c55e; }
    .toast-error   { border-left-color: #ef4444; }
    .toast-warning { border-left-color: #f59e0b; }
    .toast-info    { border-left-color: #3b82f6; }

    .toast-icon {
      font-size: 1.15rem;
      flex-shrink: 0;
    }

    .toast-success .toast-icon { color: #22c55e; }
    .toast-error   .toast-icon { color: #ef4444; }
    .toast-warning .toast-icon { color: #f59e0b; }
    .toast-info    .toast-icon { color: #3b82f6; }

    .toast-message {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 500;
      color: #1e293b;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      font-size: 0.8rem;
      flex-shrink: 0;
      line-height: 1;
      transition: color 0.2s;
      &:hover { color: #64748b; }
    }

    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(40px) scale(0.95); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    @keyframes toastSlideOut {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to   { opacity: 0; transform: translateX(40px) scale(0.95); }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  dismissing = new Set<number>();
  private sub!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toasts$.subscribe(t => this.toasts = t);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  dismiss(id: number) {
    this.dismissing.add(id);
    setTimeout(() => {
      this.toastService.dismiss(id);
      this.dismissing.delete(id);
    }, 250);
  }
}
