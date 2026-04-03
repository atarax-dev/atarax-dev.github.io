# Configuration du nom de domaine personnalisé pour GitHub Pages

Ce guide vous explique comment connecter votre nom de domaine `audricvernet.dev` à votre site GitHub Pages.

## ✅ Étapes déjà effectuées

1. ✅ Fichier `CNAME` créé avec `audricvernet.dev`
2. ✅ URLs mises à jour dans `index.html` (canonical, Open Graph, Twitter Card, JSON-LD)
3. ✅ URLs mises à jour dans `sitemap.xml`
4. ✅ URLs mises à jour dans `robots.txt`

## 🔧 Étapes à effectuer

### 1. Configurer les enregistrements DNS

**📋 Résumé rapide de votre configuration actuelle :**
- ✅ Vous avez déjà des enregistrements A pour `audricvernet.dev.` et `www.audricvernet.dev.`
- ⚠️ Ces enregistrements pointent actuellement vers `213.186.33.5` (qui n'est pas GitHub Pages)
- ✅ Vous avez déjà un CNAME pour `ftp.audricvernet.dev.` pointant vers `atarax-dev.github.io.` (c'est bon !)

**🎯 Actions à effectuer :**

**⚠️ IMPORTANT :** Vous avez actuellement des enregistrements A qui pointent vers `213.186.33.5`. Il faut les modifier pour pointer vers GitHub Pages.

Connectez-vous à votre registraire de domaine et modifiez les enregistrements suivants :

#### Modifications à effectuer :

**1. Modifier l'enregistrement A pour `audricvernet.dev.` :**
   - **Type :** `A` (garder le type A)
   - **Domaine :** `audricvernet.dev.`
   - **Cible :** Remplacez `213.186.33.5` par une des adresses IP GitHub Pages :
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **TTL :** 3600 (ou valeur par défaut)

   **💡 Astuce :** Créez 4 enregistrements A séparés avec les 4 adresses IP différentes pour une meilleure redondance.

**2. Modifier l'enregistrement A pour `www.audricvernet.dev.` :**
   - **Option recommandée :** Supprimez l'enregistrement A et créez un **CNAME** à la place :
     - **Type :** `CNAME` (changez de A vers CNAME)
     - **Domaine :** `www.audricvernet.dev.`
     - **Cible :** `atarax-dev.github.io.` (notez le point à la fin)
     - **TTL :** 3600 (ou valeur par défaut)
   
   - **Alternative :** Si vous ne pouvez pas utiliser CNAME, modifiez l'enregistrement A existant pour pointer vers les IPs GitHub Pages (comme pour le domaine racine).

**3. Conserver les autres enregistrements :**
   - Les enregistrements NS (Name Servers) : **ne pas modifier**
   - L'enregistrement CNAME pour `ftp.audricvernet.dev.` : **peut rester tel quel**
   - Les enregistrements SPF et TXT : **peuvent rester** (sauf si vous voulez les modifier)

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

## 🚨 Diagnostic rapide SSL

**Si vous avez un problème SSL, suivez ces étapes dans l'ordre :**

1. **Vérifiez votre DNS** : https://dnschecker.org/#A/audricvernet.dev
   - Les 4 IPs GitHub Pages doivent apparaître : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Si vous voyez encore `213.186.33.5`, attendez la propagation DNS

2. **Vérifiez votre certificat SSL** : https://www.sslshopper.com/ssl-checker.html#hostname=audricvernet.dev
   - Si "Certificate not found" : Le certificat est en cours de génération (attendez 1-24h)
   - Si "Certificate found" mais erreur : Vérifiez la configuration GitHub

3. **Vérifiez GitHub Pages Settings** : https://github.com/atarax-dev/atarax-dev.github.io/settings/pages
   - Le domaine `audricvernet.dev` doit être dans "Custom domain"
   - Le statut doit être "Verified" (ou en attente de vérification)
   - "Enforce HTTPS" peut être grisé si le certificat n'est pas encore généré

4. **Vérifiez le fichier CNAME** : https://github.com/atarax-dev/atarax-dev.github.io/blob/main/CNAME
   - Doit contenir exactement : `audricvernet.dev` (sans http://, https://, ou /)

## 🔍 Dépannage

### Le site ne s'affiche pas
- Vérifiez que les enregistrements DNS sont correctement configurés
- Attendez la propagation DNS (jusqu'à 48h)
- Vérifiez que le fichier `CNAME` est bien présent dans votre dépôt à la racine

### 🔒 Erreur SSL/HTTPS - Guide de dépannage complet

**Problème :** Le certificat SSL ne fonctionne pas ou n'est pas généré.

#### ✅ Checklist de vérification (dans l'ordre) :

**1. Vérifier la configuration DNS :**
   - ✅ Les enregistrements A pointent vers les IPs GitHub Pages (pas vers `213.186.33.5`)
   - ✅ Le CNAME pour `www` pointe vers `atarax-dev.github.io.` (avec le point à la fin)
   - ✅ Utilisez https://dnschecker.org/ pour vérifier la propagation DNS mondiale
   - ⏱️ Attendez que la propagation DNS soit complète (peut prendre jusqu'à 48h, généralement 1-2h)

**2. Vérifier la configuration GitHub Pages :**
   - Allez sur : https://github.com/atarax-dev/atarax-dev.github.io/settings/pages
   - ✅ Le domaine personnalisé est configuré (doit apparaître dans "Custom domain")
   - ✅ Le statut doit indiquer "Verified" (vérifié) - si c'est "Unverified", attendez ou réessayez
   - ✅ "Enforce HTTPS" doit être coché
   - ⚠️ Si "Enforce HTTPS" est grisé/désactivé, c'est normal : il s'activera automatiquement une fois le certificat généré

**3. Vérifier le fichier CNAME :**
   - ✅ Le fichier `CNAME` doit être à la racine du dépôt
   - ✅ Le contenu doit être exactement : `audricvernet.dev` (sans http://, https://, ou / à la fin)
   - ✅ Pas de ligne vide supplémentaire
   - ✅ Pas d'espaces avant ou après

**4. Forcer la régénération du certificat SSL :**
   Si après 24h le certificat n'est toujours pas actif :
   
   **Méthode 1 - Réinitialiser le domaine :**
   1. Dans GitHub Pages Settings, supprimez le domaine personnalisé (bouton "Remove")
   2. Attendez 5 minutes
   3. Réajoutez le domaine : `audricvernet.dev`
   4. Sauvegardez
   5. Attendez 1-2 heures pour la génération du certificat
   
   **Méthode 2 - Toggle HTTPS :**
   1. Si "Enforce HTTPS" est disponible, décochez-le
   2. Sauvegardez
   3. Attendez 5 minutes
   4. Recochez "Enforce HTTPS"
   5. Sauvegardez
   6. Attendez 1-2 heures

**5. Vérifier les erreurs courantes :**
   - ❌ **Erreur "Certificate not found"** : Le certificat est en cours de génération, attendez 1-24h
   - ❌ **Erreur "DNS not configured correctly"** : Vérifiez que les DNS pointent bien vers GitHub Pages
   - ❌ **Erreur "Domain not verified"** : Le domaine n'est pas encore vérifié par GitHub, attendez ou réessayez
   - ❌ **Erreur "Mixed content"** : Vérifiez que toutes les URLs dans votre HTML utilisent HTTPS

**6. Tester le certificat SSL :**
   - Utilisez : https://www.sslshopper.com/ssl-checker.html#hostname=audricvernet.dev
   - Le certificat doit être émis par "Let's Encrypt" ou "DigiCert"
   - La validité doit être d'au moins 30 jours

**7. Délais normaux :**
   - ⏱️ Propagation DNS : 1-48 heures (généralement 1-2h)
   - ⏱️ Génération certificat SSL : 1-24 heures (généralement 1-4h)
   - ⏱️ Activation HTTPS : Immédiat après génération du certificat

**8. Si le problème persiste après 48h :**
   - Vérifiez qu'il n'y a pas de conflit avec d'autres services (CDN, proxy, etc.)
   - Vérifiez que vous n'utilisez pas de sous-domaine qui entre en conflit
   - Contactez le support GitHub si nécessaire

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

