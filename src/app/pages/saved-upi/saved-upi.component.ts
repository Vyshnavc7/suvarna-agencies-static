import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SavedUpiService, SavedUpi } from '../../core/services/saved-upi.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

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
    private authService: AuthService
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
      Swal.fire('Error', 'Please enter a UPI ID', 'error');
      return;
    }

    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(this.newUpi.upiId)) {
      Swal.fire('Error', 'Please enter a valid UPI ID (e.g. name@bank)', 'error');
      return;
    }

    const isDuplicate = this.savedUpis.some(u => u.upiId.toLowerCase() === this.newUpi.upiId!.toLowerCase());
    if (isDuplicate) {
      Swal.fire('Info', 'This UPI ID is already saved in your account.', 'info');
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
        Swal.fire('Success', 'UPI ID saved successfully!', 'success');
      },
      error: (err) => {
        console.error('Error saving UPI', err);
        Swal.fire('Error', err.error?.error || 'Failed to save UPI. Please try again.', 'error');
        this.isSaving = false;
      }
    });
  }

  deleteUpi(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to remove this saved UPI ID?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.savedUpiService.deleteSavedUpi(id).subscribe({
          next: () => {
            this.savedUpis = this.savedUpis.filter(u => u.id !== id);
            Swal.fire('Deleted!', 'Your UPI ID has been removed.', 'success');
          },
          error: (err) => {
            console.error('Error deleting UPI', err);
            Swal.fire('Error', 'Failed to remove UPI ID.', 'error');
          }
        });
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
