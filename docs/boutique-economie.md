# Documentation Boutique et Economie GameDash

## 1. Objectif du module

Le module Boutique / Economie de GameDash sert a gerer :

- les monnaies virtuelles du joueur
- la vente d'objets cosmetiques
- la vente de packs de devises
- le pass de saison
- l'inventaire joueur
- l'equipement d'objets
- l'historique des transactions
- les paiements simules Stripe et PayPal
- le pilotage de l'economie depuis l'espace admin

Le systeme a ete concu pour respecter une regle importante du projet :

- aucune donnee metier n'est pre-remplie dans le code
- les donnees de boutique sont creees par l'admin ou via l'API FastAPI

En consequence, une base vide reste vide tant qu'aucun item, pack ou tier de pass n'est cree.

## 2. Vue d'ensemble fonctionnelle

Le module se divise en deux experiences :

- cote admin : configuration et alimentation du catalogue
- cote joueur : consultation, achat, equipement et reclamation des recompenses

### Cote admin

L'administrateur peut :

- definir la configuration generale de l'economie
- creer, modifier et supprimer des objets boutique
- creer, modifier et supprimer des packs
- creer, modifier et supprimer des tiers de season pass
- activer ou desactiver Stripe simule et PayPal simule
- consulter le journal des transactions

### Cote joueur

Le joueur peut :

- consulter ses soldes en soft currency et hard currency
- acheter des objets
- acheter des packs
- passer par un checkout Stripe simule ou PayPal simule
- debloquer le pass premium
- reclamer les recompenses de season pass
- consulter son inventaire
- equiper un objet
- consulter l'historique des transactions

## 3. Monnaies du systeme

Le systeme utilise deux devises principales.

### Soft currency

La soft currency est la monnaie standard du jeu.

Utilisation :

- achat d'objets standards
- recompenses de progression
- recompenses de season pass

Stockage :

- champ `soft_currency` sur l'utilisateur

### Hard currency

La hard currency est la monnaie premium.

Utilisation :

- achat d'objets premium
- achat du pass premium
- credit via achat de packs
- recompenses premium de season pass

Stockage :

- champ `hard_currency` sur l'utilisateur

## 4. Cote admin

La gestion admin se fait principalement dans la page :

- `frontend/src/pages/Admin.jsx`

et par les endpoints :

- `backend/app/routes/admin.py`

### 4.1 Reglages economie et saison

Le formulaire `Reglages economie & saison` permet de piloter les regles globales.

Champs principaux :

- `starter_soft_currency`
- `starter_hard_currency`
- `season_name`
- `premium_pass_price_hard`
- `stripe_enabled`
- `paypal_enabled`

Effet concret :

- les nouveaux comptes recoivent les montants de depart
- le nom de saison est affiche cote joueur
- le prix du pass premium est utilise au moment de l'achat
- les boutons Stripe/PayPal peuvent etre affiches ou bloques cote boutique

Important :

- ces reglages sont techniques et globaux
- ils ne creent pas de contenu boutique a eux seuls

### 4.2 Gestion des objets boutique

Le formulaire `Creer / mettre a jour un objet` sert a definir un article du catalogue.

Champs principaux :

- `sku` : identifiant metier unique de l'objet
- `name` : nom affiche
- `description` : texte affiche dans la boutique
- `category` : categorie libre, par exemple `cosmetic`
- `item_type` : type fonctionnel, par exemple `avatar_frame` ou `title`
- `rarity` : rarete visuelle et metier
- `price_soft`
- `price_hard`
- `asset` : reference logique ou visuelle
- `season_tier_required`
- `is_featured`
- `is_active`

Comportement :

- un objet peut etre achete en soft ou en hard
- si `price_hard > 0`, l'achat se fait en hard currency
- sinon il se fait en soft currency
- un objet achete est ajoute a l'inventaire du joueur

Operations possibles dans l'admin :

- creation
- mise a jour
- chargement dans le formulaire via `Charger`
- remise a zero du formulaire via `Nouveau formulaire`
- suppression via `Supprimer`

### 4.3 Gestion des packs

Le formulaire `Creer / mettre a jour un pack` sert a definir un pack monetise.

Champs principaux :

- `sku`
- `name`
- `description`
- `soft_currency`
- `hard_currency`
- `bonus_percent`
- `price_cents`
- `is_active`
- `is_featured`

Comportement :

- le pack affiche un prix en euros simules
- le bonus augmente les quantites creditees
- le credit n'est applique qu'apres confirmation du checkout simule

Operations possibles :

- creation
- mise a jour
- chargement dans le formulaire
- suppression

### 4.4 Gestion des tiers de season pass

Le formulaire `Creer / mettre a jour un tier` sert a definir les paliers du pass.

Champs principaux :

- `tier`
- `xp_required`
- `free_reward_type`
- `free_reward_amount`
- `free_reward_sku`
- `premium_reward_type`
- `premium_reward_amount`
- `premium_reward_sku`
- `is_active`

Types de recompense supportes :

- `soft_currency`
- `hard_currency`
- `item`

Regle de saisie :

- si le type vaut `item`, on renseigne le `sku` et on laisse le montant a `0`
- si le type vaut `soft_currency` ou `hard_currency`, on renseigne le montant et on laisse le `sku` vide

Important :

- un `sku` de recompense item doit correspondre a un objet boutique existant
- sinon la recompense ne pourra pas etre materialisee proprement dans l'inventaire

### 4.5 Journal des transactions

L'admin dispose d'une vue `Journal des transactions`.

Ce journal agrege deux sources :

- les transactions de monnaie virtuelle
- les transactions de paiement

On y voit notamment :

- achats d'objets
- credits de packs
- debits lies au pass premium
- paiements simules Stripe
- paiements simules PayPal

## 5. Cote joueur

L'experience joueur se fait principalement dans :

- `frontend/src/pages/Store.jsx`
- `frontend/src/pages/CheckoutSim.jsx`

et s'appuie sur :

- `backend/app/routes/shop.py`

### 5.1 Vue boutique

La page boutique affiche :

- les soldes du joueur
- l'equipement actuellement actif
- le season pass
- le catalogue
- les packs
- l'inventaire
- le journal des transactions

### 5.2 Achat d'un objet

Quand le joueur clique sur `Acheter` :

1. le frontend appelle l'endpoint d'achat
2. le backend verifie que l'objet existe et est actif
3. le backend verifie que le joueur ne possede pas deja l'objet
4. le backend verifie que le joueur a assez de monnaie
5. la devise correspondante est debitee
6. une transaction virtuelle est enregistree
7. l'objet est ajoute a l'inventaire

Resultat :

- le wallet est mis a jour
- l'objet devient `owned`
- il peut ensuite etre equipe

### 5.3 Inventaire et equipement

Lorsqu'un objet est acquis, il apparait dans l'inventaire.

Le joueur peut cliquer sur `Equiper`.

Le backend :

- recupere l'entree d'inventaire
- desequipe les autres objets du meme type
- equipe le nouvel objet
- met a jour les champs utilisateur d'equipement

Types actuellement geres :

- `avatar_frame`
- `title`

Stockage sur l'utilisateur :

- `equipped_avatar_frame`
- `equipped_title`

### 5.4 Achat d'un pack

Le joueur ne recoit plus directement les devises au clic sur le bouton.

Le flow actuel est le suivant :

1. clic sur `Stripe simule` ou `PayPal simule`
2. creation d'une session de checkout avec statut `pending`
3. redirection vers une page de checkout interne
4. affichage du pack, du montant et de la reference de paiement
5. clic sur `Confirmer le paiement`
6. seulement a ce moment-la, les devises sont creditees
7. si le joueur annule, rien n'est credite

Ce comportement reproduit le principe d'un vrai fournisseur de paiement tout en restant totalement interne au projet.

### 5.5 Pass de saison

Le joueur voit :

- le nom de la saison
- son tier actuel
- le prix du premium
- la liste des tiers

Deux notions coexistent :

- la piste gratuite
- la piste premium

Quand le joueur achete le premium :

1. le backend verifie que le joueur n'a pas deja le premium
2. le backend verifie que le joueur a assez de hard currency
3. le hard currency est debite
4. une transaction est ecrite
5. le pass passe en `premium_unlocked = true`

### 5.6 Reclamation des rewards de pass

Pour reclamer un tier :

1. le backend verifie que le tier existe
2. le backend verifie que le joueur a atteint le `xp_required`
3. le backend verifie que la recompense n'a pas deja ete recuperee
4. la recompense gratuite est attribuee si elle n'a pas ete reclamee
5. la recompense premium est attribuee si le premium est debloque
6. les tiers reclames sont memorises

Exemples :

- une recompense `soft_currency` credite le wallet
- une recompense `hard_currency` credite le wallet premium
- une recompense `item` ajoute un objet dans l'inventaire

## 6. Paiements simules Stripe et PayPal

Le projet implemente aujourd'hui des paiements simules, pas encore les plateformes reelles.

### Ce que fait le systeme actuel

- creation d'une transaction de paiement
- attribution d'une reference de session
- affichage d'un checkout interne
- confirmation ou annulation manuelle
- changement de statut du paiement
- credit du compte apres confirmation

### Ce que le systeme ne fait pas encore

- ouverture d'un vrai checkout Stripe officiel
- ouverture d'une vraie page PayPal officielle
- verification via webhook externe
- capture reelle de fonds

### Statuts de paiement utilises

- `pending`
- `completed`
- `cancelled`

## 7. Structure technique backend

### 7.1 Modeles principaux

Les modeles utilises par l'economie sont notamment :

- `User`
- `VirtualTransaction`
- `ShopItem`
- `StorePack`
- `InventoryItem`
- `SeasonPass`
- `SeasonPassTier`
- `PaymentTransaction`
- `EconomySettings`

### 7.2 Role de chaque modele

#### `User`

Stocke :

- le wallet soft
- le wallet hard
- les objets equipes

#### `ShopItem`

Decrit un objet achetable dans le catalogue.

#### `StorePack`

Decrit un pack de devises vendable.

#### `InventoryItem`

Represente la possession d'un objet par un joueur.

#### `SeasonPass`

Represente l'etat du pass pour un utilisateur :

- saison en cours
- premium debloque ou non
- tiers deja reclames

#### `SeasonPassTier`

Represente un palier de pass configure par l'admin.

#### `VirtualTransaction`

Journalise les mouvements de monnaies virtuelles.

#### `PaymentTransaction`

Journalise les paiements de packs et leur statut.

#### `EconomySettings`

Stocke les regles globales de l'economie.

## 8. Structure technique frontend

Les principaux fichiers frontend relies a la boutique sont :

- `frontend/src/pages/Store.jsx`
- `frontend/src/pages/CheckoutSim.jsx`
- `frontend/src/pages/Admin.jsx`
- `frontend/src/services/shop.js`
- `frontend/src/services/admin.js`

### `Store.jsx`

Role :

- afficher l'experience joueur boutique
- lancer les achats
- lancer les checkouts simules
- afficher inventaire et transactions

### `CheckoutSim.jsx`

Role :

- afficher un checkout interne de type Stripe ou PayPal
- confirmer ou annuler le paiement

### `Admin.jsx`

Role :

- gerer tout le contenu metier de la boutique
- administrer les regles du module economie

## 9. Endpoints principaux

### Cote joueur

- `GET /shop/overview`
- `POST /shop/items/{sku}/purchase`
- `POST /shop/packs/{sku}/checkout-session`
- `GET /shop/checkout/{external_ref}`
- `POST /shop/checkout/{external_ref}/decision`
- `POST /shop/season-pass/purchase`
- `POST /shop/season-pass/claim/{tier}`
- `POST /shop/inventory/{inventory_id}/equip`
- `GET /shop/transactions`

### Cote admin

- `GET /admin/economy-settings`
- `PUT /admin/economy-settings`
- `GET /admin/store-items`
- `POST /admin/store-items`
- `DELETE /admin/store-items/{sku}`
- `GET /admin/store-packs`
- `POST /admin/store-packs`
- `DELETE /admin/store-packs/{sku}`
- `GET /admin/season-pass-tiers`
- `POST /admin/season-pass-tiers`
- `DELETE /admin/season-pass-tiers/{tier}`
- `GET /admin/economy-transactions`

## 10. Regles metier importantes

Le module applique plusieurs regles metier essentielles.

### Regle 1 : pas de donnees metier en dur

Le code ne doit pas imposer un catalogue ou un pass pre-rempli.

Donc :

- pas de seed automatique d'items
- pas de seed automatique de packs
- pas de seed automatique de tiers

### Regle 2 : un objet ne doit pas etre achete deux fois

Avant achat, le backend verifie si le joueur possede deja l'objet.

### Regle 3 : une recompense de pass ne doit pas etre reclamee deux fois

Les tiers reclames sont memorises et controles.

### Regle 4 : un wallet n'est credite qu'apres validation de paiement

Pour les packs :

- creation de session = aucune monnaie creditee
- confirmation = credit effectif

### Regle 5 : un seul objet equipe par type

Quand un joueur equipe un objet d'un type donne :

- les autres objets du meme type sont desequipes

## 11. Cas de test recommandes

### Admin

- creer un item
- modifier un item charge via `Charger`
- supprimer un item
- creer un pack
- modifier un pack
- supprimer un pack
- creer un tier
- modifier un tier
- supprimer un tier
- desactiver Stripe ou PayPal et verifier que le bouton joueur est bloque

### Joueur

- acheter un objet en soft currency
- acheter un objet en hard currency
- equiper un objet
- acheter un pack via Stripe simule
- acheter un pack via PayPal simule
- annuler un checkout
- acheter le pass premium
- reclamer un tier gratuit
- reclamer un tier premium
- verifier le journal des transactions

### Cas limites

- achat sans solde suffisant
- achat d'objet deja possede
- reclamation d'un tier non debloque
- reclamation d'un tier deja reclame
- tier de pass pointant vers un SKU inexistant

## 12. Limites actuelles

Le module est deja complet pour une simulation produit, mais certaines extensions restent possibles.

Limites actuelles :

- paiements encore simules
- absence de vrai webhook externe
- pas de moteur de promotion ou coupons
- pas de pagination de catalogue
- pas de recherche/filtres avances dans le backoffice boutique
- pas de visual preview graphique des assets

## 13. Evolutions possibles

Pistes naturelles d'evolution :

- integration PayPal sandbox reelle
- integration Stripe Checkout sandbox reelle
- webhooks de confirmation
- historiques plus detailles
- filtres admin
- categories boutique avancees
- bundles d'objets
- cosmetiques saisonniers
- boutique createur / UGC reward store

## 14. Fichiers de reference

### Backend

- `backend/app/routes/shop.py`
- `backend/app/routes/admin.py`
- `backend/app/models/user.py`
- `backend/app/models/economy_settings.py`
- `backend/app/models/shop_item.py`
- `backend/app/models/store_pack.py`
- `backend/app/models/inventory_item.py`
- `backend/app/models/season_pass.py`
- `backend/app/models/season_pass_tier.py`
- `backend/app/models/payment_transaction.py`
- `backend/app/models/virtual_transaction.py`
- `backend/app/utils/economy.py`

### Frontend

- `frontend/src/pages/Store.jsx`
- `frontend/src/pages/CheckoutSim.jsx`
- `frontend/src/pages/Admin.jsx`
- `frontend/src/services/shop.js`
- `frontend/src/services/admin.js`
