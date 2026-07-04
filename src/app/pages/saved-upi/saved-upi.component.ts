import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SavedUpiService, SavedUpi } from '../../core/services/saved-upi.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-saved-upi',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './saved-upi.component.html',
  styleUrls: ['./saved-upi.component.scss']
})
export class SavedUpiComponent implements OnInit {
  savedUpis: SavedUpi[] = [];
  isLoading = true;
  showAddForm = false;
  isSaving = false;
  
  newUpi: Partial<SavedUpi> = {
    upiId: '',
    providerName: 'Google Pay',
    isDefault: false
  };

  providers = [
    { name: 'Google Pay', icon: 'fab fa-google-pay' },
    { name: 'PhonePe', icon: 'fas fa-mobile-alt' },
    { name: 'Paytm', icon: 'fas fa-wallet' },
    { name: 'Amazon Pay', icon: 'fab fa-amazon-pay' },
    { name: 'BHIM', icon: 'fas fa-university' },
    { name: 'Other', icon: 'fas fa-qrcode' }
  ];

  constructor(
    private savedUpiService: SavedUpiService,
    private authService: AuthService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadSavedUpis();
    } else {
      this.isLoading = false;
    }
  }

  loadSavedUpis(): void {
    this.isLoading = true;
    this.savedUpiService.getSavedUpis().subscribe({
      next: (upis) => {
        this.savedUpis = upis;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading UPIs', err);
        this.isLoading = false;
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.newUpi = { upiId: '', providerName: 'Google Pay', isDefault: this.savedUpis.length === 0 };
    }
  }

  saveUpi(): void {
    if (this.isSaving) return;

    if (!this.newUpi.upiId || !this.newUpi.providerName) {
      this.toast.error('Please enter a UPI ID.');
      return;
    }

    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(this.newUpi.upiId)) {
      this.toast.error('Please enter a valid UPI ID (e.g. name@bank).');
      return;
    }

    const isDuplicate = this.savedUpis.some(u => u.upiId.toLowerCase() === this.newUpi.upiId!.toLowerCase());
    if (isDuplicate) {
      this.toast.info('This UPI ID is already saved in your account.');
      return;
    }

    this.isSaving = true;

    this.savedUpiService.addSavedUpi(this.newUpi as SavedUpi).subscribe({
      next: (res) => {
        this.savedUpis.push(res.upi);
        this.showAddForm = false;
        this.isSaving = false;
        if (res.upi.isDefault) {
          this.savedUpis.forEach(u => {
            if (u.id !== res.upi.id) u.isDefault = false;
          });
        }
        this.toast.success('UPI ID saved successfully!');
      },
      error: (err) => {
        console.error('Error saving UPI', err);
        this.toast.error(err.error?.error || 'Failed to save UPI. Please try again.');
        this.isSaving = false;
      }
    });
  }

  deleteUpi(id: number): void {
    this.savedUpiService.deleteSavedUpi(id).subscribe({
      next: () => {
        this.savedUpis = this.savedUpis.filter(u => u.id !== id);
        this.toast.success('UPI ID removed successfully.');
      },
      error: (err) => {
        console.error('Error deleting UPI', err);
        this.toast.error('Failed to remove UPI ID.');
      }
    });
  }

  setDefault(id: number): void {
    this.savedUpiService.setDefaultUpi(id).subscribe({
      next: (res) => {
        this.savedUpis.forEach(u => {
          u.isDefault = (u.id === id);
        });
      },
      error: (err) => {
        console.error('Error setting default UPI', err);
      }
    });
  }

  getProviderIcon(providerName: string): string {
    const provider = this.providers.find(p => p.name === providerName);
    return provider ? provider.icon : 'fas fa-qrcode';
  }
}
