import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = new BehaviorSubject<Toast[]>([]);
  toasts$ = this._toasts.asObservable();
  private counter = 0;

  private show(type: ToastType, message: string, duration = 4000) {
    const id = ++this.counter;
    const toast: Toast = { id, type, message, duration };
    this._toasts.next([...this._toasts.value, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration?: number) { this.show('success', message, duration); }
  error(message: string, duration?: number)   { this.show('error', message, duration); }
  warning(message: string, duration?: number) { this.show('warning', message, duration); }
  info(message: string, duration?: number)    { this.show('info', message, duration); }

  dismiss(id: number) {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }
}
