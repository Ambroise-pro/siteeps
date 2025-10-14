# EPS Vauban – Portail applicatif

Cette page d'accueil liste automatiquement toutes les applications disponibles sur le serveur. Chaque dossier ajouté via FTP (à la racine du site) est détecté et une vignette est générée dynamiquement.

## Comment ajouter une application

1. Uploadez votre dossier d'application à la racine du site (par exemple `CA1 Arcathlon Jeu de l'oie/`).
2. Nommez le dossier en respectant la convention `ChampActivité Sport Nom de l’application` (ex. `CA2 Badminton Matchs de poule`). Le script affiche automatiquement :
   - le **champ d'activité** (premier bloc) comme badge,
   - le **sport** (deuxième bloc) comme sous-titre,
   - le **nom de l'application** (reste du nom) comme titre.
3. Assurez-vous que le dossier contient un fichier `index.html` (ou à défaut un autre fichier `.html/.htm`) et une image `logo.*` (`logo.png`, `logo.jpg`, `logo.svg`, etc.).
4. Déposez votre dossier via FTP : la carte apparaît immédiatement sur la page d'accueil sans action supplémentaire.

### Personnaliser l'affichage (facultatif)

L'usage de la convention de nommage suffit dans la majorité des cas. Si besoin, vous pouvez toutefois ajouter un fichier `app.json` dans le dossier pour définir un titre, une description ou préciser un fichier d'entrée différent :

```json
{
  "title": "Défis EPS",
  "description": "Tableau des défis pour les classes de 5e",
  "entry": "defi.html",
  "icon": "images/logo-defi.svg"
}
```

- `title` : texte affiché sur la carte (par défaut dérivé du nom du dossier).
- `description` : sous-titre facultatif, sinon le sport ou le nom du fichier HTML sera affiché.
- `entry` : chemin relatif vers la page à ouvrir.
- `icon` : chemin relatif vers l'image à utiliser.

## API

Le script `api/list-apps.php` parcourt les dossiers pour fournir la liste JSON utilisée par l'accueil (`index.html`). Il met automatiquement à jour l'interface lorsque de nouveaux dossiers sont ajoutés.

## Comment tester l'application ?

Pour vérifier le fonctionnement en local :

1. Installez PHP ≥ 8.0 sur votre machine.
2. Depuis la racine du projet, lancez un serveur de développement avec :
   ```bash
   php -S localhost:8000
   ```
3. Ouvrez <http://localhost:8000> dans votre navigateur pour voir la page d'accueil.
4. Ajoutez un dossier de test (par exemple `CA1 Test App`) contenant un `index.html` et un `logo.png` pour vérifier que la carte apparaît immédiatement.
5. L'API peut être interrogée directement via <http://localhost:8000/api/list-apps.php> pour inspecter le JSON retourné.

## Développement

- Aucune dépendance côté serveur n'est nécessaire en dehors de PHP ≥ 8.0.
- Le front utilise Bootstrap 5 depuis un CDN et un script JavaScript léger pour afficher les cartes.
