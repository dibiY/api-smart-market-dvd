# Smart Market DVD — API

Backend REST de la marketplace DVD **Smart Market**, construit avec **NestJS 11**, **TypeORM** et **MySQL 8**.  
Il expose un catalogue de produits et un moteur de promotion qui calcule automatiquement le prix d'un panier en appliquant des remises par saga.

---

## Sommaire

1. [Présentation](#présentation)
2. [Architecture](#architecture)
3. [Endpoints](#endpoints)
4. [Règles de promotion](#règles-de-promotion)
5. [Démarrage local (sans Docker)](#démarrage-local-sans-docker)
6. [Démarrage avec Docker](#démarrage-avec-docker)
   - [Dev](#env-dev--local)
   - [Recette](#env-recette--staging)
   - [Production](#env-production)
7. [Tests](#tests)
8. [Variables d'environnement](#variables-denvironnement)

---

## Présentation

| Technologie | Version |
|---|---|
| Node.js | 22 (LTS) |
| NestJS | 11 |
| TypeORM | 0.3 |
| MySQL | 8.4 |
| TypeScript | 5.7 |

L'API suit une **architecture hexagonale** (Clean Architecture) :

```
src/
├── core/               # Domaine métier pur (entités, value objects, interfaces de repo)
├── application/        # Cas d'usage (DTOs, use cases)
├── infrastructure/     # Adaptateurs TypeORM (repositories, mapping, seeder)
└── web-api/            # Controllers NestJS, modules
```

---

## Endpoints

### Catalogue

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/products` | Retourne tous les produits du catalogue |

### Panier

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/cart/price` | Calcule le prix d'un panier avec les promotions appliquées |

**Documentation Swagger interactive** : `http://localhost:8000/api/docs`

#### Exemple — `POST /cart/price`

```json
// Request
{
  "items": [
    { "productId": "sw-vol-1", "quantity": 1 },
    { "productId": "sw-vol-2", "quantity": 1 },
    { "productId": "sw-vol-3", "quantity": 1 }
  ]
}

// Response 200
{
  "lines": [
    { "productId": "sw-vol-1", "productName": "Star Wars Vol. 1", "quantity": 1, "unitPrice": 15, "lineTotal": 12, "discountRate": 20, "currency": "EUR" },
    { "productId": "sw-vol-2", "productName": "Star Wars Vol. 2", "quantity": 1, "unitPrice": 15, "lineTotal": 12, "discountRate": 20, "currency": "EUR" },
    { "productId": "sw-vol-3", "productName": "Star Wars Vol. 3", "quantity": 1, "unitPrice": 15, "lineTotal": 12, "discountRate": 20, "currency": "EUR" }
  ],
  "total": 36,
  "currency": "EUR"
}
```

---

## Règles de promotion

Les remises s'appliquent **par saga**, sur la quantité totale de volumes de la saga dans le panier.

| Volumes de la saga dans le panier | Remise |
|---|---|
| 1 | 0 % |
| 2 | 10 % |
| ≥ 3 | 20 % |

Les produits **standalone** (sans saga) ne bénéficient d'aucune remise.

---

## Démarrage local (sans Docker)

### Prérequis

- Node.js ≥ 22
- MySQL 8 accessible en local

### Installation

```bash
# 1. Cloner le dépôt
git clone <repo-url>
cd api-smart-market-dvd

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.dev.example .env
# Éditer .env avec vos identifiants MySQL
```

### Démarrage

```bash
# Mode watch (hot-reload)
npm run start:dev

# Mode normal
npm run start

# Mode production (build compilé)
npm run build
npm run start:prod
```

L'API est disponible sur `http://localhost:8000`.

---

## Démarrage avec Docker

### Prérequis

- [Docker](https://www.docker.com/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) v2

### Architecture de l'image (multi-stage)

```
Dockerfile
├── Stage deps     → npm ci --omit=dev   (dépendances prod uniquement)
├── Stage builder  → npm ci + npm run build   (compile le TypeScript)
└── Stage runner   → image finale : dist/ + node_modules prod (~80 MB)
```

L'image finale ne contient **ni le code source**, **ni les devDependencies**.  
Elle s'exécute avec un **utilisateur non-root** (`appuser`) pour la sécurité.

---

### Env DEV — local

`docker-compose.override.yml` est appliqué **automatiquement** par Docker Compose.

```bash
# 1. Créer le fichier d'environnement
cp .env.dev.example .env

# 2. Démarrer (hot-reload activé, DB exposée sur localhost:3306)
docker compose up
```

| Service | URL locale |
|---|---|
| API (hot-reload) | http://localhost:8000 |
| Swagger | http://localhost:8000/api/docs |
| MySQL | localhost:3306 |

---

### Env RECETTE — staging

```bash
# 1. Créer le fichier d'environnement sur le serveur
cp .env.recette.example .env
# Éditer .env avec les vraies valeurs recette

# 2. Démarrer
docker compose -f docker-compose.yml -f docker-compose.recette.yml up -d
```

- `NODE_ENV=staging`
- `DB_SYNCHRONIZE=true` — schéma mis à jour automatiquement
- Port DB **non exposé** à l'extérieur
- Port API exposé sur `${PORT}` (défaut : 8000)

---

### Env PRODUCTION

```bash
# 1. Créer le fichier d'environnement sur le serveur
cp .env.prod.example .env
# Remplir DB_ROOT_PASSWORD, DB_PASSWORD, CORS_ORIGIN, IMAGE_TAG

# 2. (Optionnel) Renseigner une image pré-buildée par le CI/CD
# dans .env : IMAGE_TAG=ghcr.io/your-org/api-smart-market-dvd:1.2.3

# 3. Démarrer
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

- `NODE_ENV=production`
- `DB_SYNCHRONIZE=false` — les migrations doivent être exécutées explicitement
- `restart: always` sur l'API et la base
- Port DB **jamais exposé** à l'extérieur

#### Builder et pousser l'image manuellement

```bash
# Build
docker build -t ghcr.io/your-org/api-smart-market-dvd:1.0.0 .

# Push vers un registry
docker push ghcr.io/your-org/api-smart-market-dvd:1.0.0
```

---

### Résumé des commandes Docker

| Environnement | Commande |
|---|---|
| Dev (local) | `docker compose up` |
| Recette | `docker compose -f docker-compose.yml -f docker-compose.recette.yml up -d` |
| Production | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` |
| Arrêter | `docker compose down` |
| Arrêter + supprimer volumes | `docker compose down -v` |

---

## Tests

```bash
# Tests unitaires (106 tests — core / application / infrastructure / web-api)
npm test

# Tests E2E (25 tests — SQLite in-memory, aucune DB externe requise)
npm run test:e2e

# Couverture
npm run test:cov
```

---

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port d'écoute de l'API | `8000` |
| `DB_HOST` | Hôte MySQL (dans Docker : `db`) | `localhost` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | Utilisateur MySQL | — |
| `DB_PASSWORD` | Mot de passe MySQL | — |
| `DB_NAME` | Nom de la base de données | — |
| `DB_ROOT_PASSWORD` | Mot de passe root MySQL (Docker uniquement) | — |
| `DB_SYNCHRONIZE` | Sync automatique du schéma TypeORM | `false` |
| `CORS_ORIGIN` | Origine autorisée pour le CORS | `*` |
| `IMAGE_TAG` | Image Docker pré-buildée (prod CI/CD) | _(build local)_ |

Voir les fichiers `.env.*.example` pour des exemples complets par environnement.

