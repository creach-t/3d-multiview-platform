/**
 * ViewportRatioManager.js - Force les viewports CSS au ratio d'export
 * FIXED: Sélecteurs universels + détection DOM automatique
 */

export class ViewportRatioManager {
  constructor() {
    this.styleElement = null;
    this.currentRatio = null;
    this.foundElements = [];
  }

  /**
   * Détecte automatiquement les containers de viewport
   */
  detectViewportContainers() {
    const containers = [];
    
    // Chercher tous les canvas dans la page
    const canvases = document.querySelectorAll('canvas');
    
    canvases.forEach(canvas => {
      // Le container est le parent du canvas
      let container = canvas.parentElement;
      
      // Si le parent direct est un wrapper, prendre le parent du wrapper
      if (container && container.children.length === 1) {
        container = container.parentElement || container;
      }
      
      if (container && container !== document.body) {
        containers.push(container);
      }
    });
    
    this.foundElements = containers;
    console.log(`🔍 Detected ${containers.length} viewport containers`);
    
    return containers;
  }

  /**
   * Active le ratio fixe pour tous les viewports
   */
  setExportRatio(aspectRatio) {
    this.currentRatio = aspectRatio;
    
    // Détecter les containers
    const containers = this.detectViewportContainers();
    
    if (containers.length === 0) {
      console.warn('⚠️ No viewport containers found!');
      return;
    }
    
    this.applyFixedRatio(aspectRatio, containers);
    console.log(`📐 Viewports fixed to ratio: ${aspectRatio.toFixed(3)} (${containers.length} elements)`);
  }

  /**
   * Applique le ratio CSS avec sélecteurs générés
   */
  applyFixedRatio(ratio, containers) {
    // Supprimer style précédent
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // Créer nouveau style
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'viewport-ratio-override';
    
    // Générer sélecteurs uniques pour chaque container détecté
    const selectors = [];
    
    containers.forEach((container, index) => {
      // Ajouter un ID unique si pas présent
      if (!container.id) {
        container.id = `viewport-container-${index}`;
      }
      selectors.push(`#${container.id}`);
      
      // Ajouter classes si présentes
      if (container.classList.length > 0) {
        container.classList.forEach(cls => {
          selectors.push(`.${cls}`);
        });
      }
    });
    
    // Fallback sélecteurs génériques
    selectors.push(
      '.viewport',
      '.view-container', 
      '.canvas-container',
      '[data-view]'
    );
    
    const selectorString = selectors.join(', ');
    
    this.styleElement.textContent = `
      /* Force aspect ratio on detected containers */
      ${selectorString} {
        aspect-ratio: ${ratio} !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        box-sizing: border-box !important;
      }
      
      /* Ensure canvas fills container */
      ${selectorString} canvas {
        width: 100% !important;
        height: 100% !important;
        object-fit: fill !important;
        display: block !important;
      }
      
      /* Force sur TOUS les containers possibles */
      canvas:not([style*="position: absolute"]) {
        aspect-ratio: ${ratio} !important;
      }
    `;
    
    document.head.appendChild(this.styleElement);
    
    // Log pour debug
    console.log(`📝 Applied CSS selectors: ${selectorString}`);
  }

  /**
   * Restaure les ratios responsives
   */
  removeFixedRatio() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    
    this.currentRatio = null;
    this.foundElements = [];
    console.log('👁️ Viewports restored to responsive');
  }

  /**
   * Force le ratio sur éléments spécifiques
   */
  forceRatioOnElements(elements, ratio) {
    elements.forEach((element, index) => {
      const id = `forced-ratio-${index}`;
      element.id = id;
      
      const style = document.createElement('style');
      style.textContent = `
        #${id} {
          aspect-ratio: ${ratio} !important;
          width: 100% !important;
          height: auto !important;
        }
      `;
      document.head.appendChild(style);
    });
  }

  /**
   * Debug: affiche tous les éléments trouvés
   */
  debugFoundElements() {
    console.log('🔍 Debug viewport detection:');
    
    const canvases = document.querySelectorAll('canvas');
    console.log(`Found ${canvases.length} canvas elements`);
    
    canvases.forEach((canvas, i) => {
      const rect = canvas.getBoundingClientRect();
      const parent = canvas.parentElement;
      
      console.log(`Canvas ${i}:`, {
        size: `${rect.width}x${rect.height}`,
        ratio: (rect.width / rect.height).toFixed(3),
        parent: parent.tagName,
        parentClass: parent.className,
        parentId: parent.id
      });
    });
  }

  /**
   * Obtient le ratio actuel
   */
  getCurrentRatio() {
    return this.currentRatio;
  }

  /**
   * Vérifie si le mode ratio fixe est actif
   */
  isFixedRatioActive() {
    return this.currentRatio !== null;
  }
}
