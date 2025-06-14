# 🎨 3D Multi-View Platform - Modern UI Edition

> **Nouvelle interface moderne et professionnelle** - Visualisez vos modèles 3D sous 6 angles simultanés avec une UX premium et générez des captures optimisées pour TurboSquid et CGTrader.

## ✨ Nouveautés de la refonte UI

### 🌙 Dark/Light Mode
- **Mode sombre par défaut** avec interface premium
- **Basculement fluide** entre thèmes avec `Ctrl+Shift+T`
- **Animations de transition** sophistiquées
- **Préférence système** respectée automatiquement

### 🔮 Glassmorphism & Animations
- **Effets de verre** avec backdrop-filter moderne
- **Animations d'entrée** pour tous les composants
- **Micro-interactions** sur tous les éléments
- **Gradients animés** en arrière-plan
- **Effets de parallaxe** subtils

### 🎯 UX Améliorée
- **Feedback visuel** instantané pour toutes les actions
- **Toast notifications** modernes et non-intrusives
- **Progress indicators** visuels pour les exports
- **Status indicators** temps-réel dans le header
- **Tooltips informatifs** avec raccourcis clavier

### ⌨️ Navigation Avancée
- **Raccourcis clavier** pour toutes les actions principales
- **Navigation au clavier** complète (accessibilité)
- **Focus management** intelligent
- **Support écran tactile** optimisé

## 🎯 Fonctionnalités principales

### Interface Multi-Vues
- **Grille 2x3** responsive avec 6 viewports simultanés
- **Vues standardisées** : Front, Back, Left, Right, Top, Bottom
- **Contrôles synchronisés** sur toutes les vues
- **Mode plein écran** pour une immersion totale
- **Indicateurs visuels** pour chaque vue

### Contrôles Interactifs Premium
- **Rotation libre** (clic gauche + glisser) avec feedback
- **Zoom** (molette souris) avec limites intelligentes  
- **Translation** (clic droit + glisser) fluide
- **Reset** position avec animation
- **Sync caméras** pour contrôler toutes les vues ensemble

### Export Multi-Marketplace
#### TurboSquid (Optimisé)
- **Search Image** : 1200x1200px, fond RGB(247,247,247)
- **Product Shots** : 1920x1080px, 5 images minimum
- **Wireframe** : Topology visible avec toggle
- **Validation** conformité automatique

#### CGTrader Compatible
- **Images principales** : Jusqu'à 4K, ratio libre
- **Ratio recommandé** : 1.3-1.35 pour affichage optimal
- **Export batch** optimisé

### Templates Intelligents
- **Détection automatique** du type de modèle
- **Éclairage adaptatif** par catégorie (Studio, Natural, Dramatic, Technical)
- **Arrière-plans** multiples (TurboSquid, White, Transparent, Gradient)
- **Nommage automatique** : `[SKU]_[marketplace]_[vue]_[resolution]`

## 🛠️ Technologies

- **Three.js** - Rendu 3D WebGL haute performance
- **Lucide Icons** - Icônes SVG optimisées et modernes
- **Modern CSS** - Variables, Grid, Flexbox, Glassmorphism
- **Vanilla JS ES6+** - Performance optimisée sans framework
- **Web APIs** - FileReader, Fullscreen, matchMedia

## 🚀 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/creach-t/3d-multiview-platform.git -b ui-redesign
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

## 🎮 Utilisation

### Upload & Configuration
1. **Upload** - Glisser-déposer un fichier .glb ou cliquer pour parcourir
2. **Environment** - Choisir l'éclairage et l'arrière-plan
3. **Scene Controls** - Ajuster position, centrage, wireframe
4. **Export Settings** - Sélectionner plateforme et qualité

### Raccourcis Clavier
- `Ctrl+Shift+T` - Basculer dark/light mode
- `Ctrl+E` - Exporter toutes les vues
- `1-6` - Focus sur viewport spécifique
- `F` - Mode plein écran
- `Tab` - Navigation au clavier

### Interactions Avancées
- **Drag & Drop** - Zone de dépôt avec feedback visuel
- **Ripple Effects** - Sur tous les boutons et interactions
- **Hover Animations** - Feedback immédiat sur tous les éléments
- **Loading States** - Animations et progress bars

## 📁 Structure du Projet

```
3d-multiview-platform/
├── src/
│   ├── css/
│   │   ├── main.css          # Styles principaux + thèmes
│   │   ├── viewport.css      # Styles viewports modernes
│   │   └── controls.css      # Interactions et animations
│   ├── ui/
│   │   └── modern-ui.js      # Gestionnaire UI moderne
│   ├── core/                 # Moteur 3D (inchangé)
│   ├── loaders/              # Import modèles
│   ├── export/               # Export système
│   └── main.js               # Point d'entrée principal
├── public/
│   └── favicon.svg           # Favicon moderne
├── index.html                # Interface moderne
├── UI_REDESIGN.md           # Documentation refonte
└── package.json
```

## 🎨 Design System

### Couleurs
```css
/* Brand Colors */
--primary: #6366f1     /* Indigo principal */
--secondary: #8b5cf6   /* Violet secondaire */
--accent: #06b6d4      /* Cyan accent */
--success: #10b981     /* Vert succès */

/* Gradients */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--gradient-accent: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
```

### Typographie
- **Headers** : Inter 600-800 (titres et navigation)
- **Body** : Inter 400-500 (texte principal)
- **Code** : JetBrains Mono (statistiques et données)

### Espacements
- **xs** : 4px - **sm** : 8px - **md** : 16px
- **lg** : 24px - **xl** : 32px - **2xl** : 48px

## 🔧 Configuration Avancée

### Presets d'Éclairage
- **Studio** : Éclairage diffusé uniforme pour product shots
- **Natural** : Simulation lumière jour réaliste
- **Dramatic** : Éclairage artistique contrasté
- **Technical** : Pour wireframes et plans techniques

### Qualité de Rendu
- **Fast** : Preview temps réel (720p)
- **Standard** : Équilibre qualité/vitesse (1080p)
- **High** : Export professionnel (1920x1920)
- **Ultra** : Qualité maximale (4K)

### Thèmes
- **Dark Mode** : Interface sombre premium (défaut)
- **Light Mode** : Interface claire et moderne
- **Auto** : Suit les préférences système

## 📊 Performance & Compatibilité

### Performance
- **Rendu 60fps** : Animations GPU-accelerated
- **Export rapide** : < 30 secondes pour pack 6 vues
- **Mémoire optimisée** : Support modèles 10M+ polygones
- **Lazy loading** : Chargement progressif des ressources

### Compatibilité
- **Navigateurs modernes** : Chrome 88+, Firefox 85+, Safari 14+
- **Backdrop-filter** : Requis pour effets glassmorphism
- **WebGL 2.0** : Pour rendu 3D optimal
- **ES6+** : Modules natifs supportés

### Accessibilité
- **WCAG 2.1 AA** : Contraste et navigation conformes
- **Screen readers** : ARIA labels et semantic HTML
- **Keyboard navigation** : 100% navigable au clavier
- **Reduced motion** : Respect préférences accessibilité

## 🆕 Migration depuis l'ancienne version

### Compatibilité
✅ **API inchangée** - Tous les scripts existants fonctionnent  
✅ **Fonctionnalités conservées** - Aucune perte de fonctionnalité  
✅ **Performance améliorée** - Rendu plus fluide et rapide  
✅ **Nouveaux raccourcis** - Workflow accéléré  

### Nouvelles fonctionnalités
- **Dark/Light mode** avec persistance localStorage
- **Toast notifications** pour feedback utilisateur
- **Keyboard shortcuts** pour power users
- **Modern animations** et micro-interactions
- **Accessibility** renforcée

## 🤝 Contribution

Les contributions sont les bienvenues ! Cette refonte moderne offre de nombreuses possibilités d'extension :

1. **Fork** le projet depuis la branche `ui-redesign`
2. **Créer** une branche pour votre fonctionnalité
3. **Développer** en respectant le design system
4. **Tester** l'accessibilité et la performance
5. **Soumettre** une Pull Request

### Guidelines
- Respecter les **variables CSS** existantes
- Maintenir la **compatibilité mobile**
- Ajouter des **animations fluides**
- Documenter les **nouvelles fonctionnalités**

## 📄 Licence

MIT - Libre d'utilisation commerciale et personnelle

## 🆘 Support

- **Issues** : [GitHub Issues](https://github.com/creach-t/3d-multiview-platform/issues)
- **Documentation** : Voir `UI_REDESIGN.md` pour détails techniques
- **Discussions** : [GitHub Discussions](https://github.com/creach-t/3d-multiview-platform/discussions)

---

**🎨 Made with ❤️ for the 3D community - Now with Modern UI!**

> Cette refonte transforme la plateforme en une application web moderne et professionnelle, tout en conservant sa puissance technique originale.