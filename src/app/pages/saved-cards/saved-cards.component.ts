import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SavedCardService, SavedCard } from '../../core/services/saved-card.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

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
    private authService: AuthService,
    private toast: ToastService
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
      this.toast.error('Please fill out all card details.');
      return;
    }
    
    const cleanCardNumber = this.newCard.cardNumber.replace(/\s+/g, '');
    
    if (cleanCardNumber.length < 15) {
      this.toast.error('Please enter a valid card number.');
      return;
    }

    const isDuplicate = this.savedCards.some(c => c.cardNumber.replace(/\s+/g, '') === cleanCardNumber);
    if (isDuplicate) {
      this.toast.info('This card is already saved in your account.');
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
        this.toast.success('Card saved successfully!');
      },
      error: (err) => {
        console.error('Error saving card', err);
        this.toast.error(err.error?.error || 'Failed to save card. Please try again.');
        this.isSaving = false;
      }
    });
  }

  deleteCard(id: number): void {
    this.savedCardService.deleteSavedCard(id).subscribe({
      next: () => {
        this.savedCards = this.savedCards.filter(c => c.id !== id);
        this.toast.success('Card removed successfully.');
      },
      error: (err) => {
        console.error('Error deleting card', err);
        this.toast.error('Failed to remove card.');
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
