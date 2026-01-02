import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    // Initialize Owl Carousel
    /*
    $('.owl-carousel').owlCarousel({
      loop: true,
      margin: 10,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
          nav: true
        },
        600: {
          items: 2,
          nav: false
        },
        900: {
          items: 3,
          nav: false
        },
        1000: {
          items: 4,
          nav: true,
          loop: false,
          margin: 20
        }
      }
    });
    */
    // Note: The original index.html had owl carousel initialization.
    // However, the home.html I copied doesn't seem to have the .owl-carousel class on any element?
    // Let me check the HTML content I wrote.
  }
}
