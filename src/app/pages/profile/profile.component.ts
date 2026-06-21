import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-profile',
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    authService = inject(AuthService);
    profileService = inject(ProfileService);
    
    // We keep currentUser$ for basic auth state (like checking if logged in)
    currentUser$ = this.authService.currentUser;
    
    // Local state for the editable profile
    profileData: any = null;
    isEditMode = false;
    isLoading = true;

    ngOnInit(): void {
        this.fetchProfile();
    }

    fetchProfile(): void {
        this.isLoading = true;
        this.profileService.getProfile().subscribe({
            next: (res) => {
                this.profileData = res.data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to fetch profile', err);
                this.isLoading = false;
            }
        });
    }

    toggleEditMode(): void {
        if (this.isEditMode) {
            // Cancel means we discard changes, so we refetch from the server
            this.fetchProfile();
        }
        this.isEditMode = !this.isEditMode;
    }

    saveProfile(): void {
        this.profileService.updateProfile(this.profileData).subscribe({
            next: (res) => {
                this.profileData = res.data;
                this.isEditMode = false;
                Swal.fire({
                    icon: 'success',
                    title: 'Profile Updated',
                    text: 'Your personal information has been saved!',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Update the token info slightly if they changed their name, 
                // though this is optional. The next login will get fresh token data.
                const currentSession = this.authService.currentUserValue;
                if (currentSession) {
                    currentSession.name = `${this.profileData.firstName} ${this.profileData.lastName || ''}`.trim();
                    currentSession.gender = this.profileData.gender;
                    sessionStorage.setItem('user', JSON.stringify(currentSession));
                    // Using any to bypass private subject for a quick sync
                    (this.authService as any).currentUserSubject.next(currentSession);
                }
            },
            error: (err) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: 'Could not save your changes. Please try again.'
                });
            }
        });
    }
}
