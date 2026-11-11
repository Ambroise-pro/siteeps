# VideoEPS – Chrono Course

Application web pour chronométrer les arrivées d'une course de demi-fond en filmant la ligne d'arrivée.

- Caméra en direct + chrono à l'écran
- Un bouton DÉPART lance le chrono et l'enregistrement vidéo en même temps
- Un appui sur ARRIVÉE par coureur
- Classement final, vidéo avec chrono incrusté
- Import de la liste des élèves en CSV (colonnes Nom, Prénom, Groupe, Dossard reconnues)
- Classes enregistrées (liste + groupes réutilisables) ; groupes formés en cochant les élèves
- Pendant la course : compteur « 7 / 10 », message quand tout le groupe est passé, bouton « +1 ensemble » pour les ex aequo
- Fiche résultats en HTML (classement + photos, imprimable en PDF)
- Photo d'arrivée prise à chaque appui (gardée avec la course dans l'historique, exportable avec les noms), validation des arrivées avec menu déroulant (l'élève choisi disparaît de la liste)
- Élèves arrivés ensemble : « + Ajouter un élève » sur la même arrivée

Ouvrir la page publiée (GitHub Pages) dans Safari ou Chrome et autoriser la caméra.

## Modifications EPS Vauban

- À la fin de la course, la photo de l'arrivée n°1 s'ouvre en grand avec, à droite, la liste des élèves restants : un toucher sur un nom l'attribue à l'arrivée et passe automatiquement à la suivante (« × » pour corriger, recherche pour les grandes listes).
- Import CSV sans en-tête : la colonne A contient le nom et le prénom (colonne B si la colonne A est un numéro de dossard).
- Temps intermédiaires : dans « Temps intermédiaires », indiquer les passages (ex. « 400 m, 800 m »). Pendant la course, le gros bouton affiche le passage en cours (bleu pour un intermédiaire, rouge pour l'arrivée) ; l'application passe au suivant quand tout le groupe est passé, et la barre au-dessus permet de changer à la main. À la fin, la visionneuse enchaîne les photos de chaque passage puis de l'arrivée. Les résultats affichent un tableau « Temps par élève » (temps à chaque passage, écart entre passages, temps final), repris dans la fiche, le texte copié et les photos exportées.
- Épreuve en plusieurs courses (ex. 3 × 500 m) : régler « Courses par élève » (automatique avec « 3 × 500 m »). Chaque course filmée s'ajoute à l'épreuve en cours ; après chaque course, « Course suivante » demande le groupe qui court. Le bilan réunit, pour chaque élève, ses courses dans l'ordre (temps final, place, temps intermédiaires), avec cumul des courses (1+2+3), moyenne et meilleur temps ; temps intermédiaires en colonnes ; export tableur (CSV), fiche HTML ou texte. « Terminer l'épreuve » la clôt (le bilan reste consultable).
