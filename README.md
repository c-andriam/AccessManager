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

## 🧪 Instructions pour tester le projet

### Méthode 1: Avec Docker (recommandée)

1. **Installer les prérequis**
   - [Docker](https://docs.docker.com/get-docker/)
   - [Docker Compose](https://docs.docker.com/compose/install/)

2. **Démarrer le projet**
   ```bash
   # Cloner le dépôt si ce n'est pas déjà fait
   git clone <url-du-repo>
   cd starlink-access-manager
   
   # Démarrer tous les services avec Docker
   docker-compose up -d
   ```

3. **Accéder aux interfaces**
   - Interface client: http://localhost:3000
   - API: http://localhost:5000
   - Portail captif: http://localhost:3333

### Méthode 2: Installation manuelle (développement)

1. **Installer les prérequis**
   - [Node.js](https://nodejs.org/) (v16+)
   - [PostgreSQL](https://www.postgresql.org/download/)

2. **Configurer la base de données**
   ```bash
   # Créer la base de données
   psql -U postgres -c "CREATE DATABASE starlink_manager"
   
   # Importer le schéma
   psql -U postgres -d starlink_manager -f server/models/db.sql
   ```

3. **Installer les dépendances**
   ```bash
   # À la racine du projet
   npm install
   
   # Dans le dossier client
   cd client
   npm install
   cd ..
   ```

4. **Configurer les variables d'environnement**
   - Modifier le fichier `.env` selon votre configuration

5. **Démarrer les services**
   ```bash
   # Démarrer tous les services en mode développement
   npm run dev
   
   # Ou démarrer chaque service séparément
   npm run server  # Serveur backend sur port 5000
   npm run client  # Client React sur port 3000
   npm run captive # Portail captif sur port 3333
   ```

### Tester l'application

1. **Créer un compte administrateur**
   ```bash
   # Se connecter à la base de données
   psql -U postgres -d starlink_manager
   
   # Insérer un utilisateur admin (mot de passe: admin123)
   INSERT INTO users (username, email, password, role)
   VALUES ('admin', 'admin@example.com', '$2b$10$Xa5YSPXWzMMRQ9ID1vx0guG76mPY5FmhxnYv4dTIHkUL4.ly9Feeu', 'admin');
   ```

2. **Se connecter à l'interface**
   - Ouvrir http://localhost:3000/login
   - Identifiants: admin / admin123

3. **Tester le portail captif**
   - Ouvrir http://localhost:3333 dans un navigateur privé
   - Le portail devrait intercepter la connexion et demander l'authentification

### Dépannage courant

- **Erreur de connexion à la base de données**: Vérifiez les paramètres dans `.env`
- **Le serveur ne démarre pas**: Assurez-vous que les ports 5000, 3000 et 3333 sont disponibles
- **Erreur CORS**: Vérifiez que les URL dans `.env` correspondent à vos services

Pour d'autres problèmes, consultez les logs des services:
```bash
# Avec Docker
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f captive-portal
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
