import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SavedCard {
    id?: number;
    customerId?: number;
    cardHolderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cardType: string;
    isDefault: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class SavedCardService {
    private apiUrl = '/server/saved-cards';

    constructor(private http: HttpClient) { }

    getSavedCards(): Observable<SavedCard[]> {
        return this.http.get<SavedCard[]>(this.apiUrl);
    }

    addSavedCard(card: SavedCard): Observable<{ message: string, card: SavedCard }> {
        return this.http.post<{ message: string, card: SavedCard }>(this.apiUrl, card);
    }

    deleteSavedCard(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    setDefaultCard(id: number): Observable<{ message: string, card: SavedCard }> {
        return this.http.put<{ message: string, card: SavedCard }>(`${this.apiUrl}/${id}/default`, {});
    }
}
