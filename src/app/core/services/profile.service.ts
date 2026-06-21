import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = '/server/profile';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(this.apiUrl, profileData, { headers: this.getHeaders() });
  }
}
