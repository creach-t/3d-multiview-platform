# Modèles d'exemple

Ce dossier contient des modèles 3D d'exemple pour tester la plateforme.

## 📁 Structure

```
src/assets/models/
├── README.md           # Ce fichier
├── cube.glb           # Cube simple (à ajouter)
├── sphere.glb         # Sphère (à ajouter)
└── teapot.glb         # Théière Utah (à ajouter)
```

## 🎯 Modèles recommandés pour tests

### 1. Cube simple
- **Polygones** : 12 triangles
- **Usage** : Test de base, vérification des vues orthographiques
- **Source** : Généré procéduralement

### 2. Sphère UV
- **Polygones** : ~500 triangles
- **Usage** : Test des matériaux et textures
- **Source** : Sphère subdivisée avec mapping UV

### 3. Théière Utah
- **Polygones** : ~1000 triangles
- **Usage** : Modèle de référence 3D classique
- **Source** : Modèle standard de l'industrie

### 4. Suzanne (Blender Monkey)
- **Polygones** : ~500 triangles
- **Usage** : Test de géométrie complexe
- **Source** : Mascotte Blender

## 📥 Comment ajouter des modèles d'exemple

### Option 1 : Modèles libres de droits

1. **Sketchfab** (Creative Commons)
   - Recherchez des modèles CC0 ou CC BY
   - Téléchargez au format GLB
   - Vérifiez les crédits requis

2. **Poly Haven** (CC0)
   - Modèles 3D gratuits et de haute qualité
   - Format GLTF/GLB disponible
   - Aucune attribution requise

3. **glTF Sample Models**
   - Repository officiel Khronos
   - Modèles de test techniques
   - GitHub : KhronosGroup/glTF-Sample-Models

### Option 2 : Création avec Blender

```python
# Script Blender pour cube simple
import bpy
import bmesh

# Supprimer objets par défaut
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Créer un cube
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.object
cube.name = "TestCube"

# Ajouter matériau simple
material = bpy.data.materials.new(name="CubeMaterial")
material.use_nodes = True
material.node_tree.nodes.clear()

# Node setup
output = material.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
principled = material.node_tree.nodes.new(type='ShaderNodeBsdf')
principled.inputs['Base Color'].default_value = (0.8, 0.2, 0.2, 1.0)

material.node_tree.links.new(principled.outputs['BSDF'], output.inputs['Surface'])
cube.data.materials.append(material)

# Export GLB
bpy.ops.export_scene.gltf(
    filepath="/path/to/cube.glb",
    export_format='GLB',
    use_selection=False
)
```

### Option 3 : Générateurs en ligne

1. **Three.js Editor**
   - Créer des formes primitives
   - Export direct en GLB

2. **Clara.io**
   - Modélisation en ligne
   - Export gratuit en GLTF

3. **Tinkercad**
   - Modélisation simple
   - Export STL puis conversion

## 🔧 Conversion de formats

### Vers GLB/GLTF

```bash
# Avec gltf-pipeline
npm install -g gltf-pipeline
gltf-pipeline -i model.gltf -o model.glb

# Avec Blender (ligne de commande)
blender --background --python convert_to_glb.py

# Avec FBX2glTF
fbx2gltf model.fbx
```

### Optimisation des modèles

```bash
# Compression Draco
gltf-pipeline -i model.glb -o model_compressed.glb -d

# Optimisation générale
gltf-pipeline -i model.glb -o model_optimized.glb --meshopt
```

## 📏 Spécifications techniques

### Tailles recommandées
- **Fichier** : < 50MB pour exemple
- **Polygones** : 1K - 100K triangles
- **Textures** : 1024x1024px max

### Format optimal
```json
{
  "format": "GLB",
  "version": "2.0",
  "compression": "Draco (optionnel)",
  "textures": "1024x1024px max",
  "materials": "PBR Standard"
}
```

## 🎨 Guidelines pour modèles d'exemple

### Géométrie
- **Propre** : Pas de faces dupliquées ou inversées
- **Optimisée** : Triangulation propre
- **Centrée** : Origine au centre du modèle
- **Échelle** : ~2 unités de hauteur/largeur

### Matériaux
- **PBR** : Workflow Metallic/Roughness
- **Couleurs** : Palette cohérente
- **Textures** : Résolution appropriée au détail

### Nommage
```
model_name_polycount.glb

Exemples :
- cube_simple_12tri.glb
- sphere_uv_492tri.glb
- teapot_utah_1024tri.glb
```

## ⚖️ Considérations légales

### Licences acceptées
- **CC0** : Domaine public (préféré)
- **CC BY** : Attribution requise
- **CC BY-SA** : Attribution + partage à l'identique

### À éviter
- Modèles sous copyright
- Assets commerciaux sans licence
- Contenus protégés par marque

### Attribution
Si requis, ajouter dans `credits.md` :
```markdown
## Crédits Modèles

- **cube.glb** : Créé spécialement pour ce projet (CC0)
- **teapot.glb** : Utah Teapot par Martin Newell (Domaine public)
- **suzanne.glb** : Blender Foundation (CC0)
```

## 🚀 Intégration dans l'application

### Chargement automatique
```javascript
// Dans src/main.js
const exampleModels = [
  { name: 'Cube Simple', path: '/assets/models/cube.glb' },
  { name: 'Sphère UV', path: '/assets/models/sphere.glb' },
  { name: 'Théière Utah', path: '/assets/models/teapot.glb' }
];

// Boutons d'exemple dans l'interface
exampleModels.forEach(model => {
  addExampleButton(model.name, model.path);
});
```

### Interface utilisateur
- Boutons "Charger exemple" sous la zone de drop
- Galerie de miniatures cliquables
- Informations sur chaque modèle (polygones, taille)

## 📊 Cas d'usage par modèle

| Modèle | Polygones | Usage Principal | Test |
|--------|-----------|-----------------|------|
| Cube | 12 | Interface de base | Vues orthographiques |
| Sphère | 500 | Matériaux/Textures | Éclairage |
| Théière | 1K | Géométrie complexe | Performance |
| Suzanne | 500 | Forme organique | Export qualité |

---

**Note** : Les modèles ne sont pas inclus dans le repository pour des raisons de taille. Utilisez les ressources ci-dessus pour ajouter vos propres modèles d'exemple.
