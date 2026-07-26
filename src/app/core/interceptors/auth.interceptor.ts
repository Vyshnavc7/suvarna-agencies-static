import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Extract a human-readable message from an HttpErrorResponse. */
function getErrorMessage(error: HttpErrorResponse): string {
    // Server sent a JSON body with a message field
    const body = error.error;
    if (body) {
        if (typeof body === 'string' && body.length < 200) return body;
        if (body.message) return body.message;
        if (body.error && typeof body.error === 'string') return body.error;
    }

    // Fall back to status-code defaults
    switch (error.status) {
        case 400: return 'Bad request. Please check your input and try again.';
        case 403: return 'You do not have permission to perform this action.';
        case 404: return 'The requested resource was not found.';
        case 409: return 'A conflict occurred. The data may already exist.';
        case 422: return 'Validation failed. Please check your input.';
        case 429: return 'Too many requests. Please slow down and try again.';
        case 500: return 'A server error occurred. Please try again later.';
        case 502: return 'Bad gateway. The server is temporarily unavailable.';
        case 503: return 'Service unavailable. Please try again later.';
        default:  return error.message || 'An unexpected error occurred.';
    }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = sessionStorage.getItem('authToken');
    const authService = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    let authReq = req;

    if (token) {
        authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token expired or unauthorized — use SweetAlert for session flow
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
            } else if (error.status >= 500) {
                // Only 5xx server errors get a global fallback toast (components handle 4xx client validation)
                toast.error(getErrorMessage(error));
            }
            return throwError(() => error);
        })
    );
};
