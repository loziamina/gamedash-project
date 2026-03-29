# Plan Securite & Conformite GameDash

## 1. Objectif

Ce document presente les mesures de securite et les principes de conformite appliques dans GameDash dans un cadre pedagogique de projet web.

## 2. Authentification et acces

### Mecanismes utilises

- mot de passe hashé cote backend
- JWT pour l'authentification API
- OAuth Google pour la connexion federée
- tokens de reset password temporaires

### Mesures appliquees

- les mots de passe ne sont pas stockes en clair
- les routes sensibles utilisent `get_current_user`
- les routes admin utilisent un controle de role
- les comptes bannis sont bloques

## 3. Gestion des roles

Le projet gere plusieurs niveaux d'acces :

- `player`
- `admin`
- `staff`

Les actions critiques du backoffice sont reservees aux administrateurs.

## 4. Protection des donnees utilisateur

Les donnees utilisateur gerees incluent :

- email
- pseudo
- avatar
- bio
- region
- langue
- preferences matchmaking

Mesures retenues :

- exposition limitee via les endpoints
- modification reservee au joueur concerne ou a un admin
- suppression de compte disponible

## 5. Reinitialisation du mot de passe

Le projet implemente :

- une demande de reset par email
- un lien de reinitialisation avec token temporaire
- une page de redefintion du mot de passe

Point de vigilance :

- les secrets email et OAuth doivent etre stockes dans `.env`
- ils ne doivent jamais etre commités dans un depot public

## 6. OAuth Google

Le login Google repose sur :

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- une redirect URI declaree dans Google Cloud Console

Bonnes pratiques :

- rotation du secret si fuite
- limitation des comptes de test
- verification des URLs de callback

## 7. Securite applicative

### Risques identifies

- fuite de secrets `.env`
- mauvaises permissions admin
- surcharge de connexions DB
- contenu utilisateur libre sur les maps / commentaires
- stockage de gros fichiers en base via `data URL`

### Reponses mises en place

- fermeture explicite des sessions SQLAlchemy
- controles d'autorisation sur les routes
- moderation maps et signalements
- sanctions utilisateurs
- verification d'etat de compte actif

## 8. Conformite pedagogique

Le projet vise un niveau pedagogique conforme aux attentes d'un M2, avec :

- suppression de compte
- separation des roles
- gestion basique des donnees personnelles
- controle des acces backoffice

## 9. Journalisation

Le projet enregistre certaines actions critiques :

- sanctions utilisateurs via `SanctionLog`
- transactions virtuelles via `VirtualTransaction`

Ameliorations possibles :

- logs d'authentification
- logs de modifications admin
- logs de moderation maps
- logs d'erreurs centralises

## 10. Recommandations pour une version production

- activer HTTPS
- utiliser des secrets rotatifs
- separer les environnements `dev`, `test`, `prod`
- utiliser un stockage fichier externe pour avatars et captures
- ajouter un vrai systeme de migration DB
- ajouter rate limiting et validation avancee
- restreindre CORS a des domaines connus
- renforcer les logs et l'observabilite

## 11. Conclusion

GameDash integre deja plusieurs briques importantes de securite :

- hash de mot de passe
- JWT
- OAuth Google
- reset password
- roles / permissions
- suppression de compte
- moderation et sanctions

Ce projet est un exemple de securite et de conformite applicables dans un cadre pedagogique de projet web.

Merci de votre visite <3.
