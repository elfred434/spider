# Web Glide

Prototype de jeu 3D de voltige en navigateur, créé en HTML, CSS et JavaScript.

## Lancer le prototype

Ouvrir `index.html` dans un navigateur récent. Pour un lancement recommandé :

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>.

## Commandes

- Clic droit maintenu : accrocher une toile
- Relâcher le clic droit : couper la toile
- Espace : sauter ou se propulser
- WASD : diriger le personnage
- Échap : couper la toile

## Modèle 3D

Le modèle original `models/web_runner.glb` est un personnage stylisé Web Runner avec casque, visière, panneaux de costume, emblème, gants, bottes et articulations. Le script de génération est disponible dans `tools/create_model.py`.

Le fichier `.glb` est un modèle original et ne reprend pas de marque ou de costume officiel. Le chargeur GLB de `index.html` tente de le charger automatiquement depuis `models/web_runner.glb` et utilise le personnage procédural comme solution de secours si le jeu est ouvert sans serveur HTTP.

## Génération des bâtiments

- `world/buildings.js` contient les générateurs de tours vitrées, tours Art déco, blocs résidentiels, tours en gradins et tours côtières tropicales.
- `world/building_styles.json` documente les familles architecturales utilisées comme inspiration.
- La génération est déterministe : un même chunk produit les mêmes bâtiments à chaque lancement.
- `world/scenery.js` ajoute les routes, lampadaires, passerelles, arbres, rochers, montagnes, neige, lave, cratères et fumées.
- `world/scenery_styles.json` documente les éléments de décor par biome.
