import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SavedUpi {
    id?: number;
    customerId?: number;
    upiId: string;
    providerName: string;
    isDefault: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class SavedUpiService {
    private apiUrl = '/server/saved-upi';

    constructor(private http: HttpClient) { }

    getSavedUpis(): Observable<SavedUpi[]> {
        return this.http.get<SavedUpi[]>(this.apiUrl);
    }

    addSavedUpi(upi: SavedUpi): Observable<{ message: string, upi: SavedUpi }> {
        return this.http.post<{ message: string, upi: SavedUpi }>(this.apiUrl, upi);
    }

    deleteSavedUpi(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    setDefaultUpi(id: number): Observable<{ message: string, upi: SavedUpi }> {
        return this.http.put<{ message: string, upi: SavedUpi }>(`${this.apiUrl}/${id}/default`, {});
    }
}
