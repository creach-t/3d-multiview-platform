/**
 * ViewportRatioManager.js - CSS override plus agressif pour forcer ratios
 */

export class ViewportRatioManager {
  constructor() {
    this.styleElement = null;
    this.currentRatio = null;
  }

  /**
   * Force le ratio avec CSS ultra-spécifique
   */
  setExportRatio(aspectRatio) {
    this.currentRatio = aspectRatio;
    this.applyAggressiveCSS(aspectRatio);
    console.log(`📐 Forcing ratio: ${aspectRatio.toFixed(3)} with aggressive CSS`);
  }

  /**
   * CSS ultra-agressif qui override tout
   */
  applyAggressiveCSS(ratio) {
    if (this.styleElement) {
      this.styleElement.remove();
    }

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'viewport-ratio-override';
    
    // CSS ultra-spécifique avec priorité maximale
    this.styleElement.textContent = `
      /* Override TOUT le système de grille */
      .viewport-grid,
      .viewport-grid > *,
      .viewport-container,
      .viewport-container > *,
      .viewport,
      .view-container,
      [class*="viewport"],
      [class*="view"],
      [id*="canvas"] {
        aspect-ratio: ${ratio} !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        flex: none !important;
        grid-template-rows: none !important;
        grid-template-columns: none !important;
      }
      
      /* Force sur TOUS les éléments contenant des canvas */
      canvas {
        aspect-ratio: ${ratio} !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: fill !important;
      }
      
      /* Sélecteurs par ID spécifiques */
      #canvas-front, #canvas-back, #canvas-left, 
      #canvas-right, #canvas-top, #canvas-bottom {
        aspect-ratio: ${ratio} !important;
      }
      
      /* Override parents des canvas */
      #canvas-front:parent, #canvas-back:parent,
      #canvas-left:parent, #canvas-right:parent,
      #canvas-top:parent, #canvas-bottom:parent,
      [id*="front"], [id*="back"], [id*="left"],
      [id*="right"], [id*="top"], [id*="bottom"] {
        aspect-ratio: ${ratio} !important;
        height: auto !important;
      }
      
      /* Force display et layout */
      * {
        box-sizing: border-box !important;
      }
    `;
    
    document.head.appendChild(this.styleElement);
    
    // Force un reflow
    setTimeout(() => {
      document.body.offsetHeight;
    }, 10);
  }

  removeFixedRatio() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    this.currentRatio = null;
    console.log('👁️ Aggressive CSS removed');
  }

  getCurrentRatio() {
    return this.currentRatio;
  }

  isFixedRatioActive() {
    return this.currentRatio !== null;
  }

  /**
   * Debug - force directement sur éléments trouvés
   */
  forceDirectly(ratio) {
    // Trouver TOUS les éléments possibles
    const selectors = [
      'canvas',
      '[id*="canvas"]',
      '.viewport',
      '.view',
      '[class*="viewport"]',
      '[class*="view"]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.setProperty('aspect-ratio', ratio, 'important');
        el.style.setProperty('height', 'auto', 'important');
        if (el.parentElement) {
          el.parentElement.style.setProperty('aspect-ratio', ratio, 'important');
          el.parentElement.style.setProperty('height', 'auto', 'important');
        }
      });
    });
    
    console.log(`🔨 Force applied directly on ${document.querySelectorAll('canvas').length} elements`);
  }
}
