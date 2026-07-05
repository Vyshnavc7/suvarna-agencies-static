import { Routes } from '@angular/router';
// Trigger Angular compiler re-evaluation for checkout & orders page routes
import { HomeComponent } from './pages/home/home.component';
import { ShopComponent } from './pages/shop/shop.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'shop', component: ShopComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
    { path: 'product/:id', component: ProductDetailComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'cart', loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent) },
    { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
    { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
    { path: 'checkout/success/:orderId', loadComponent: () => import('./pages/order-success/order-success.component').then(m => m.OrderSuccessComponent) },
    { path: 'orders', loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent) },
    { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
    { path: 'services', loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent) },
    { path: 'wishlist', loadComponent: () => import('./pages/wishlist/wishlist.component').then(m => m.WishlistComponent) },
    { path: 'saved-cards', loadComponent: () => import('./pages/saved-cards/saved-cards.component').then(m => m.SavedCardsComponent) },
    { path: 'saved-upi', loadComponent: () => import('./pages/saved-upi/saved-upi.component').then(m => m.SavedUpiComponent) },
    { path: 'track-order', loadComponent: () => import('./pages/track-order/track-order.component').then(m => m.TrackOrderComponent) },
    { path: '**', redirectTo: '' }
];
