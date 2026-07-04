import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    imports: [RouterLink, ReactiveFormsModule, CommonModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;


  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          this.toast.success('Welcome back!');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Login failed', err);
          if (err.message === 'Admin login not allowed') {
            this.toast.error('This is a customer portal. Admins are not allowed.');
          } else {
            this.toast.error('Invalid credentials. Please try again.');
          }
        }
      });
    }
  }
}
