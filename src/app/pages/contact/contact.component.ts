import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MailService } from '../../core/services/mail.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  formData = {
    Name: '',
    Email: '',
    Message: ''
  };
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private mailService: MailService) { }

  onSubmit() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.mailService.sendMessage(this.formData)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.successMessage = response.message || 'Message sent successfully!';
          this.formData = { Name: '', Email: '', Message: '' }; // Reset form

          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Error sending message:', error);
          this.errorMessage = error.error?.message || 'Failed to send message. Please try again.';
        }
      });
  }
}
