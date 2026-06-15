import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MailService } from '../../core/services/mail.service';
import { RecaptchaModule } from 'ng-recaptcha';

@Component({
    selector: 'app-contact',
    imports: [RouterLink, FormsModule, CommonModule, RecaptchaModule],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.scss'
})
export class ContactComponent {
  formData = {
    Name: '',
    Email: '',
    Message: '',
    captchaToken: ''
  };
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private mailService: MailService) { }

  resolved(captchaResponse: string | null) {
    this.formData.captchaToken = captchaResponse || '';
  }

  onSubmit() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.mailService.sendMessage(this.formData)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.successMessage = response.message || 'Message sent successfully!';
          this.formData = { Name: '', Email: '', Message: '', captchaToken: '' }; // Reset form

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
