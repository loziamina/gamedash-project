# Documentation Produit / UX et Deploiement Azure GameDash

Refonte **mobile first** du frontend React, industrialisation de la configuration multi-environnement, et **mise en production complete** sur Microsoft Azure (infra + CI/CD + debugging prod).

## 1. UX mobile first (frontend)

### 1.1 Architecture UI

La navigation joueur a ete refondue autour de 3 composants dedies :

- `MobileNav.jsx` : barre inferieure fixe avec detection d'onglet actif sur plusieurs routes (`/dashboard`, `/history`, `/elo`, `/maps`, `/my-maps`, `/store`, `/checkout`, etc.)
- `AppLayout.jsx` : shell global (header sticky, zone contenu, footer nav) avec chargement utilisateur via `getMe()`
- `ProtectedLayout.jsx` : wrapper des routes authentifiees

Cette architecture est integree dans le routeur (`App.jsx`) pour unifier toutes les pages joueur sous le meme layout responsive.

Le header a aussi ete adapte aux ecrans etroits avec un affichage compact, le composant `UserMenu`, le logo GameDash et un fond glassmorphism (`backdrop-blur`).

### 1.2 Pages adaptees mobile

- `Dashboard.jsx` : cartes stats, graphiques Recharts et actions rapides reorganises en colonne sur mobile
- `Matchmaking.jsx` : files ranked / unranked / fun, etat queue et WebSocket temps reel
- `Maps.jsx` / `MyMaps.jsx` : grilles de cartes UGC lisibles au pouce
- `Store.jsx` / `Profile.jsx` / `History.jsx` / `EloGraph.jsx` : espacements, typographie et scroll vertical optimises
- `Game.jsx` : connexion WebSocket in-game depuis l'URL API de production (`wss://`)

### 1.3 Principes UX retenus

- **mobile first** : conception depuis 320px, puis breakpoints Tailwind `sm` / `lg`
- navigation principale accessible au pouce avec une barre basse et des zones tactiles genereuses
- pas d'application native : strategie **PWA-ready** via web responsive uniquement
- coherence visuelle avec le design system existant (Tailwind, Framer Motion, palette cyan/slate)

## 2. Centralisation de la configuration API (frontend)

Avant le deploiement, l'API etait hardcodee en `localhost:8000` dans chaque service. La configuration a ete centralisee pour rendre le frontend compatible avec les environnements local, CI et production Azure.

### 2.1 Point unique : `frontend/src/config.js`

- `API_URL` via `VITE_API_URL` avec fallback dev vers `127.0.0.1:8000`
- `getWebSocketUrl()` : conversion automatique `http -> ws` / `https -> wss` pour matchmaking et parties live
- utilitaires de diagnostic : `logAppConfig`, `fetchWithLog`, `logError`

### 2.2 Services migres

Les services frontend suivants utilisent la configuration centralisee :

- `api.js`
- `dashboard.js`
- `matchmaking.js`
- `match.js`
- `game.js`
- `maps.js`
- `elo.js`
- `shop.js`
- `admin.js`

### 2.3 Pages migrees

- `Login.jsx`
- `Register.jsx`
- `Dashboard.jsx`
- `Matchmaking.jsx`
- `Game.jsx`

### 2.4 Diagnostic et environnement

- boot log au demarrage dans `main.jsx` pour tracer la configuration en production
- fichier `frontend/.env.example` documentant la variable `VITE_API_URL`

## 3. Deploiement Microsoft Azure

### 3.1 Contexte et contraintes

- abonnement **Azure for Students** avec une politique de regions limitant le deploiement a `italynorth`, `polandcentral`, `germanywestcentral`, `swedencentral`, `uaenorth`
- deploiement retenu : deux App Services Linux dans le meme plan partage `ASP-rggamedash-aac0`, groupe de ressources `rg-gamedash`, region **Italy North**

### 3.2 Infrastructure provisionnee

| Ressource | Nom | Role |
|-----------|-----|------|
| PostgreSQL Flexible Server | `gamedash.postgres.database.azure.com` | Base de donnees production |
| App Service (Linux) | `gamedash-api-anas` | API FastAPI Python 3.11 |
| App Service (Linux) | `gamedash-web-anas` | Frontend React (build Vite) |
| Application Insights | lie aux deux App Services | Traces et metriques Azure |

### 3.3 Backend API (`gamedash-api-anas`)

- runtime Python 3.11 sur App Service Linux
- commande de demarrage : `gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000`
- ajout de `gunicorn==23.0.0` dans `backend/requirements.txt` pour servir FastAPI + WebSockets en production
- variables d'environnement : `DATABASE_URL`, `FRONTEND_URL`, `BACKEND_URL`, secrets JWT / OAuth / SMTP
- firewall PostgreSQL configure pour autoriser les IP Azure App Service

### 3.4 Frontend web (`gamedash-web-anas`)

- runtime **Node.js 22 LTS**
- build Vite en CI avec `VITE_API_URL` injecte au moment du `npm run build`
- script de demarrage dedie `frontend/scripts/start-azure.mjs` :
  - lecture du port Azure (`PORT` / `WEBSITES_PORT`, defaut 8080)
  - verification de `dist/index.html` avant lancement
  - logs de diagnostic (version Node, presence de `dist`, `serve`)
  - serving SPA via `serve -s dist` avec fallback routing React Router
- dependance `serve` ajoutee dans `package.json`, script `"start": "node scripts/start-azure.mjs"`
- App Settings Azure : `WEBSITES_PORT=8080`, `VITE_API_URL`, `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, **Always On** active (plan B1)

### 3.5 Authentification de deploiement (OIDC)

- Publish Profile desactive (Basic Auth off), puis bascule vers **OpenID Connect** GitHub / Azure
- creation d'une identite federee Azure AD par App Service
- secrets GitHub Actions generes automatiquement par Azure avec suffixes UUID :
  - frontend : `AZUREAPPSERVICE_CLIENTID_0CFADCCAE69C4661AD3D59ACFEF5BFB6`, etc.
  - backend : secrets dedies `gamedash-api-anas`
- permissions workflow : `id-token: write` pour le job deploy

## 4. CI/CD GitHub Actions

### 4.1 Backend - `.github/workflows/main_gamedash-api-anas.yml`

- declenchement : push `main` + `workflow_dispatch`
- job `build` : checkout, venv Python 3.11, `pip install -r backend/requirements.txt`, upload artifact
- job `deploy` : `azure/login@v2` (OIDC) + `azure/webapps-deploy@v3` vers `gamedash-api-anas`

### 4.2 Frontend - `.github/workflows/main_gamedash-web-anas.yml`

- declenchement : push `main` sur `frontend/**` ou le workflow + `workflow_dispatch`
- job `build` : Node 22, cache npm, `npm ci` + `npm run build` avec `VITE_API_URL` pointant vers l'API Azure
- upload artifact du dossier `frontend/` complet (`dist` + scripts + `package.json`)
- job `deploy` : login OIDC + deploiement ZIP vers `gamedash-web-anas`

Repository de deploiement : [AnasMahhou10/gamedash-project](https://github.com/AnasMahhou10/gamedash-project), fork dedie au deploiement Azure synchronise avec le repo equipe `loziamina/gamedash-project`.

## 5. Incidents resolus en production

| Probleme | Cause | Resolution |
|----------|-------|------------|
| Frontend appelle `127.0.0.1:8000` en prod | `VITE_API_URL` absent au build | Injection en CI + App Setting Azure + refacto `config.js` |
| Erreur 503 Application Error (frontend) | `serve` / port / Always Off | Script `start-azure.mjs`, `WEBSITES_PORT=8080`, Always On |
| Echec login OIDC GitHub Actions | Mauvais noms de secrets | Alignement exact des suffixes `AZUREAPPSERVICE_*` depuis GitHub |
| ZIP Deploy frontend trop lourd | `node_modules` inclus | Artifact build CI + `npm ci` cote runner, pas en prod |
| WebSocket matchmaking en prod | URL `ws://localhost` | `getWebSocketUrl()` avec bascule `wss://` automatique |

## 6. URLs de production

- **Frontend** : `https://gamedash-web-anas-f0gkfwgrcmdyf6at.italynorth-01.azurewebsites.net`
- **Backend API** : `https://gamedash-api-anas-dmh6dafyeaemfjhj.italynorth-01.azurewebsites.net`
- **Swagger / OpenAPI** : `/docs` sur l'URL backend
- **WebSockets** : `wss://gamedash-api-anas-.../ws/...` (matchmaking, parties live)

## 7. Documents lies

- [documentation-technique.md](https://github.com/loziamina/gamedash-project/blob/main/docs/documentation-technique.md)
- [guide-utilisateur.md](https://github.com/loziamina/gamedash-project/blob/main/docs/guide-utilisateur.md)
- [plan-securite-conformite.md](https://github.com/loziamina/gamedash-project/blob/main/docs/plan-securite-conformite.md)
