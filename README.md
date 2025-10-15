# 🧭 Gestion des courses EPS

Cette application web aide les enseignants d'EPS à préparer et observer des séances de demi-fond. Elle permet de définir la VMA d'un élève, de créer des courses avec pourcentage de VMA et de suivre un chrono avec indicateur "lièvre" pour savoir si l'élève est en avance ou en retard sur l'objectif.

## 🚀 Démarrage

1. Ouvrez `index.html` dans votre navigateur.
2. Renseignez le nom de l'élève (facultatif), sa VMA en km/h ainsi que la distance séparant chaque plot.
3. Ajoutez les courses en précisant la distance (en mètres) et le % de VMA. Le numéro de course est généré automatiquement.
4. Sélectionnez une course pour lancer le suivi : démarrez, enregistrez chaque passage de plot pour suivre le lièvre au plus près, mettez en pause ou réinitialisez le chrono et passez à la course suivante.

Les données sont conservées localement dans le navigateur (LocalStorage).

## 🧰 Pile technique

- HTML, CSS et JavaScript natif
- Stockage local dans le navigateur

## ✅ Fonctionnalités principales

- Paramétrage de la VMA et de la distance entre plots par élève
- Calcul automatique des temps et allures cibles
- Chronomètre avec indicateur d'écart (avance/retard) et suivi plot par plot
- Navigation entre les différentes courses programmées

## 📦 Structure

```
index.html   # Structure principale de l'application
styles.css   # Styles et mise en page
app.js       # Logique de gestion des courses et du chrono
```
