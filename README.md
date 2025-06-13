# 3D Multi-View Platform

Une plateforme web interactive pour visualiser des modèles 3D sous 6 angles simultanés et générer des captures optimisées pour les marketplaces comme TurboSquid et CGTrader.

## 🎯 Objectifs

- **Accélération** du processus de mise en ligne de modèles 3D
- **Standardisation** des visuels selon les bonnes pratiques marketplace
- **Optimisation TurboSquid** pour maximiser la visibilité
- **Qualité professionnelle** pour augmenter les ventes
- **Efficacité** de traitement de catalogues complets

## ✨ Fonctionnalités

### Interface Multi-Vues
- **Grille 2x3** avec 6 viewports simultanés
- **Vues standardisées** : Front, Back, Left, Right, Top, Bottom
- **Contrôles synchronisés** sur toutes les vues
- **Prévisualisation temps réel**

### Contrôles Interactifs
- **Rotation libre** (clic gauche + glisser)
- **Zoom** (molette souris)
- **Translation** (clic droit + glisser)
- **Reset** position initiale
- **Sauvegarde** des configurations

### Export Multi-Marketplace

#### TurboSquid (Optimisé)
- **Search Image** : 1200x1200px, fond RGB(247,247,247)
- **Product Shots** : 1920x1080px, 5 images minimum
- **Wireframe** : Topology visible
- **Turntable** : 12-36 frames pour animation 360°

#### CGTrader
- **Images principales** : Jusqu'à 4K, ratio libre
- **Ratio recommandé** : 1.3-1.35 pour affichage optimal

### Templates Intelligents
- **Détection automatique** du type de modèle
- **Éclairage adaptatif** par catégorie
- **Nommage automatique** : `[SKU]_[marketplace]_[vue]_[resolution]`
- **Validation conformité** avant export

## 🛠️ Technologies

- **Three.js** - Rendu 3D WebGL
- **GLTFLoader** - Import modèles .glb
- **OrbitControls** - Manipulation caméra
- **Canvas API** - Export images haute résolution
- **Vanilla JS** - Performance optimisée
- **CSS Grid** - Layout responsive

## 🚀 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/creach-t/3d-multiview-platform.git
cd 3d-multiview-platform
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
```

4. **Ouvrir dans le navigateur**
```
http://localhost:3000
```

## 📋 Utilisation

1. **Upload** - Glisser-déposer un fichier .glb
2. **Ajustement** - Utiliser les contrôles pour positionner le modèle
3. **Configuration** - Choisir le preset marketplace
4. **Export** - Générer toutes les vues en un clic

## 📁 Structure du Projet

```
3d-multiview-platform/
├── src/
│   ├── js/
│   │   ├── core/
│   │   │   ├── Scene.js          # Gestion scène Three.js
│   │   │   ├── Renderer.js       # Multi-viewport renderer
│   │   │   ├── CameraManager.js  # Gestion 6 caméras
│   │   │   └── Controls.js       # Contrôles synchronisés
│   │   ├── loaders/
│   │   │   └── GLTFLoader.js     # Import modèles .glb
│   │   ├── export/
│   │   │   ├── ImageExporter.js  # Export haute résolution
│   │   │   ├── Templates.js      # Templates marketplace
│   │   │   └── BatchProcessor.js # Traitement lot
│   │   ├── ui/
│   │   │   ├── FileUploader.js   # Drag & drop interface
│   │   │   ├── ControlPanel.js   # Panneau contrôles
│   │   │   └── PreviewManager.js # Gestion prévisualisations
│   │   └── main.js               # Point d'entrée
│   ├── css/
│   │   ├── main.css              # Styles principaux
│   │   ├── viewport.css          # Styles multi-vues
│   │   └── controls.css          # Interface contrôles
│   └── assets/
│       ├── models/               # Modèles d'exemple
│       └── textures/             # Textures d'environnement
├── index.html                    # Page principale
├── package.json                  # Dépendances npm
└── vite.config.js               # Configuration Vite
```

## 🎨 Spécifications Marketplace

### TurboSquid Requirements
- **Search Image** : Carré 1200x1200px minimum
- **Arrière-plan** : RGB(247,247,247) obligatoire
- **Product Shots** : 1920x1080px minimum, 5 images
- **Wireframe** : Topology visible requis
- **Pas d'overlays** sur Search Image

### CGTrader Best Practices
- **Résolution** : Responsive jusqu'à 4K
- **Description** : 50-100 mots (3x plus de ventes)
- **Tags** : 10-15 mots-clés minimum
- **Ratio optimal** : 1.3-1.35

## 🔧 Configuration Avancée

### Presets d'Éclairage
- **Studio** : Éclairage diffusé uniforme
- **Naturel** : Simulation lumière jour
- **Dramatique** : Éclairage artistique contrasté
- **Technique** : Pour wireframes et plans

### Qualité de Rendu
- **Rapide** : Preview temps réel
- **Standard** : Équilibre qualité/vitesse
- **Haute qualité** : Export final optimisé

## 📊 Performance

- **Rendu** : < 30 secondes pour pack complet 6 vues
- **Support** : Modèles jusqu'à 10M polygones
- **Export** : Résolutions jusqu'à 4K par vue
- **Mémoire** : Optimisé pour navigateurs modernes

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- **Issues** : [GitHub Issues](https://github.com/creach-t/3d-multiview-platform/issues)
- **Documentation** : [Wiki du projet](https://github.com/creach-t/3d-multiview-platform/wiki)

---

**Made with ❤️ for the 3D community**