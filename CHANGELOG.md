# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Non publié]

### Ajouté
- Initial repository setup
- Core 3D rendering system avec Three.js
- Multi-viewport system (6 vues orthographiques)
- Système de contrôles synchronisés
- Chargeur GLTF/GLB avec optimisation
- Interface utilisateur complète
- Système d'export haute résolution
- Templates pour marketplaces (TurboSquid, CGTrader)
- Processeur d'export par lots
- Documentation complète

## [1.0.0] - 2025-06-13

### Ajouté
- **Core Features**
  - Système de rendu 3D multi-viewport
  - Support des formats GLTF/GLB avec chargement optimisé
  - 6 vues orthographiques standardisées (Front, Back, Left, Right, Top, Bottom)
  - Contrôles souris et clavier synchronisés
  - Système de caméras orthographiques avec auto-framing

- **Interface Utilisateur**
  - Interface drag & drop pour chargement de modèles
  - Panneau de contrôle avec presets d'éclairage
  - Sélection d'arrière-plans (TurboSquid standard, blanc, transparent, gradient)
  - Contrôles de qualité de rendu (rapide, standard, haute, ultra)
  - Prévisualisation temps réel des 6 vues
  - Feedback visuel avec overlays et indicateurs de statut

- **Système d'Export**
  - Export haute résolution jusqu'à 4K par vue
  - Support des formats PNG et JPEG avec qualité ajustable
  - Templates optimisés pour TurboSquid (search image 1920x1920, product shots 1920x1080)
  - Templates pour CGTrader (ratio 1.33:1 recommandé)
  - Export de wireframes pour vues techniques
  - Génération de contact sheets (grille de toutes les vues)
  - Séquences turntable 360° (12-36 frames)

- **Templates Marketplace**
  - **TurboSquid** : Conformité complète aux spécifications 2025
    - Search image carrée (1920x1920px) avec fond RGB(247,247,247)
    - 5+ product shots minimum (1920x1080px)
    - Vue wireframe obligatoire
    - Support CheckMate requirements
  - **CGTrader** : Optimisation pour maximiser les ventes
    - Ratio 1.33:1 pour affichage optimal
    - Recommandations SEO (50-100 mots description, 10-15 tags)
  - **Sketchfab, Unity, Unreal** : Templates pour autres plateformes

- **Optimisations Performance**
  - Rendu multi-viewport optimisé
  - Gestion mémoire intelligente
  - Support des modèles jusqu'à 10M+ polygones
  - Export par lots avec gestion des ressources
  - Système de qualité adaptatif

- **Fonctionnalités Avancées**
  - Auto-centrage et mise à l'échelle des modèles
  - Presets d'éclairage professionnels (Studio, Naturel, Dramatique, Technique)
  - Validation automatique selon les standards marketplace
  - Nommage intelligent des fichiers exportés
  - Statistiques et métriques de performance

### Technique
- **Architecture modulaire** avec séparation claire des responsabilités
- **Core 3D** : Scene, Renderer, CameraManager, Controls
- **UI Components** : FileUploader, ControlPanel, PreviewManager
- **Export System** : ImageExporter, Templates, BatchProcessor
- **Standards de code** : ESLint, Prettier, documentation JSDoc
- **Build system** : Vite pour développement et production optimisés

### Documentation
- README complet avec instructions d'installation et d'utilisation
- Guide de contribution (CONTRIBUTING.md)
- Spécifications techniques détaillées
- Exemples d'usage et cas d'utilisation
- Standards de qualité marketplace

### Compatibilité
- **Navigateurs** : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Formats supportés** : GLTF, GLB avec extensions DRACO
- **Résolutions d'export** : 720p à 8K
- **Plateformes** : Desktop et tablet (responsive design)

---

## Types de modifications

- `Ajouté` pour les nouvelles fonctionnalités
- `Modifié` pour les changements de fonctionnalités existantes
- `Déprécié` pour les fonctionnalités qui seront supprimées prochainement
- `Supprimé` pour les fonctionnalités supprimées maintenant
- `Corrigé` pour toute correction de bug
- `Sécurité` en cas de vulnérabilités

## Liens

- [Repository GitHub](https://github.com/creach-t/3d-multiview-platform)
- [Issues](https://github.com/creach-t/3d-multiview-platform/issues)
- [Pull Requests](https://github.com/creach-t/3d-multiview-platform/pulls)
