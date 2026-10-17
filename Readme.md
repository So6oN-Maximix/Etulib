# Etulib

Plateforme de soutien scolaire : des parents et des élèves trouvent un professeur, réservent des cours et suivent leurs progrès. Projet industriel (EMSE).

> **État : prototype en cours de développement.** L'authentification et la gestion des cours d'un tuteur fonctionnent. Le reste des pages est en grande partie statique (données d'exemple).

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
HTML/                 les autres pages (login, signup, research, tutor_profil, ...)
JS/                   scripts des pages (header.js, tutor_profil.js, login.js, signup.js, ...)
server/
  server.js           point d'entrée Express
  routes/             auth.js, tutor.js
  middleware/         requireAuth.js
  lib/prisma.js       client Prisma
  prisma/             schema.prisma et migrations
```

## Installation

Prérequis : Node.js et une base PostgreSQL.

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
node server.js
```

Le site est alors disponible sur http://localhost:2000.

## Base de données

Modèles principaux (`server/prisma/schema.prisma`) :

- `User` : e-mail, mot de passe haché, prénom, nom, rôle (`STUDENT`, `PARENT`, `TUTOR`)
- `TutorProfile` : profil du tuteur (lié à un `User`), présentation, cours
- `Course` : cours proposé par un tuteur (intitulé, matière, niveau, description, tarif, durée, mode)
- `Lesson` : réservation d'un cours (élève, tuteur, date, mode, avis)

## API

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | tous | Crée un compte et ouvre la session |
| POST | `/api/auth/login` | tous | Connexion |
| GET | `/api/auth/me` | connecté | Infos de l'utilisateur connecté |
| POST | `/api/auth/logout` | tous | Déconnexion |
| GET | `/api/tutor/courses` | tuteur | Liste des cours du tuteur connecté |
| POST | `/api/tutor/add-course` | tuteur | Ajoute un cours |
| PATCH | `/api/tutor/update-course/:id` | tuteur | Modifie un cours |
| DELETE | `/api/tutor/delete-course/:id` | tuteur | Supprime un cours |

L'identité de l'utilisateur vient toujours de la session (`req.session.user`), jamais de la requête. Les routes tuteur vérifient aussi que le cours appartient bien au tuteur connecté.

## Pages

| Page | État |
|---|---|
| Accueil | statique |
| Connexion et inscription | fonctionnelles (sessions, messages d'erreur, œil pour le mot de passe) |
| Espace tuteur (`tutor_profil`) | cours : liste, ajout, modification, suppression avec confirmation. Planning de disponibilités : sélection par glisser-déposer (non enregistrée). Le reste est statique |
| Recherche (`research`) | statique : filtres, résultats et carte de Saint-Étienne avec aperçu et carte plein écran |
| Fiche publique d'un tuteur | statique |
| Espace parent / élève | statique |

L'en-tête (`header.js`) remplace « Se connecter » par « Mon espace » et « Se déconnecter » quand l'utilisateur est connecté.

## À faire

- Enregistrer les disponibilités du tuteur
- Valider la fenêtre « Complétez votre profil » (envoi au serveur)
- Brancher la recherche et la carte sur la base (professeurs, prix, positions)
- Réservations (`Lesson`), demandes à accepter ou refuser
- Pages parent et élève dynamiques (enfants, comptes rendus, factures)
- Vérification des tuteurs (diplômes, identité) avant publication de leur fiche
- Modification des informations du compte