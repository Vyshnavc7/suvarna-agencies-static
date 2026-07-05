import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
    selector: 'app-footer',
    imports: [RouterLink, CommonModule],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterComponent {
    authService = inject(AuthService);
    settingsService = inject(SettingsService);
    settings$ = this.settingsService.settings$;
}
