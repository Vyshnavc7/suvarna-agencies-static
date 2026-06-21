import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-signup',
    imports: [RouterLink, ReactiveFormsModule, CommonModule],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signupForm: FormGroup;
  errorMessage = '';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

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
          Swal.fire({
            icon: 'success',
            title: 'Signup Successful',
            text: 'You have been registered and logged in!',
            timer: 2000,
            showConfirmButton: false
          });
          this.router.navigate(['/']); // Redirect to home as they are auto-logged in
        },
        error: (err) => {
          console.error('Signup failed', err);
          this.errorMessage = 'Signup failed. Please try again.';
          Swal.fire({
            icon: 'error',
            title: 'Signup Failed',
            text: 'Registration failed. Please try again.'
          });
        }
      });
    }
  }
}
