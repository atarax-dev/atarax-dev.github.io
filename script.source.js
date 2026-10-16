// ── Thème dark/light avec avatar animé ──
(function () {
    const STORAGE_KEY = 'theme';
    const DARK = 'dark';
    const LIGHT = 'light';
    // Préfixe des assets selon la profondeur de la page (/ vs /en/)
    const ASSET_BASE = document.documentElement.lang === 'en' ? '../' : '';

    // Dark mode par défaut
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved || DARK;
    document.documentElement.setAttribute('data-theme', initial);

    document.addEventListener('DOMContentLoaded', () => {
        const html        = document.documentElement;
        const toggleBtn   = document.getElementById('theme-toggle');
        const toggleLabel = toggleBtn.querySelector('.toggle-label');
        const toggleIcon  = toggleBtn.querySelector('.toggle-icon');
        const avatarStatic = document.getElementById('avatar-static');
        const avatarVideo  = document.getElementById('avatar-video');

        let current = html.getAttribute('data-theme') || DARK;
        let transitioning = false;

        function applyTheme(theme, animate) {
            if (transitioning) return;

            const goingLight = theme === LIGHT;
            const videoSrc   = ASSET_BASE + (goingLight ? 'transition-to-light.mp4' : 'transition-to-dark.mp4');
            const nextImg    = ASSET_BASE + (goingLight ? 'photo-light.webp' : 'photo-dark.webp');

            // Mise à jour UI du bouton
            const isEN = document.documentElement.lang === 'en';
            toggleBtn.setAttribute('aria-pressed', goingLight ? 'true' : 'false');
            toggleIcon.textContent = goingLight ? '🌙' : '☀️';
            toggleLabel.textContent = goingLight
                ? (isEN ? 'Dark mode' : 'Mode sombre')
                : (isEN ? 'Light mode' : 'Mode clair');

            if (!animate) {
                // Premier chargement : pas d'animation
                avatarStatic.src = nextImg;
                html.setAttribute('data-theme', theme);
                localStorage.setItem(STORAGE_KEY, theme);
                current = theme;
                return;
            }

            // Lecture de la vidéo de transition
            transitioning = true;

            // La vidéo commence sur la même image que le statique (frame 0 = état actuel)
            // → on l'affiche dès que play() démarre (pas de flash, pas de débordement iOS)
            avatarVideo.src = videoSrc;
            avatarVideo.load();

            avatarVideo.play().then(() => {
                // play() accepté → la vidéo joue, on peut l'afficher sans débordement iOS
                avatarVideo.classList.add('playing');
            }).catch(() => {
                // Autoplay bloqué → bascule direct sans animation
                avatarVideo.classList.remove('playing');
                html.setAttribute('data-theme', theme);
                localStorage.setItem(STORAGE_KEY, theme);
                current = theme;
                avatarStatic.src = nextImg;
                transitioning = false;
            });

            // Dès que la durée est connue, on programme la transition CSS à t+1s
            // et elle dure jusqu'à la fin de la vidéo
            const DELAY = 1; // secondes avant de démarrer la transition
            let themeTimer = null;

            function scheduleThemeTransition() {
                if (themeTimer !== null || !avatarVideo.duration) return;
                const transitionDuration = Math.max(0.5, avatarVideo.duration - DELAY);
                themeTimer = setTimeout(() => {
                    // Applique la durée dynamique sur :root → tous les éléments en héritent
                    html.style.setProperty('--theme-transition-duration', transitionDuration + 's');
                    html.setAttribute('data-theme', theme);
                    localStorage.setItem(STORAGE_KEY, theme);
                    current = theme;
                }, DELAY * 1000);
            }

            if (avatarVideo.readyState >= 1) {
                scheduleThemeTransition();
            } else {
                avatarVideo.addEventListener('loadedmetadata', scheduleThemeTransition, { once: true });
            }

            avatarVideo.addEventListener('ended', function onEnded() {
                avatarVideo.removeEventListener('ended', onEnded);
                if (themeTimer !== null) clearTimeout(themeTimer);

                // Fallback : si le timer n'a pas encore tiré (vidéo très courte)
                html.setAttribute('data-theme', theme);
                localStorage.setItem(STORAGE_KEY, theme);
                current = theme;

                // Swap l'image statique vers l'état final, attend qu'elle soit
                // décodée, puis cache la vidéo - évite le fond noir si pas en cache
                // Remet la durée de transition à la valeur par défaut (hovers rapides)
                html.style.removeProperty('--theme-transition-duration');

                avatarStatic.src = nextImg;
                const hideVideo = () => {
                    avatarVideo.classList.remove('playing');
                    transitioning = false;
                };
                avatarStatic.decode
                    ? avatarStatic.decode().then(hideVideo).catch(hideVideo)
                    : requestAnimationFrame(hideVideo);
            }, { once: true });
        }

        // Initialisation sans animation
        applyTheme(current, false);

        toggleBtn.addEventListener('click', () => {
            const next = current === DARK ? LIGHT : DARK;
            applyTheme(next, true);
        });
    });
})();

// Smooth animations on scroll (optimized)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

// Use requestAnimationFrame for better performance
const observer = new IntersectionObserver((entries) => {
    requestAnimationFrame(() => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    });
}, observerOptions);

// Observe all sections and expertise items for fade-in effect
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Animate expertise items with delay
    const expertiseItems = document.querySelectorAll('.expertise-item');
    expertiseItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(item);
    });

    // Animate tech showcase items with delay
    const techItems = document.querySelectorAll('.tech-item-large');
    techItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.08}s, transform 0.6s ease ${index * 0.08}s`;
        observer.observe(item);
    });

    // Bouton retour en haut
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    if (scrollToTopBtn) {
        // Afficher/masquer le bouton selon le scroll (throttled for performance)
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.pageYOffset > 300) {
                        scrollToTopBtn.classList.add('visible');
                    } else {
                        scrollToTopBtn.classList.remove('visible');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Scroll vers le haut au clic
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Animation des tags au survol (only on hover-capable devices)
    if (window.matchMedia('(hover: hover)').matches) {
        const techTags = document.querySelectorAll('.tech-tag');
        techTags.forEach(tag => {
            tag.addEventListener('mouseenter', () => {
                tag.style.transform = 'scale(1.05)';
            });
            tag.addEventListener('mouseleave', () => {
                tag.style.transform = 'scale(1)';
            });
        });
    }

    // Update current year in footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});


// ── Durées d'expérience calculées à partir de data-start / data-end (AAAA-MM) ──
(function () {
    const en = document.documentElement.lang.startsWith('en');
    const now = new Date();
    const toMonths = v => {
        if (v === 'present') return now.getFullYear() * 12 + now.getMonth();
        const [y, m] = v.split('-').map(Number);
        return y * 12 + (m - 1);
    };
    const unit = (n, one, many) => n + ' ' + (n > 1 ? many : one);
    document.querySelectorAll('[data-start][data-end]').forEach(el => {
        const total = toMonths(el.dataset.end) - toMonths(el.dataset.start);
        if (!(total >= 0)) return;
        const y = Math.floor(total / 12), m = total % 12;
        const parts = [];
        if (y) parts.push(en ? unit(y, 'year', 'years') : unit(y, 'an', 'ans'));
        if (m || !y) parts.push(en ? unit(m, 'month', 'months') : m + ' mois');
        el.textContent = parts.join(' ');
    });
})();
