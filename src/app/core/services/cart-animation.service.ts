import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartAnimationService {
  
  constructor() { }

  animateToCart(event: Event, fallbackImageUrl: string = '') {
    const button = event.currentTarget as HTMLElement;
    if (!button) return;

    // Try to find the closest product container and its image
    const productCard = button.closest('.product-card, .featured-product-card, .detail-image-container, .card');
    let sourceElement = productCard?.querySelector('img') as HTMLElement;
    
    // If no image is found but we have a fallback, use the button itself for start coords
    if (!sourceElement) {
        sourceElement = button;
    }

    const cartIcon = document.getElementById('nav-cart-icon');
    if (!cartIcon || !sourceElement) return;

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = cartIcon.getBoundingClientRect();

    // Create the flying element
    const flyingElement = document.createElement('div');
    
    // If we have an image, make it look like the image. Otherwise just a colored dot.
    let imgSrc = '';
    if (sourceElement instanceof HTMLImageElement && sourceElement.src) {
        imgSrc = sourceElement.src;
    } else if (fallbackImageUrl) {
        imgSrc = fallbackImageUrl;
    }

    if (imgSrc) {
        flyingElement.style.backgroundImage = `url(${imgSrc})`;
        flyingElement.style.backgroundSize = 'cover';
        flyingElement.style.backgroundPosition = 'center';
        flyingElement.style.borderRadius = '50%'; // make it a cool circle
    } else {
        flyingElement.style.backgroundColor = '#c99b2e';
        flyingElement.style.borderRadius = '50%';
    }

    // Set initial styles
    flyingElement.style.position = 'fixed';
    flyingElement.style.zIndex = '9999';
    
    const size = Math.min(sourceRect.width, sourceRect.height, 100) || 50;
    flyingElement.style.width = `${size}px`;
    flyingElement.style.height = `${size}px`;
    
    const startX = sourceRect.left + sourceRect.width/2;
    const startY = sourceRect.top + sourceRect.height/2;
    
    flyingElement.style.left = `${startX}px`;
    flyingElement.style.top = `${startY}px`;
    flyingElement.style.transform = 'translate(-50%, -50%)';
    flyingElement.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    flyingElement.style.pointerEvents = 'none';

    document.body.appendChild(flyingElement);

    // Calculate trajectory
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    const deltaX = targetX - startX;
    const deltaY = targetY - startY;

    // Animate using Web Animations API
    const animation = flyingElement.animate([
      { 
          transform: 'translate(-50%, -50%) scale(1)', 
          opacity: 1 
      },
      { 
          transform: `translate(calc(-50% + ${deltaX * 0.5}px), calc(-50% + ${deltaY - 150}px)) scale(0.6)`, 
          opacity: 0.9 
      },
      { 
          transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.1)`, 
          opacity: 0 
      }
    ], {
      duration: 800,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      fill: 'forwards'
    });

    animation.onfinish = () => {
      flyingElement.remove();
      
      // Pulse the cart icon
      cartIcon.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.4)' },
        { transform: 'scale(1)' }
      ], {
        duration: 400,
        easing: 'ease-in-out'
      });
    };
  }
}
