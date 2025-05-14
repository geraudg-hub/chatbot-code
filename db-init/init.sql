-- Supprimer l'utilisateur existant s'il y a des conflits
DROP USER IF EXISTS 'app_user'@'%';

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS `app_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur avec double authentification
CREATE USER 'app_user'@'%' 
IDENTIFIED WITH mysql_native_password BY 'app_password' 
WITH MAX_QUERIES_PER_HOUR 0 MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0;

-- Accorder les privilèges de manière explicite
GRANT ALL PRIVILEGES ON `app_db`.* TO 'app_user'@'%' 
WITH GRANT OPTION;

-- Appliquer les changements
FLUSH PRIVILEGES;