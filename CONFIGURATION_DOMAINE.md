# Configuration du nom de domaine personnalisé pour GitHub Pages

Ce guide vous explique comment connecter votre nom de domaine `audricvernet.dev` à votre site GitHub Pages.

## ✅ Étapes déjà effectuées

1. ✅ Fichier `CNAME` créé avec `audricvernet.dev`
2. ✅ URLs mises à jour dans `index.html` (canonical, Open Graph, Twitter Card, JSON-LD)
3. ✅ URLs mises à jour dans `sitemap.xml`
4. ✅ URLs mises à jour dans `robots.txt`

## 🔧 Étapes à effectuer

### 1. Configurer les enregistrements DNS

Connectez-vous à votre registraire de domaine (là où vous avez acheté `audricvernet.dev`) et configurez les enregistrements DNS suivants :

#### Option A : Utiliser un sous-domaine (www) - RECOMMANDÉ
Si vous voulez que votre site soit accessible via `www.audricvernet.dev` :

**Enregistrements DNS à ajouter :**
- **Type :** `CNAME`
- **Nom :** `www`
- **Valeur :** `atarax-dev.github.io`
- **TTL :** 3600 (ou valeur par défaut)

#### Option B : Utiliser le domaine racine (apex)
Si vous voulez que votre site soit accessible directement via `audricvernet.dev` (sans www) :

**Enregistrements DNS à ajouter :**
- **Type :** `A`
- **Nom :** `@` (ou laissez vide selon votre interface)
- **Valeur :** Une des adresses IP GitHub Pages :
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- **TTL :** 3600 (ou valeur par défaut)

**Important :** Ajoutez les 4 enregistrements A avec les 4 adresses IP ci-dessus pour une meilleure redondance.

#### Option C : Les deux (recommandé pour le SEO)
Configurez à la fois le domaine racine (A) et le sous-domaine www (CNAME) pour que les deux fonctionnent.

### 2. Configurer le domaine dans GitHub

1. Allez sur GitHub.com et connectez-vous
2. Naviguez vers votre dépôt : `atarax-dev/atarax-dev.github.io`
3. Cliquez sur **Settings** (Paramètres)
4. Dans le menu de gauche, cliquez sur **Pages**
5. Dans la section **Custom domain**, entrez votre domaine :
   - Si vous avez configuré www : `www.audricvernet.dev`
   - Si vous avez configuré le domaine racine : `audricvernet.dev`
   - Si vous avez configuré les deux : entrez `audricvernet.dev` (GitHub gérera automatiquement www)
6. Cochez **Enforce HTTPS** (recommandé pour la sécurité)
7. Cliquez sur **Save**

### 3. Vérifier la configuration

Après avoir configuré les DNS et GitHub :

1. **Attendez la propagation DNS** (peut prendre de quelques minutes à 48 heures, généralement moins d'une heure)
2. Vérifiez que votre site est accessible via votre domaine personnalisé
3. Vérifiez que le certificat SSL/HTTPS est actif (cela peut prendre quelques heures après la configuration)

### 4. Tester la configuration

Utilisez ces outils en ligne pour vérifier :
- **DNS Checker :** https://dnschecker.org/
- **SSL Checker :** https://www.sslshopper.com/ssl-checker.html
- **GitHub Pages Status :** Vérifiez dans les paramètres GitHub Pages que le domaine est vérifié

## 🔍 Dépannage

### Le site ne s'affiche pas
- Vérifiez que les enregistrements DNS sont correctement configurés
- Attendez la propagation DNS (jusqu'à 48h)
- Vérifiez que le fichier `CNAME` est bien présent dans votre dépôt à la racine

### Erreur SSL/HTTPS
- GitHub génère automatiquement un certificat SSL, mais cela peut prendre quelques heures
- Assurez-vous que "Enforce HTTPS" est coché dans les paramètres GitHub Pages
- Si après 24h le certificat n'est toujours pas actif, décochez puis recochez "Enforce HTTPS"

### Redirection www vs non-www
- GitHub redirige automatiquement vers le domaine configuré dans CNAME
- Si vous voulez forcer une redirection spécifique, vous pouvez utiliser un fichier `.htaccess` ou configurer des redirections au niveau DNS

## 📝 Notes importantes

- Le fichier `CNAME` doit être à la racine de votre dépôt
- Ne mettez PAS de `http://` ou `https://` dans le fichier CNAME, juste le nom de domaine
- Ne mettez PAS de `/` à la fin du nom de domaine dans CNAME
- Après avoir configuré le domaine personnalisé, GitHub Pages peut prendre quelques minutes à quelques heures pour générer le certificat SSL

## 🔗 Ressources utiles

- [Documentation GitHub Pages - Domaines personnalisés](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Vérification DNS](https://dnschecker.org/)
- [Test de vitesse de site](https://pagespeed.web.dev/)

