# Déploiement Ring Academy sur Netlify

## Étapes de déploiement

### 1. Configuration du site sur Netlify

1. Connectez-vous à [Netlify](https://netlify.com)
2. Cliquez sur "Add new site" > "Import an existing project"
3. Connectez votre dépôt Git (GitHub, GitLab, etc.)
4. Sélectionnez le dépôt de Ring Academy

### 2. Paramètres de build

Netlify devrait détecter automatiquement les paramètres grâce au fichier `netlify.toml`, mais vérifiez :

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18

### 3. Variables d'environnement CRITIQUES

Dans les paramètres de votre site Netlify :
1. Allez dans "Site settings" > "Build & deploy" > "Environment variables"
2. Ajoutez ces variables :

```
OPENAI_API_KEY=votre_clé_openai_ici
VITE_SUPABASE_URL=votre_url_supabase_ici
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase_ici
```

### 4. Déploiement

Une fois les variables configurées, déclenchez un nouveau déploiement.

## Important

- Les variables d'environnement sont OBLIGATOIRES pour le bon fonctionnement
- La clé OpenAI (`OPENAI_API_KEY`) est maintenant sécurisée côté serveur via les fonctions Netlify
- Sans les variables Supabase, l'application ne pourra pas se connecter à la base de données
- Assurez-vous que vos fonctions Edge Supabase sont déployées avant le front-end

## Sécurité

La clé API OpenAI est maintenant protégée :
- Elle n'est plus exposée dans le code frontend
- Elle est stockée de manière sécurisée dans les variables d'environnement des fonctions Netlify
- Les appels à OpenAI passent par des fonctions Netlify qui agissent comme proxy sécurisé

## Support

En cas de problème, vérifiez :
1. Que toutes les variables d'environnement sont correctement configurées
2. Que le build se termine sans erreur
3. Que les fonctions Edge Supabase sont actives