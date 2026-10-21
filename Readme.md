# Etulib

Plateforme de soutien scolaire : des parents et des élèves trouvent un professeur, réservent des cours et suivent leurs progrès. Projet industriel (EMSE).

> **État : prototype en cours de développement.** L'authentification, l'espace tuteur (cours, parcours, présentation, disponibilités) et le chargement de la fiche publique d'un tuteur fonctionnent. Les pages de recherche, parent et élève sont encore statiques (données d'exemple).

## Technologies

- **Serveur** : Node.js, Express
- **Base de données** : PostgreSQL, via Prisma (6.x)
- **Authentification** : sessions côté serveur (`express-session`), mots de passe hachés avec `bcryptjs`
- **Sécurité** : `helmet`, `express-rate-limit`
- **Front** : HTML, CSS et JavaScript sans framework, carte avec Leaflet / OpenStreetMap

## Structure

```
index.html            page d'accueil
styles.css            feuille de style commune
HTML/                 les autres pages (login, signup, research, tutor, tutor_profil, ...)
JS/                   scripts des pages (header.js, tutor_profil.js, tutor.js, login.js, signup.js, ...)
server/
  server.js           point d'entrée Express
  routes/             auth.js, tutor.js, public.js
  middleware/         requireAuth.js
  lib/prisma.js       client Prisma
  prisma/             schema.prisma et migrations
```

## Installation

Prérequis : Node.js et une base PostgreSQL (par exemple un conteneur Docker `postgres:16-alpine` exposé sur le port 5433).

```bash
cd server
npm install
```

Crée un fichier `server/.env` (jamais commité) :

```
DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5433/etulib"
SESSION_SECRET=une_longue_chaine_aleatoire
PORT=2000
```

Pour générer le secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Puis crée les tables et lance le serveur :

```bash
npx prisma migrate dev
npx prisma generate
npm start
```

Le site est alors disponible sur http://localhost:2000.

## Base de données

Modèles principaux (`server/prisma/schema.prisma`) :

- `User` : e-mail, mot de passe haché, prénom, nom, rôle (`STUDENT`, `PARENT`, `TUTOR`), dates de création et de mise à jour
- `TutorProfile` : profil du tuteur (lié à un `User`), présentation (`bio`)
- `Course` : cours proposé par un tuteur (intitulé, matière, niveau, description, tarif horaire, durée en minutes, mode `EN_LIGNE` / `DOMICILE` / `TOUS`)
- `Experience` : étape du parcours d'un tuteur (intitulé, lieu, année de début, année de fin facultative)
- `Availibility` : disponibilités hebdomadaires d'un tuteur (jour de 0 à 6, minutes de début et de fin depuis minuit)
- `Lesson` : réservation d'un cours (élève, tuteur, date, mode, avis)

## API

Toutes les routes `/api/tutor` demandent d'être connecté en tant que tuteur. Elles agissent toujours sur le tuteur de la session et vérifient que l'élément visé lui appartient.

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Crée un compte et ouvre la session (crée aussi le profil tuteur pour un tuteur) |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Infos de l'utilisateur connecté |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/tutor/courses` | Cours du tuteur connecté |
| POST | `/api/tutor/add-course` | Ajoute un cours |
| PATCH | `/api/tutor/update-course/:id` | Modifie un cours |
| DELETE | `/api/tutor/delete-course/:id` | Supprime un cours |
| GET | `/api/tutor/experiences` | Parcours du tuteur, du plus récent au plus ancien |
| POST | `/api/tutor/add-experience` | Ajoute une étape du parcours |
| PATCH | `/api/tutor/update-experience/:id` | Modifie une étape |
| DELETE | `/api/tutor/delete-experience/:id` | Supprime une étape |
| GET | `/api/tutor/get-bio` | Présentation du tuteur |
| POST | `/api/tutor/save-bio` | Enregistre la présentation |
| GET | `/api/tutor/get-availibility` | Disponibilités du tuteur |
| POST | `/api/tutor/save-availibility` | Remplace les disponibilités du tuteur |
| GET | `/api/public/tutor?id=` | Fiche publique d'un tuteur (route ouverte à tous : seules les données publiques sont renvoyées) |

Les routes `auth` sont limitées en nombre de tentatives. Les pages `student_profil`, `parent_profil` et `tutor_profil` sont réservées à leur rôle (`server.js`).

## Pages

| Page | État |
|---|---|
| Accueil | statique |
| Connexion et inscription | fonctionnelles (sessions, messages d'erreur, œil pour le mot de passe) |
| Espace tuteur (`tutor_profil`) | cours, parcours et présentation : affichage, ajout, modification, suppression avec confirmation. Disponibilités : planning à sélection par glisser-déposer, enregistré et rechargé. Menu latéral qui suit le défilement, messages de confirmation. Les statistiques et les demandes de réservation sont statiques |
| Fiche publique d'un tuteur (`tutor?id=`) | chargement depuis la base, page « professeur introuvable » si l'identifiant est inconnu. L'affichage complet (cours cliquables, créneaux calculés à partir des disponibilités) est en cours |
| Recherche (`research`) | statique : filtres, résultats et carte de Saint-Étienne avec aperçu et carte plein écran |
| Espaces parent et élève | statiques |

L'en-tête (`header.js`) remplace « Se connecter » et « Créer un compte » par « Mon espace » et « Se déconnecter » quand l'utilisateur est connecté.

## À faire

- Valider la fenêtre « Complétez votre profil » (envoi au serveur)
- Finir la fiche publique : cours cliquables, créneaux selon les disponibilités, retrait des créneaux déjà réservés
- Brancher la recherche et la carte sur la base (professeurs, prix, positions)
- Réservations (`Lesson`), demandes à accepter ou refuser
- Pages parent et élève dynamiques (enfants, comptes rendus, factures)
- Vérification des tuteurs (diplômes, identité) avant publication de leur fiche
- Modification des informations du compte
- Mise en ligne : HTTPS, sessions stockées en base