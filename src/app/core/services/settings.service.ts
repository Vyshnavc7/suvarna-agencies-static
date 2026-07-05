import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface SiteSettings {
  proDiscountPercentage?: number;
  proUpgradeThreshold?: number;
  brandName?: string;
  brandSubName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  aboutText?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  copyrightText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = '/server/settings/public';
  private settingsSubject = new BehaviorSubject<SiteSettings | null>(null);
  
  settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSettings();
  }

  loadSettings(): void {
    this.http.get<{ data: SiteSettings }>(this.apiUrl).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.settingsSubject.next(res.data);
        }
      },
      error: (err) => console.error('Failed to load site settings', err)
    });
  }
}
