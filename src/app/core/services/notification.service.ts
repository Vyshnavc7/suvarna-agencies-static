import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface NotificationItem {
  id: number;
  targetRole: string;
  type: string;
  title: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/server/notifications';
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  public unreadCount$ = this.notifications$.pipe(
    map(items => items.filter(item => !item.readStatus).length)
  );

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.loadNotifications();
      } else {
        this.notificationsSubject.next([]);
      }
    });
  }

  loadNotifications(): void {
    if (!this.authService.currentUserValue) return;
    this.http.get<{data: NotificationItem[]}>(this.apiUrl).subscribe({
      next: (res) => this.notificationsSubject.next(res.data || []),
      error: (err) => console.error('Failed to load notifications', err)
    });
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/read/${id}`, {}).pipe(
      tap(() => this.loadNotifications())
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/read/all`, {}).pipe(
      tap(() => this.loadNotifications())
    );
  }
}
