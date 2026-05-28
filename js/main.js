// Berkshire Trips Livery - Interactive JS

document.addEventListener('DOMContentLoaded', () => {
  initTailwind();
  initNavbar();
  initMobileNav();
  initFareCalculator();
  initBookingModal();
  initGalleryLightbox();
  initSmoothScroll();
  initScrollAnimations();
  initFormEnhancements();
});

// Tailwind script config (called from inline too, but safe here)
function initTailwind() {
  // If Tailwind script already ran, extend config
  if (typeof tailwind !== 'undefined' && tailwind.config) {
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            forest: '#0f2c24',
            'berk-gold': '#c9a227',
          }
        }
      }
    };
  }
}

// Navbar: add background on scroll
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial
}

// Mobile hamburger menu
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const closeBtn = document.getElementById('mobile-close');

  if (!hamburger || !mobileNav) return;

  const open = () => {
    mobileNav.classList.add('open');
    mobileNav.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    mobileNav.classList.remove('open');
    setTimeout(() => {
      mobileNav.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);

  // Close when clicking a link inside
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', close);
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileNav.classList.contains('hidden')) {
      close();
    }
  });
}

// Fare calculator
function initFareCalculator() {
  const slider = document.getElementById('miles-slider');
  const input = document.getElementById('miles-input');
  const result = document.getElementById('fare-result');
  const bookBtn = document.getElementById('book-from-calculator');

  if (!slider || !input || !result) return;

  const BASE_FARE = 10;
  const PER_MILE = 1;

  const updateFare = (miles) => {
    const total = BASE_FARE + (miles * PER_MILE);
    result.textContent = `$${total.toFixed(2)}`;

    // Update book button data if exists
    if (bookBtn) {
      bookBtn.dataset.miles = miles;
      bookBtn.dataset.fare = total.toFixed(2);
    }
  };

  const sync = (value) => {
    const miles = Math.max(1, Math.min(200, parseInt(value) || 1));
    slider.value = miles;
    input.value = miles;
    updateFare(miles);
  };

  slider.addEventListener('input', (e) => sync(e.target.value));
  input.addEventListener('input', (e) => sync(e.target.value));
  input.addEventListener('blur', () => {
    // clamp on blur
    const v = parseInt(input.value);
    if (isNaN(v) || v < 1) sync(5);
    else if (v > 200) sync(200);
  });

  // Keyboard support for slider
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      setTimeout(() => sync(slider.value), 0);
    }
  });

  // Initial value
  const initial = parseInt(slider.value) || 12;
  sync(initial);

  // Quick preset buttons
  document.querySelectorAll('[data-preset-miles]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = parseInt(btn.dataset.presetMiles);
      sync(m);
      // nice flash
      result.style.transition = 'none';
      result.style.transform = 'scale(0.96)';
      setTimeout(() => {
        result.style.transition = 'all 0.2s ease';
        result.style.transform = 'scale(1)';
      }, 10);
    });
  });

  // Hook book button
  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      const miles = bookBtn.dataset.miles || slider.value;
      const fare = bookBtn.dataset.fare || result.textContent.replace('$','');
      openBookingModal({ 
        prefillNotes: `Estimated one-way fare for ${miles} miles: $${fare}`,
        suggestedFare: fare
      });
    });
  }
}

// Booking modal
let bookingModalOpen = false;

function initBookingModal() {
  const modal = document.getElementById('booking-modal');
  const openBtns = document.querySelectorAll('[data-open-booking]');
  const closeEls = modal ? modal.querySelectorAll('[data-close-modal]') : [];

  if (!modal) return;

  const open = (prefill = {}) => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    bookingModalOpen = true;
    document.body.style.overflow = 'hidden';

    // Prefill if provided
    if (prefill.prefillNotes) {
      const notes = modal.querySelector('#booking-notes');
      if (notes) notes.value = prefill.prefillNotes;
    }

    // Focus first input
    setTimeout(() => {
      const first = modal.querySelector('input:not([type=hidden])');
      if (first) first.focus();
    }, 120);
  };

  const close = () => {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    bookingModalOpen = false;
    document.body.style.overflow = '';
  };

  openBtns.forEach(btn => btn.addEventListener('click', () => open()));

  closeEls.forEach(el => el.addEventListener('click', close));

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bookingModalOpen) close();
  });

  // Form handling - opens mailto with details
  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const name = data.get('name')?.trim() || 'Guest';
      const phone = data.get('phone')?.trim() || '';
      const email = data.get('email')?.trim() || '';
      const pickup = data.get('pickup')?.trim() || '';
      const dropoff = data.get('dropoff')?.trim() || '';
      const date = data.get('date') || '';
      const time = data.get('time') || '';
      const passengers = data.get('passengers') || '1-3';
      const vehicle = data.get('vehicle') || 'Executive Sedan';
      const notes = data.get('notes')?.trim() || '';

      // Build beautiful email body
      const subject = encodeURIComponent(`Reservation Request — ${date} ${time}`);
      let body = `Hello Berkshire Trips,\n\n`;
      body += `I would like to request a reservation with the following details:\n\n`;
      body += `Name: ${name}\n`;
      if (phone) body += `Phone: ${phone}\n`;
      if (email) body += `Email: ${email}\n`;
      body += `\nPickup Location: ${pickup}\n`;
      body += `Drop-off Location: ${dropoff}\n`;
      body += `Date: ${date}\n`;
      body += `Time: ${time}\n`;
      body += `Passengers: ${passengers}\n`;
      body += `Preferred Vehicle: ${vehicle}\n`;
      if (notes) body += `\nAdditional Notes:\n${notes}\n`;
      body += `\nPlease confirm availability and pricing at your earliest convenience.\n\n`;
      body += `Thank you,\n${name}`;

      const mailto = `mailto:queensarahhh413@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`;

      // Open email client
      window.location.href = mailto;

      // Show thank you state
      showBookingConfirmation(modal, name);
    });
  }

  // Make globally available for calculator
  window.openBookingModal = open;
}

function showBookingConfirmation(modal, name) {
  const content = modal.querySelector('#booking-modal-content');
  if (!content) return;

  const originalHTML = content.innerHTML;

  content.innerHTML = `
    <div class="text-center py-8 px-6">
      <div class="mx-auto w-16 h-16 rounded-full bg-[#c9a227]/10 flex items-center justify-center mb-6">
        <svg class="w-9 h-9 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.25" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </div>
      <h3 class="text-3xl font-semibold text-[#0f2c24] mb-3">Thank you, ${name.split(' ')[0]}!</h3>
      <p class="text-[#6b6b5f] mb-6 max-w-sm mx-auto">Your email client should have opened with a pre-filled reservation request. If it didn't open, please email us directly at <a href="mailto:queensarahhh413@gmail.com" class="text-[#c9a227] underline">queensarahhh413@gmail.com</a>.</p>
      
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button onclick="window.location.reload()" 
                class="px-8 py-3 rounded-lg bg-[#0f2c24] text-white font-medium hover:bg-[#162d27] transition-colors">
          Close &amp; Return Home
        </button>
        <a href="mailto:queensarahhh413@gmail.com" 
           class="px-8 py-3 rounded-lg border border-[#0f2c24]/20 text-[#0f2c24] font-medium hover:bg-[#f8f5f0] transition-colors inline-flex items-center justify-center">
          Send Another Email
        </a>
      </div>
    </div>
  `;

  // Auto close after long time? No, user controls
}

// Gallery lightbox
function initGalleryLightbox() {
  const images = document.querySelectorAll('.gallery-img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const caption = document.getElementById('lightbox-caption');

  if (!images.length || !lightbox || !lightboxImg) return;

  let currentIndex = 0;
  const galleryItems = Array.from(images).map((img, i) => ({
    src: img.src,
    alt: img.alt || 'Berkshire County',
    caption: img.dataset.caption || img.alt || ''
  }));

  const show = (index) => {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    if (caption) caption.textContent = item.caption;
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
  };

  const hide = () => {
    lightbox.classList.remove('flex');
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  };

  images.forEach((img, i) => {
    img.addEventListener('click', () => show(i));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', hide);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => show(currentIndex - 1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => show(currentIndex + 1));

  // Backdrop + keyboard
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) hide();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') show(currentIndex - 1);
    if (e.key === 'ArrowRight') show(currentIndex + 1);
  });
}

// Smooth scrolling for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// Fade-in on scroll for sections
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

// Minor form UX
function initFormEnhancements() {
  // Auto format phone as user types
  const phoneInput = document.getElementById('booking-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 10);
      if (v.length > 6) {
        v = `(${v.slice(0,3)}) ${v.slice(3,6)}-${v.slice(6)}`;
      } else if (v.length > 3) {
        v = `(${v.slice(0,3)}) ${v.slice(3)}`;
      }
      e.target.value = v;
    });
  }

  // Set min date to today on date inputs
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
}

// Utility exposed in case needed
window.BerkshireTrips = {
  openBooking: () => {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }
  }
};