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

    // Calculate dynamic duration for "Présent" positions
    function calculateDuration(startDate, endDate = null) {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        if (end.getDate() < start.getDate()) {
            months--;
            if (months < 0) {
                years--;
                months += 11;
            }
        }
        
        if (years === 0) {
            return months === 1 ? '1 mois' : `${months} mois`;
        } else if (months === 0) {
            return years === 1 ? '1 an' : `${years} ans`;
        } else {
            const yearsText = years === 1 ? '1 an' : `${years} ans`;
            const monthsText = months === 1 ? '1 mois' : `${months} mois`;
            return `${yearsText} ${monthsText}`;
        }
    }

    // Update experience periods with "Présent"
    const experiencePeriods = document.querySelectorAll('.experience-period');
    experiencePeriods.forEach(period => {
        const text = period.textContent;
        if (text.includes('Présent')) {
            // Extract start date from text (format: "octobre 2023 - Présent")
            const match = text.match(/(\w+)\s+(\d{4})\s+-\s+Présent/);
            if (match) {
                const monthName = match[1].toLowerCase();
                const year = parseInt(match[2]);
                
                // Convert French month name to number
                const months = {
                    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
                };
                
                const month = months[monthName];
                if (month !== undefined) {
                    const startDate = new Date(year, month, 1);
                    const duration = calculateDuration(startDate);
                    // Update text: "octobre 2023 - Présent (X ans Y mois)"
                    period.textContent = `${match[1]} ${year} - Présent (${duration})`;
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

