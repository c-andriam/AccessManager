# Starlink Access Manager

## 🛰️ Présentation

Starlink Access Manager est une application web complète de gestion d'accès Internet pour les connexions Starlink. Elle permet de contrôler l'accès à Internet via un système d'authentification par utilisateur, avec limitation du nombre d'appareils connectés par utilisateur.

## ✨ Fonctionnalités principales

### Interface Client
- Authentification des utilisateurs
- Gestion des appareils personnels (ajout, suppression, connexion, déconnexion)
- Visualisation des appareils actuellement connectés
- Limitation automatique à 4 appareils par utilisateur

### Interface Admin
- Tableau de bord avec statistiques d'utilisation
- Gestion complète des utilisateurs
- Contrôle des appareils connectés
- Configuration système (nombre d'appareils par utilisateur, règles d'accès)
- Consultation des logs de connexion

## 🏗️ Architecture technique

L'application est construite avec les technologies suivantes :

- **Frontend** : React.js avec Material UI
- **Backend** : Node.js avec Express.js
- **Base de données** : PostgreSQL
- **Authentification** : JWT (JSON Web Tokens)
- **Réseau** : Portail captif pour intercepter et rediriger les nouvelles connexions

## 🚀 Installation

### Prérequis
- Node.js (v16+)
- npm ou yarn
- PostgreSQL
- Docker et docker-compose (optionnel)

### Installation avec Docker

1. Clonez ce dépôt :
```bash
git clone https://github.com/votre-nom/starlink-access-manager.git
cd starlink-access-manager
```

2. Créez un fichier `.env` à partir du modèle :
```bash
cp .env.example .env
```

3. Modifiez les variables d'environnement selon votre configuration

4. Lancez l'application avec Docker Compose :
```bash
docker-compose up -d
```

L'application sera disponible sur :
- Interface client : http://localhost:3000
- API : http://localhost:5000
- Portail captif : http://localhost:3333

### Installation manuelle

1. Clonez ce dépôt et installez les dépendances :
```bash
git clone https://github.com/votre-nom/starlink-access-manager.git
cd starlink-access-manager
npm run install-all
```

2. Créez la base de données PostgreSQL et importez le schéma :
```bash
psql -U postgres -c "CREATE DATABASE starlink_manager"
psql -U postgres -d starlink_manager -f server/models/db.sql
```

3. Créez un fichier `.env` à partir du modèle et modifiez-le selon votre configuration

4. Lancez l'application en mode développement :
```bash
npm run dev
```

## 🧩 Structure du projet

```
starlink-access-manager/
├── .env                     # Variables d'environnement
├── docker-compose.yml       # Configuration Docker
├── package.json             # Dépendances et scripts npm
├── README.md                # Documentation du projet
│
├── captive-portal/          # Portail captif
│   └── captive.js           # Script du portail captif
│
├── client/                  # Frontend React
│   ├── package.json         # Dépendances React
│   └── src/
│       ├── components/      # Composants réutilisables
│       │   ├── common/
│       │   │   ├── AlertMessage.js
│       │   │   └── LoadingButton.js
│       │   ├── devices/
│       │   │   └── DeviceCard.js
│       │   └── layout/
│       │       └── Navbar.js
│       └── pages/           # Pages de l'application
│           ├── admin/
│           │   ├── Dashboard.js
│           │   └── UserManagement.js
│           ├── DeviceManagement.js
│           └── Login.js
│
└── server/                  # Backend Node.js
    ├── models/
    │   └── db.sql           # Schéma de la base de données
    ├── routes/
    │   ├── admin.js         # Routes d'administration
    │   ├── auth.js          # Routes d'authentification
    │   └── devices.js       # Routes de gestion des appareils
    ├── server.js            # Point d'entrée du serveur
    └── utils/
        └── networkControl.js # Utilitaires pour le contrôle réseau
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Authentification

### Devices
- `GET /api/devices` - Récupérer les appareils de l'utilisateur
- `POST /api/devices` - Ajouter un appareil
- `DELETE /api/devices/:id` - Supprimer un appareil
- `PUT /api/devices/:id/status` - Connecter/déconnecter un appareil

### Admin
- `GET /api/admin/users` - Lister les utilisateurs
- `POST /api/admin/users` - Créer un utilisateur
- `PUT /api/admin/users/:id` - Modifier un utilisateur
- `GET /api/admin/stats` - Statistiques générales
- `GET /api/admin/devices` - Liste de tous les appareils

## 🔧 Configuration du portail captif

Le portail captif intercepte les nouvelles connexions et redirige les utilisateurs vers la page de login avant d'autoriser l'accès à Internet. Pour configurer le portail captif avec un routeur :

1. Configurez le routeur pour rediriger tout le trafic HTTP vers l'adresse du portail captif
2. Ajoutez les règles iptables nécessaires pour autoriser/bloquer les appareils

## 🛡️ Sécurité

- Mots de passe hachés avec bcrypt
- Authentification par tokens JWT
- Validation des entrées utilisateur
- Protection CORS
- En-têtes de sécurité avec Helmet.js

## 📝 Licence

Ce projet est sous licence [MIT](LICENSE).
