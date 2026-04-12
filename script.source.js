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

    // Calculate dynamic duration - locale-aware (FR/EN)
    const isEN = document.documentElement.lang === 'en';
    const PRESENT = isEN ? 'Present' : 'Présent';
    const MONTH_NAMES = isEN
        ? { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 }
        : { janvier: 0, 'février': 1, mars: 2, avril: 3, mai: 4, juin: 5,
            juillet: 6, 'août': 7, septembre: 8, octobre: 9, novembre: 10, 'décembre': 11 };

    function calculateDuration(startDate) {
        const start = new Date(startDate);
        const end = new Date();

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();

        if (months < 0) { years--; months += 12; }
        if (end.getDate() < start.getDate()) {
            months--;
            if (months < 0) { years--; months += 11; }
        }

        if (isEN) {
            if (years === 0) return months === 1 ? '1 month' : `${months} months`;
            if (months === 0) return years === 1 ? '1 year' : `${years} years`;
            return `${years === 1 ? '1 year' : `${years} years`} ${months === 1 ? '1 month' : `${months} months`}`;
        } else {
            if (years === 0) return months === 1 ? '1 mois' : `${months} mois`;
            if (months === 0) return years === 1 ? '1 an' : `${years} ans`;
            return `${years === 1 ? '1 an' : `${years} ans`} ${months === 1 ? '1 mois' : `${months} mois`}`;
        }
    }

    // Update experience periods with "Présent" / "Present"
    document.querySelectorAll('.experience-period').forEach(period => {
        const text = period.textContent;
        if (text.includes(PRESENT)) {
            const match = text.match(/(\w+)\s+(\d{4})\s+-\s+(?:Présent|Present)/);
            if (match) {
                const month = MONTH_NAMES[match[1].toLowerCase()];
                if (month !== undefined) {
                    const duration = calculateDuration(new Date(parseInt(match[2]), month, 1));
                    period.textContent = `${match[1]} ${match[2]} - ${PRESENT} (${duration})`;
                }
            }
        }
    });

    // Update current year in footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});

