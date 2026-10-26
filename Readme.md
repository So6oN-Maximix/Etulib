# Etulib

Plateforme de soutien scolaire : des parents et des élèves trouvent un professeur, réservent des cours et suivent leurs progrès. Projet industriel (EMSE).

> **État : prototype en cours de développement.** L'authentification, l'espace tuteur (cours, parcours, présentation, disponibilités), les espaces parent et élève (informations personnelles, comptes enfants) et le chargement de la fiche publique d'un tuteur fonctionnent. Les pages de recherche et de réservation sont encore statiques (données d'exemple).

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
HTML/                 les autres pages (login, signup, research, tutor, tutor_not_found,
                      tutor_profil, parent_profil, student_profil, ...)
JS/                   scripts des pages (header.js, tutor_profil.js, parent_profil.js,
                      student_profil.js, tutor.js, login.js, signup.js, ...)
server/
  server.js           point d'entrée Express
  routes/             auth.js, tutor.js, public.js, parent.js, student.js
  middleware/         requireAuth.js, requireChildren.js
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

- `User` : e-mail, mot de passe haché, prénom, nom, rôle (`STUDENT`, `PARENT`, `TUTOR`), dates de création et de mise à jour. L'e-mail et le mot de passe sont facultatifs pour un compte enfant géré par son parent
- `TutorProfile` : profil du tuteur (lié à un `User`), présentation (`bio`)
- `Course` : cours proposé par un tuteur (intitulé, matière, niveau, description, tarif horaire, durée en minutes, mode `EN_LIGNE` / `DOMICILE` / `TOUS`)
- `Experience` : étape du parcours d'un tuteur (intitulé, lieu, année de début, année de fin facultative)
- `Availibility` : disponibilités hebdomadaires d'un tuteur (jour de 0 à 6, minutes de début et de fin depuis minuit)
- Profils parent et élève : téléphone et ville ; pour l'élève, niveau, date de naissance et parent rattaché
- `Lesson` : réservation d'un cours (élève, tuteur, date, mode, avis)

Les numéros de téléphone sont enregistrés au format international (`+33612345678`) et affichés au format français (`06 12 34 56 78`).

## API

Les routes `/api/tutor` demandent d'être connecté en tant que tuteur, les routes `/api/parent` en tant que parent. Elles agissent toujours sur l'utilisateur de la session et vérifient que l'élément visé lui appartient.

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Crée un compte et ouvre la session (crée aussi le profil du rôle choisi) |
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
| GET | `/api/parent/get-info` | Informations personnelles du parent |
| PATCH | `/api/parent/perso-info` | Enregistre les informations du parent |
| GET | `/api/parent/get-children` | Enfants du parent connecté |
| POST | `/api/parent/add-child` | Crée le compte d'un enfant rattaché au parent |
| GET | `/api/student/get-info` | Informations d'un élève (le sien, ou `?id=` pour le parent d'un enfant) |
| PATCH | `/api/student/perso-info` | Enregistre les informations d'un élève |
| GET | `/api/public/tutor?id=` | Fiche publique d'un tuteur (route ouverte à tous : seules les données publiques sont renvoyées) |

Les routes `auth` sont limitées en nombre de tentatives. Les pages `student_profil`, `parent_profil` et `tutor_profil` sont réservées à leur rôle (`server.js`) ; la page `student_profil` est aussi ouverte aux parents. Le middleware `requireChildren` détermine de quel élève on parle : l'élève connecté, ou l'enfant d'un parent (`?id=`) après vérification du lien de parenté.

## Pages

| Page | État |
|---|---|
| Accueil | statique |
| Connexion et inscription | fonctionnelles (sessions, messages d'erreur, œil pour le mot de passe) |
| Espace tuteur (`tutor_profil`) | cours, parcours et présentation : affichage, ajout, modification, suppression avec confirmation. Disponibilités : planning à sélection par glisser-déposer, enregistré et rechargé. Menu latéral qui suit le défilement, messages de confirmation. Les statistiques et les demandes de réservation sont statiques |
| Espace parent (`parent_profil`) | informations personnelles (affichage et enregistrement), liste des enfants, ajout d'un enfant, lien vers le profil de chaque enfant. Les cours, comptes rendus et paiements sont statiques |
| Espace élève (`student_profil`) | informations personnelles (affichage et enregistrement), consultables par le parent d'un enfant. Le reste est statique |
| Fiche publique d'un tuteur (`tutor?id=`) | chargement depuis la base, page « professeur introuvable » si l'identifiant est inconnu. L'affichage complet (cours cliquables, créneaux calculés à partir des disponibilités) est en cours |
| Recherche (`research`) | statique : filtres, résultats et carte de Saint-Étienne avec aperçu et carte plein écran |

L'en-tête (`header.js`) remplace « Se connecter » et « Créer un compte » par « Mon espace » et « Se déconnecter » quand l'utilisateur est connecté.

## À faire

- Valider la fenêtre « Complétez votre profil » (envoi au serveur)
- Finir la fiche publique : cours cliquables, créneaux selon les disponibilités, retrait des créneaux déjà réservés
- Brancher la recherche et la carte sur la base (professeurs, prix, positions)
- Réservations (`Lesson`), demandes à accepter ou refuser
- Espaces parent et élève : cours à venir, comptes rendus, factures
- Règle de majorité : le parent n'a plus accès au compte d'un enfant devenu majeur
- Connexion d'un enfant avec son propre compte (e-mail et mot de passe), avec ou sans adresse distincte de celle du parent
- Vérification des tuteurs (diplômes, identité) avant publication de leur fiche
- Modification des informations personnelles du tuteur
- Mise en ligne : HTTPS, sessions stockées en base