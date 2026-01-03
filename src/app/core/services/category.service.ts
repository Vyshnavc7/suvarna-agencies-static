import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private http = inject(HttpClient);
    private apiUrl = '/server/category';

    getCategoriesForMenu(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/menu`);
    }
}
