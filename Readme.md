# Etulib

Plateforme de soutien scolaire : des parents et des élèves trouvent un professeur, réservent des cours et suivent leurs progrès. Projet industriel (EMSE).

> **État : prototype en cours de développement.** L'authentification, l'espace tuteur (cours, parcours, présentation, disponibilités, informations personnelles, calendrier de la semaine), les espaces parent et élève (informations, comptes enfants, cours à venir, anciens professeurs), la recherche par matière et ville, la fiche publique d'un tuteur, la réservation d'un cours, la page de détails d'un cours et la messagerie fonctionnent. Les statistiques, les demandes de réservation, les comptes rendus et les paiements sont encore statiques (données d'exemple).

## Technologies

- **Serveur** : Node.js, Express
- **Base de données** : PostgreSQL, via Prisma (6.x)
- **Authentification** : sessions côté serveur (`express-session`), mots de passe hachés avec `bcryptjs`
- **Sécurité** : `helmet`, `express-rate-limit`
- **Front** : HTML, CSS et JavaScript sans framework
- **Communes** : API `geo.api.gouv.fr` (autocomplétion des villes, vérification côté serveur)
- **Messagerie** : messages chiffrés en base (AES-256-GCM, module `crypto` de Node)
- **Conteneurs** : `Dockerfile` et `docker-compose.yml` dans `server/`

## Structure

```
index.html            page d'accueil
styles.css            feuille de style commune
HTML/                 les autres pages (login, signup, research, tutor, tutor_not_found,
                      tutor_profil, parent_profil, student_profil, success_reserve,
                      course_details, messages)
JS/                   scripts des pages (header.js, index.js, research.js, find_cities.js,
                      tutor.js, tutor_profil.js, tutor_dispos.js, loadLessonsCaldendar.js,
                      parent_profil.js, student_profil.js, profils.js, course_details.js,
                      messages.js, success_reserve.js, login.js, signup.js)
server/
  server.js           point d'entrée Express
  routes/             auth.js, tutor.js, public.js, parent.js, student.js, lesson.js, message.js
  middleware/         requireAuth.js, requireChildren.js
  lib/                prisma.js (client Prisma), crypto.js (chiffrement des messages)
  prisma/             schema.prisma, ERD.svg, migrations et seed.js
  Dockerfile, docker-compose.yml
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
MESSAGE_KEY_V1=une_cle_hexadecimale_de_64_caracteres
PORT=2000
```

Pour générer le secret de session :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

La clé de chiffrement des messages doit faire 64 caractères hexadécimaux (32 octets). Le serveur refuse de démarrer sans elle :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Puis crée les tables et lance le serveur :

```bash
npx prisma migrate dev
npx prisma generate
npm start
```

Le site est alors disponible sur http://localhost:2000.

Pour remplir la base avec des professeurs d'exemple (Saint-Étienne) :

```bash
npm run seed
```

## Tests & Intégration Continue (CI)

Le projet utilise le runner de test natif de Node.js (`node --test`) et un pipeline **GitHub Actions** (`.github/workflows/ci.yml`) exécuté à chaque `push` ou `pull request`.

Les tests unitaires (`server/tests/crypto.test.js`) vérifient notamment le chiffrement et le déchiffrement des messages (AES-256-GCM) avec validation de l'AAD (*Additional Authenticated Data*).

### Exécuter les tests en local

```bash
cd server
npm test
```

## Base de données

![Schéma de la base de données](server/prisma/ERD.svg)

Modèles principaux (`server/prisma/schema.prisma`) :

- `User` : e-mail, mot de passe haché, prénom, nom, rôle (`STUDENT`, `PARENT`, `TUTOR`), dates de création et de mise à jour. L'e-mail et le mot de passe sont facultatifs pour un compte enfant géré par son parent
- `TutorProfile` : profil du tuteur (lié à un `User`), présentation (`bio`), téléphone et ville (code INSEE)
- `Course` : cours proposé par un tuteur (intitulé, matière, niveau, description, tarif horaire, durée en minutes, mode `EN_LIGNE` / `DOMICILE` / `TOUS`)
- `Experience` : étape du parcours d'un tuteur (intitulé, lieu, année de début, année de fin facultative)
- `Availibility` : disponibilités hebdomadaires d'un tuteur (jour de 0 à 6, minutes de début et de fin depuis minuit)
- `Lesson` : réservation d'un cours (élève, tuteur, cours, date de début, note et avis facultatifs). Un tuteur ne peut pas avoir deux leçons au même créneau (contrainte unique `tutorId` + `startDate`)
- `Address` : adresse d'un élève (rue, complément, code postal, ville, code commune, latitude et longitude facultatives)
- `Conversation` : échange entre un tuteur et un élève (une seule conversation par couple, contrainte unique `tutorId` + `studentId`)
- `Message` : message d'une conversation (expéditeur, contenu chiffré, indicateur de lecture `isRead`, date). Le texte est chiffré avant d'être stocké et déchiffré à la lecture (`server/lib/crypto.js`, clé `MESSAGE_KEY_V1`)
- Profils parent et élève : téléphone et ville ; pour l'élève, niveau, date de naissance, adresse et parent rattaché

Niveaux possibles : `PRIMAIRE`, `COLLEGE`, `LYCEE`, `SUP`.

Les numéros de téléphone sont enregistrés au format international (`+33612345678`) et affichés au format français (`06 12 34 56 78`).

## API

Les routes `/api/tutor` demandent d'être connecté en tuteur, les routes `/api/parent` en parent, `/api/lesson/reserve` en élève ou parent. Elles agissent toujours sur l'utilisateur de la session et vérifient que l'élément visé lui appartient.

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
| GET | `/api/tutor/get-info` | Informations personnelles du tuteur |
| PATCH | `/api/tutor/perso-info` | Enregistre les informations du tuteur |
| GET | `/api/tutor/get-lessons` | Cours à venir du tuteur connecté |
| GET | `/api/parent/get-info` | Informations personnelles du parent |
| PATCH | `/api/parent/perso-info` | Enregistre les informations du parent |
| GET | `/api/parent/get-children` | Enfants du parent connecté |
| POST | `/api/parent/add-child` | Crée le compte d'un enfant rattaché au parent |
| POST | `/api/parent/get-next-lessons` | Cours à venir des enfants (liste d'ids en corps) |
| POST | `/api/parent/get-tutors` | Professeurs ayant déjà donné cours aux enfants |
| GET | `/api/student/get-info` | Informations d'un élève (le sien, ou `?id=` pour le parent d'un enfant) |
| PATCH | `/api/student/perso-info` | Enregistre les informations d'un élève |
| GET | `/api/student/get-tutors` | Professeurs passés de l'élève (ou `?id=` pour le parent) |
| GET | `/api/public/tutor/:id` | Fiche publique d'un tuteur (route ouverte à tous : seules les données publiques sont renvoyées) |
| GET | `/api/public/search-tutor?course=&location=` | Recherche de tuteurs par matière et/ou ville |
| POST | `/api/lesson/reserve` | Réserve un créneau (409 si déjà pris) |
| GET | `/api/lesson/get-next` | Cours à venir d'un élève (ou `?id=` pour le parent) |
| POST | `/api/lesson/get-info` | Détails d'un cours réservé (cours, tuteur, élève, date) |
| GET | `/api/message/get-conversation` | Conversations de l'utilisateur (renvoie l'ID de conversation et le `userId` de l'interlocuteur) |
| GET | `/api/message/get-conv-infos/:id` | Informations de l'interlocuteur (nom, prénom, rôle) |
| POST | `/api/message/get-msg` | Messages d'une conversation (requiert `{ conversationId }`, messages déchiffrés) |
| POST | `/api/message/send` | Envoie un message (chiffré avant enregistrement) |
| POST | `/api/message/mark-as-read` | Marque tous les messages reçus d'une conversation comme lus |
| GET | `/api/message/unread-count` | Nombre total de messages non lus reçus par l'utilisateur connecté |

Les routes `auth` sont limitées en nombre de tentatives. Les pages `student_profil`, `parent_profil` et `tutor_profil` sont réservées à leur rôle (`server.js`) ; la page `student_profil` est aussi ouverte aux parents. Le middleware `requireChildren` détermine de quel élève on parle : l'élève connecté, ou l'enfant d'un parent (`?id=`) après vérification du lien de parenté.

## Pages

| Page | État |
|---|---|
| Accueil | formulaire de recherche (matière + ville avec autocomplétion) qui redirige vers `/research`. Le reste est statique |
| Connexion et inscription | fonctionnelles (sessions, messages d'erreur, œil pour le mot de passe) |
| Espace tuteur (`tutor_profil`) | cours, parcours et présentation : affichage, ajout, modification, suppression avec confirmation. Disponibilités : planning à sélection par glisser-déposer, enregistré et rechargé. Informations personnelles : affichage et modification. Calendrier de la semaine (fenêtre) avec les cours réservés. Menu latéral qui suit le défilement, messages de confirmation. Les statistiques et les demandes de réservation sont statiques |
| Espace parent (`parent_profil`) | informations personnelles (affichage et enregistrement), liste des enfants, ajout d'un enfant, lien vers le profil de chaque enfant, cours à venir et professeurs passés des enfants. Les comptes rendus et paiements sont statiques |
| Espace élève (`student_profil`) | informations personnelles (affichage et enregistrement), consultables par le parent d'un enfant, cours à venir et professeurs passés. Le reste est statique |
| Fiche publique d'un tuteur (`tutor?id=`) | chargement depuis la base, cours et créneaux selon les disponibilités, réservation d'un créneau puis page de confirmation (`success_reserve`) |
| Recherche (`research`) | filtrée par matière et/ou ville via `/api/public/search-tutor`. Le reste est statique |
| Confirmation (`success_reserve`) | récapitulatif de la réservation |
| Détails d'un cours (`course_details`) | informations du cours réservé (titre, matière, date, heure, durée, mode, tarif, élève, tuteur), chargées depuis la base. L'échange de fichiers n'est pas encore branché |
| Messagerie (`messages`) | liste des conversations, prévisualisation du dernier message et des dates, défilement automatique des discussions (`scrollToBottom`), suppression dynamique des badges non lus au clic, envoi et lecture de messages chiffrés. Pas de mise à jour en direct. |

L'en-tête (`header.js`) remplace « Se connecter » et « Créer un compte » par « Mon espace » et « Se déconnecter » quand l'utilisateur est connecté, et ajoute un lien « Messages ».

## À faire

- Contrôles d'accès sur la messagerie (`/api/message`) et sur `/api/lesson/get-info` : authentification, vérification que l'utilisateur fait partie de la conversation ou du cours ; protéger la page `messages` dans `server.js`
- Valider la fenêtre « Complétez votre profil » (envoi au serveur)
- Finir la fiche publique : retrait des créneaux déjà réservés
- Échange de fichiers sur la page de détails d'un cours
- Espaces parent et élève : comptes rendus, factures
- Vérification des tuteurs (diplômes, identité) avant publication de leur fiche
- Mise en ligne : HTTPS, sessions stockées en base