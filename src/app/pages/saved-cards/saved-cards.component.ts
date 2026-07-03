import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SavedCardService, SavedCard } from '../../core/services/saved-card.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-saved-cards',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './saved-cards.component.html',
  styleUrls: ['./saved-cards.component.scss']
})
export class SavedCardsComponent implements OnInit {
  savedCards: SavedCard[] = [];
  isLoading = true;
  showAddForm = false;
  
  newCard: Partial<SavedCard> = {
    cardHolderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cardType: 'Visa',
    isDefault: false
  };

  isSaving = false;

  months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  years: string[] = [];

  constructor(
    private savedCardService: SavedCardService,
    private authService: AuthService
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 15; i++) {
      this.years.push((currentYear + i).toString());
    }
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadSavedCards();
    } else {
      this.isLoading = false;
    }
  }

  loadSavedCards(): void {
    this.isLoading = true;
    this.savedCardService.getSavedCards().subscribe({
      next: (cards) => {
        this.savedCards = cards;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading cards', err);
        this.isLoading = false;
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.newCard = { cardHolderName: '', cardNumber: '', expiryMonth: '', expiryYear: '', cardType: 'Visa', isDefault: this.savedCards.length === 0 };
    }
  }

  onCardNumberInput(event: any): void {
    let input = event.target.value.replace(/\D/g, ''); // Remove non-digits
    // Add space every 4 digits
    input = input.replace(/(.{4})/g, '$1 ').trim();
    this.newCard.cardNumber = input;
  }

  saveCard(): void {
    if (this.isSaving) return;

    if (!this.newCard.cardHolderName || !this.newCard.cardNumber || !this.newCard.expiryMonth || !this.newCard.expiryYear) {
      Swal.fire('Error', 'Please fill out all card details', 'error');
      return;
    }
    
    const cleanCardNumber = this.newCard.cardNumber.replace(/\s+/g, '');
    
    if (cleanCardNumber.length < 15) {
      Swal.fire('Error', 'Please enter a valid card number', 'error');
      return;
    }

    const isDuplicate = this.savedCards.some(c => c.cardNumber.replace(/\s+/g, '') === cleanCardNumber);
    if (isDuplicate) {
      Swal.fire('Info', 'This card is already saved in your account.', 'info');
      return;
    }

    this.isSaving = true;
    const cardToSave = { ...this.newCard, cardNumber: cleanCardNumber };

    this.savedCardService.addSavedCard(cardToSave as SavedCard).subscribe({
      next: (res) => {
        this.savedCards.push(res.card);
        this.showAddForm = false;
        this.isSaving = false;
        // If it was marked as default, unset others locally
        if (res.card.isDefault) {
          this.savedCards.forEach(c => {
            if (c.id !== res.card.id) c.isDefault = false;
          });
        }
        Swal.fire('Success', 'Card saved successfully!', 'success');
      },
      error: (err) => {
        console.error('Error saving card', err);
        Swal.fire('Error', err.error?.error || 'Failed to save card. Please try again.', 'error');
        this.isSaving = false;
      }
    });
  }

  deleteCard(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to remove this saved card?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.savedCardService.deleteSavedCard(id).subscribe({
          next: () => {
            this.savedCards = this.savedCards.filter(c => c.id !== id);
            Swal.fire('Deleted!', 'Your card has been removed.', 'success');
          },
          error: (err) => {
            console.error('Error deleting card', err);
            Swal.fire('Error', 'Failed to remove card.', 'error');
          }
        });
      }
    });
  }

  setDefault(id: number): void {
    this.savedCardService.setDefaultCard(id).subscribe({
      next: (res) => {
        this.savedCards.forEach(c => {
          c.isDefault = (c.id === id);
        });
      },
      error: (err) => {
        console.error('Error setting default card', err);
      }
    });
  }

  formatCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    return '•••• •••• •••• ' + cardNumber.slice(-4);
  }
}
