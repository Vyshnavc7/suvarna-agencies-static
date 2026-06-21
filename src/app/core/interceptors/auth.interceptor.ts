import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = sessionStorage.getItem('authToken');
    const authService = inject(AuthService);
    const router = inject(Router);

    let authReq = req;

    if (token) {
        authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token expired or unauthorized
                authService.logout();
                import('sweetalert2').then(m => m.default).then(Swal => {
                    Swal.fire({
                        title: 'Session Expired',
                        text: 'Your session has expired. Please log in again.',
                        icon: 'warning',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#041E42'
                    }).then(() => {
                        router.navigate(['/login']);
                    });
                });
            }
            return throwError(() => error);
        })
    );
};
