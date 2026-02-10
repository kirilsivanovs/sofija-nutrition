/**
 * Scroll Animations Module
 * Professional scroll-triggered animations using Intersection Observer
 * Updated for Tailwind CSS structure
 */

class ScrollAnimations {
  constructor(options = {}) {
    this.options = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
      staggerDelay: 100,
      ...options,
    };

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.prepareElements();
    this.createObservers();
    this.initScrollProgress();
    this.initChartAnimation();
    console.log('ScrollAnimations initialized');
  }

  prepareElements() {
    // Get hero section to exclude it completely
    const heroSection = document.getElementById('hero');

    // Force remove all animation classes from hero
    if (heroSection) {
      heroSection.classList.remove(
        'animate-on-scroll',
        'fade-up',
        'scale-up',
        'slide-left',
        'slide-right'
      );
      heroSection.querySelectorAll('*').forEach((el) => {
        el.classList.remove(
          'animate-on-scroll',
          'fade-up',
          'scale-up',
          'slide-left',
          'slide-right',
          'stagger'
        );
      });
    }

    // All sections except hero - fade up
    document.querySelectorAll('section').forEach((section) => {
      // Skip hero section completely
      if (section === heroSection || section.id === 'hero' || section.querySelector('h1')) {
        return;
      }
      section.classList.add('animate-on-scroll', 'fade-up');
    });

    // Section headers (h2 centered)
    document.querySelectorAll('section .text-center h2').forEach((header) => {
      const parent = header.closest('.text-center');
      if (parent) {
        parent.classList.add('animate-on-scroll', 'fade-up');
      }
    });

    // Process/How it works steps - stagger
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.querySelectorAll('.grid > div').forEach((step, i) => {
        step.classList.add('animate-on-scroll', 'fade-up', 'stagger');
        step.style.setProperty('--stagger-index', i);
      });
    }

    // Program includes list items - stagger
    document.querySelectorAll('#program ul li').forEach((item, i) => {
      item.classList.add('animate-on-scroll', 'fade-up', 'stagger');
      item.style.setProperty('--stagger-index', i);
    });

    // Testimonial cards - stagger
    const testimonialsSection = document.getElementById('testimonials');
    if (testimonialsSection) {
      testimonialsSection.querySelectorAll('.grid > div').forEach((card, i) => {
        card.classList.add('animate-on-scroll', 'scale-up', 'stagger');
        card.style.setProperty('--stagger-index', i);
      });
    }

    // About credentials - stagger
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection
        .querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 > div')
        .forEach((cred, i) => {
          cred.classList.add('animate-on-scroll', 'fade-up', 'stagger');
          cred.style.setProperty('--stagger-index', i);
        });

      // Science cards
      aboutSection
        .querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div')
        .forEach((card, i) => {
          card.classList.add('animate-on-scroll', 'scale-up', 'stagger');
          card.style.setProperty('--stagger-index', i);
        });
    }

    // CGM chart image - slide in from right
    const cgmImage = document.querySelector('[data-animate="chart"]');
    if (cgmImage) {
      cgmImage.classList.add('animate-on-scroll', 'slide-right');
    }

    // Also find the CGM chart by image src
    document
      .querySelectorAll('img[src*="cgm"], img[src*="chart"], img[alt*="CGM"]')
      .forEach((img) => {
        const container = img.closest('div');
        if (container && !container.classList.contains('animate-on-scroll')) {
          container.classList.add('animate-on-scroll', 'slide-right');
        }
      });

    // Big numbers for counter animation (skip hero)
    document.querySelectorAll('.text-5xl, .text-6xl, .text-7xl').forEach((el) => {
      // Skip if inside hero
      if (el.closest('#hero') || el.closest('section')?.querySelector('h1')) return;
      if (/\d+%?/.test(el.textContent)) {
        el.classList.add('animate-number');
        el.closest('div')?.classList.add('animate-on-scroll', 'scale-up');
      }
    });

    // Hero benefits - NO animation for hero elements
    // Removed: const heroBenefits = document.querySelectorAll('section:first-of-type ul li');
  }

  createObservers() {
    const mainObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');

            // Animate numbers if present
            const numbers = entry.target.querySelectorAll('.animate-number:not(.counted)');
            numbers.forEach((num) => this.animateNumber(num));

            // Check if this element itself is a number
            if (
              entry.target.classList.contains('animate-number') &&
              !entry.target.classList.contains('counted')
            ) {
              this.animateNumber(entry.target);
            }
          }
        });
      },
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin,
      }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      mainObserver.observe(el);
    });

    // Also observe number elements directly
    document.querySelectorAll('.animate-number').forEach((el) => {
      mainObserver.observe(el);
    });

    this.initParallax();
  }

  animateNumber(element) {
    element.classList.add('counted');
    const text = element.textContent;
    const match = text.match(/(\d+)/);

    if (match) {
      const targetNum = parseInt(match[0]);
      const prefix = text.substring(0, text.indexOf(match[0]));
      const suffix = text.substring(text.indexOf(match[0]) + match[0].length);

      let current = 0;
      const duration = 2000;
      const step = targetNum / (duration / 16);

      const animate = () => {
        current += step;
        if (current < targetNum) {
          element.textContent = prefix + Math.floor(current) + suffix;
          requestAnimationFrame(animate);
        } else {
          element.textContent = text;
        }
      };

      animate();
    }
  }

  initParallax() {
    // Parallax removed — caused hero image to shift down and overlap content below on scroll
  }

  initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    let progressTicking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!progressTicking) {
          progressTicking = true;
          requestAnimationFrame(() => {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
              progressBar.style.width = `${(window.pageYOffset / docHeight) * 100}%`;
            }
            progressTicking = false;
          });
        }
      },
      { passive: true }
    );
  }

  initChartAnimation() {
    // Animated SVG chart drawing effect for the glucose chart
    const svgCharts = document.querySelectorAll('svg[viewBox]');
    svgCharts.forEach((svg) => {
      const paths = svg.querySelectorAll('path');
      paths.forEach((path) => {
        const length = path.getTotalLength ? path.getTotalLength() : 500;
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        path.style.transition = 'stroke-dashoffset 2s ease-out';
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              paths.forEach((path, i) => {
                setTimeout(() => {
                  path.style.strokeDashoffset = '0';
                }, i * 300);
              });
              observer.unobserve(svg);
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(svg);
    });

    // Also animate any chart images
    const chartImages = document.querySelectorAll('img[src*="cgm"], img[src*="chart"]');
    chartImages.forEach((img) => {
      img.style.opacity = '0';
      img.style.transform = 'translateX(50px)';
      img.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                img.style.opacity = '1';
                img.style.transform = 'translateX(0)';
              }, 300);
              observer.unobserve(img);
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(img);
    });
  }
}

// Auto-initialize
const scrollAnimations = new ScrollAnimations();
