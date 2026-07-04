import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-signup',
    imports: [RouterLink, ReactiveFormsModule, CommonModule],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signupForm: FormGroup;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  constructor() {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      gender: ['male', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const { name, email, password, gender } = this.signupForm.value;
      this.authService.signup({ name, email, password, gender }).subscribe({
        next: (response) => {
          console.log('Signup successful', response);
          this.toast.success('You have been registered and logged in!');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Signup failed', err);
          this.toast.error('Registration failed. Please try again.');
        }
      });
    }
  }
}
