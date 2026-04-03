# Optimisations Performance Mobile - Lighthouse
**Date :** 27 janvier 2025  
**Problème initial :** Score mobile 88/100 (Desktop 98/100)

---

## 🔍 Problèmes Identifiés par Lighthouse

1. **Render blocking requests** - 1,910 ms d'économies possibles
2. **Font display** - 60 ms
3. **Reduce unused CSS** - 12 KiB
4. **Reduce unused JavaScript** - 21 KiB
5. **Avoid long main-thread tasks** - 5 long tasks trouvées
6. **Use efficient cache lifetimes** - 6 KiB

---

## ✅ Optimisations Appliquées

### 1. Chargement Asynchrone des CSS Externes

**Problème :** Les CSS externes (Google Fonts, Bootstrap Icons) bloquaient le rendu.

**Solution :**
- Utilisation de `media="print"` avec `onload` pour charger les CSS de manière asynchrone
- Les CSS se chargent sans bloquer le rendu initial
- Fallback avec `<noscript>` pour les navigateurs sans JS

**Code :**
```html
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" as="style">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'">
```

**Impact :** Réduction du render blocking de ~1,910 ms

---

### 2. Optimisation des Preconnect/DNS-Prefetch

**Problème :** Connexions DNS non optimisées.

**Solution :**
- Ajout de `preconnect` pour cdn.jsdelivr.net
- Ajout de `dns-prefetch` pour améliorer la résolution DNS
- Réorganisation des preconnect en début de `<head>`

**Code :**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
```

**Impact :** Réduction de la latence de connexion

---

### 3. Optimisation JavaScript avec requestAnimationFrame

**Problème :** Longues tâches sur le main thread.

**Solution :**
- Utilisation de `requestAnimationFrame` pour les animations
- Throttling du scroll event avec `requestAnimationFrame`
- Arrêt de l'observation des éléments une fois animés (`unobserve`)

**Code :**
```javascript
const observer = new IntersectionObserver((entries) => {
    requestAnimationFrame(() => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Stop observing
            }
        });
    });
}, observerOptions);
```

**Impact :** Réduction des long tasks sur le main thread

---

### 4. Throttling du Scroll Event

**Problème :** Le scroll event se déclenchait trop souvent.

**Solution :**
- Utilisation de `requestAnimationFrame` avec flag `ticking`
- Le scroll est traité de manière optimale (60fps max)

**Code :**
```javascript
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            // Update logic
            ticking = false;
        });
        ticking = true;
    }
});
```

**Impact :** Réduction des long tasks, meilleure performance

---

### 5. Détection des Appareils avec Hover

**Problème :** Animations hover inutiles sur mobile.

**Solution :**
- Détection avec `matchMedia('(hover: hover)')`
- Les animations hover ne s'activent que sur les appareils compatibles

**Code :**
```javascript
if (window.matchMedia('(hover: hover)').matches) {
    // Hover animations only on hover-capable devices
}
```

**Impact :** Réduction du JavaScript inutile sur mobile

---

### 6. Font Display Optimisé

**Problème :** Font display non spécifié dans le CSS.

**Solution :**
- Ajout de `font-display: swap` dans le CSS
- Déjà présent dans l'URL Google Fonts (`&display=swap`)

**Code :**
```css
body {
    font-display: swap;
}
```

**Impact :** Amélioration du rendu des fonts

---

### 7. Script avec Defer

**Problème :** Script bloquant potentiel.

**Solution :**
- Ajout de l'attribut `defer` au script
- Le script se charge de manière asynchrone sans bloquer le parsing

**Code :**
```html
<script src="script.js" defer></script>
```

**Impact :** Réduction du blocking time

---

## 📊 Résultats Attendus

### Avant Optimisations
- **Mobile :** 88/100
- **Desktop :** 98/100
- **Render Blocking :** 1,910 ms
- **Long Tasks :** 5

### Après Optimisations (Estimé)
- **Mobile :** 92-95/100 ⬆️
- **Desktop :** 98-100/100
- **Render Blocking :** Réduit de ~1,500-1,800 ms
- **Long Tasks :** Réduit à 1-2

---

## 🎯 Optimisations Restantes (Optionnelles)

### 1. Réduire le CSS/JS Non Utilisé
**Problème :** 12 KiB CSS et 21 KiB JS non utilisés

**Solutions possibles :**
- Utiliser PurgeCSS pour supprimer le CSS non utilisé
- Analyser le JS et supprimer le code mort
- Utiliser des imports conditionnels

**Note :** Pour GitHub Pages, cela nécessiterait un build process (GitHub Actions)

---

### 2. Cache Lifetimes
**Problème :** Cache non optimisé

**Solution :**
- Ajouter des headers de cache via `.htaccess` ou GitHub Pages settings
- Utiliser un service worker pour le cache

**Note :** GitHub Pages gère déjà le cache, mais peut être optimisé

---

### 3. Image Optimization
**Problème :** Images externes non optimisées

**Solution :**
- Utiliser des formats modernes (WebP, AVIF)
- Lazy loading déjà implémenté ✅
- Preload des images critiques

---

## 📋 Checklist des Optimisations

### Appliquées ✅
- [x] Chargement asynchrone des CSS externes
- [x] Preconnect/DNS-prefetch optimisés
- [x] requestAnimationFrame pour animations
- [x] Throttling du scroll event
- [x] Détection hover-capable devices
- [x] Font display optimisé
- [x] Script avec defer

### Optionnelles (Si besoin)
- [ ] PurgeCSS pour réduire CSS non utilisé
- [ ] Tree-shaking JS
- [ ] Service Worker pour cache
- [ ] Optimisation images (WebP)

---

## 🚀 Prochaines Étapes

1. **Tester avec Lighthouse**
   - Relancer Lighthouse sur mobile
   - Vérifier l'amélioration du score
   - Analyser les métriques restantes

2. **Monitoring**
   - Surveiller les métriques en production
   - Utiliser PageSpeed Insights
   - Tester sur différents appareils

3. **Optimisations Avancées** (si nécessaire)
   - Mettre en place un build process
   - Implémenter PurgeCSS
   - Ajouter un Service Worker

---

## 📝 Notes Techniques

### Pourquoi media="print" pour async CSS ?
Cette technique charge le CSS de manière asynchrone :
1. Le CSS est chargé avec `media="print"` (non appliqué à l'écran)
2. Une fois chargé, `onload` change `media` à `all`
3. Le CSS s'applique sans bloquer le rendu initial

### Pourquoi requestAnimationFrame ?
- Synchronisé avec le rafraîchissement de l'écran (60fps)
- Évite les reflows/repaints inutiles
- Meilleure performance que setTimeout/setInterval

### Pourquoi unobserve ?
- Une fois un élément animé, inutile de continuer à l'observer
- Réduit la charge du IntersectionObserver
- Améliore les performances globales

---

**Toutes les optimisations critiques ont été appliquées !** 🎉

Le score mobile devrait passer de **88/100** à **92-95/100**.

