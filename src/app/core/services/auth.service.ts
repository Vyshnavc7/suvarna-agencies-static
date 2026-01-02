import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/server/auth'; // Using proxy
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient) {
    const storedUser = sessionStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  /* ... headers method logic (unchanged but re-included for completeness implies I need to be careful with replace) ... */
  /* Actually, I should just replace the whole class content or specific parts to avoid overwriting headers logic if I don't need to change it. 
     But I need to update login/signup to update the subject. */

  login(credentials: any): Observable<any> {
    const headers = new HttpHeaders({
      'x-email': credentials.email,
      'x-password': credentials.password,
      'x-user-type': 'customer',
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}/login`, {}, { headers }).pipe(
      tap((response: any) => {
        if (response.user && response.user.userType === 'admin') {
          throw new Error('Admin login not allowed');
        }
        if (response.token && response.user) {
          sessionStorage.setItem('authToken', response.token);
          sessionStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  signup(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'x-email': userData.email,
      'x-password': userData.password,
      'x-user-type': 'customer',
      'Content-Type': 'application/json'
    });
    const body = { name: userData.name };
    return this.http.post(`${this.apiUrl}/signup`, body, { headers }).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          sessionStorage.setItem('authToken', response.token);
          sessionStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
    // Or check token existence if prefered, but subject is better for UI
    // return !!sessionStorage.getItem('authToken');
  }
}
