# Guide de déploiement rapide - PARK-PRO

## ⚡ Déploiement en moins de 15 minutes

Vous avez déjà :
- ✅ Compte Neon configuré
- ✅ Base de données Neon "park-pro" prête avec toutes les tables
- ✅ Code sur GitHub
- ✅ Backend configuré pour Neon PostgreSQL

---

## Étape 1 : Déployer le Backend sur Vercel (5 minutes)

### 1.1 Créer un compte Vercel
- Allez sur https://vercel.com
- Cliquez sur "Sign Up"
- Connectez-vous avec votre compte GitHub

### 1.2 Importer le projet
1. Cliquez sur "Add New Project"
2. Sélectionnez votre repo GitHub "Spencer99-ops/PARK-PRO"
3. Configurez le projet :

**Project Name :** `park-pro-backend`

**Framework Preset :** Python

**Root Directory :** `./` (laissez vide ou la racine)

### 1.3 Variables d'environnement
Dans la section "Environment Variables", ajoutez :

```
DATABASE_URL = postgresql://neondb_owner:npg_hsUrg51zJtOY@ep-gentle-sea-b83v6fbw-pooler.c-14.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

💡 Vous pouvez trouver cette URL dans votre dashboard Neon ou dans `.env.local`

### 1.4 Cliquez sur "Deploy"
- Vercel va construire et déployer votre backend
- Attendez ~2-3 minutes
- Vous aurez une URL comme : `https://park-pro-backend.vercel.app`

---

## Étape 2 : Déployer le Frontend sur Netlify (5 minutes)

### 2.1 Préparer le frontend
Le frontend utilise déjà une variable d'environnement, donc pas besoin de modifier le code.

### 2.2 Créer un compte Netlify
- Allez sur https://netlify.com
- Cliquez sur "Sign up"
- Connectez-vous avec GitHub

### 2.3 Déployer le site
1. Cliquez sur "Add new site" → "Import an existing project"
2. Sélectionnez votre repo GitHub "Spencer99-ops/PARK-PRO"
3. Configurez :

**Build command :**
```
cd frontend && npm install && npm run build
```

**Publish directory :**
```
frontend/dist
```

**Environment variables :**
Ajoutez dans "Site settings" → "Environment variables" :
```
VITE_API_URL = https://park-pro-backend.vercel.app/api
```

4. Cliquez sur "Deploy site"
5. Attendez ~2-3 minutes
6. Vous aurez une URL comme : `https://park-pro.netlify.app`

---

## Étape 3 : Tester (2 minutes)

### 3.1 Tester le backend
Ouvrez dans votre navigateur :
```
https://park-pro-backend.vercel.app/api/connexion
```

Vous devriez voir une réponse JSON (probablement une erreur 400 car pas de POST, mais ça prouve que le backend fonctionne)

### 3.2 Tester le frontend
Ouvrez l'URL Netlify et connectez-vous avec :
- **Admin :** admin@parking.com / admin123
- **Agent :** agent@parking.com / agent123
- **Client :** client@parking.com / client123

---

## ✅ Vérification finale

Votre architecture maintenant :
```
🌐 Frontend React → Netlify (gratuit)
   ↓ API calls
🔧 Backend Flask → Vercel (gratuit)
   ↓
🗄️ PostgreSQL → Neon (gratuit)
```

---

## 🔧 Problèmes courants

### Problème : CORS errors
Si vous avez des erreurs CORS dans le frontend, vérifiez que `app.py` a bien :
```python
CORS(app)
```

### Problème : Backend ne démarre pas
Vérifiez les logs Vercel :
1. Allez sur votre dashboard Vercel
2. Cliquez sur "park-pro-backend"
3. Onglet "Logs"

### Problème : Base de données non connectée
Vérifiez que `DATABASE_URL` est correctement configurée dans Vercel
