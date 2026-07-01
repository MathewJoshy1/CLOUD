function parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 40, s: 80, l: 80 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }
  
  function buildGlowVars(glowColor, intensity) {
    const { h, s, l } = parseHSL(glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const vars = {};
    for (let i = 0; i < opacities.length; i++) {
      vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
    }
    return vars;
  }
  
  const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
  const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
  const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];
  
  function buildGradientVars(colors) {
    const vars = {};
    for (let i = 0; i < 7; i++) {
      const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
      vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
    }
    vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
    return vars;
  }
  
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInCubic(x) { return x * x * x; }
  
  function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }) {
    const t0 = performance.now() + delay;
    function tick() {
      const elapsed = performance.now() - t0;
      const t = Math.max(0, Math.min(elapsed / duration, 1));
      if (elapsed >= 0) {
        onUpdate(start + (end - start) * ease(t));
      }
      if (t < 1) requestAnimationFrame(tick);
      else if (onEnd) onEnd();
    }
    setTimeout(() => requestAnimationFrame(tick), delay);
  }
  
  /**
   * Initializes the BorderGlow effect on an element.
   * @param {HTMLElement} el The target element
   * @param {Object} options Configuration options
   */
  export function initBorderGlow(el, options = {}) {
    const config = {
      edgeSensitivity: 30,
      glowColor: '40 80 80',
      borderRadius: 12,
      glowRadius: 40,
      glowIntensity: 1.0,
      coneSpread: 25,
      animated: false,
      colors: ['#4F46E5', '#38bdf8', '#818cf8'],
      fillOpacity: 0.5,
      ...options
    };
  
    // Avoid double initialization
    if (el.classList.contains('border-glow-card')) return;
  
    // Add base class
    el.classList.add('border-glow-card');

    // Add the edge-light element
    const edgeLight = document.createElement('span');
    edgeLight.className = 'edge-light';
    el.appendChild(edgeLight);
  
    // Apply styling vars
    el.style.setProperty('--edge-sensitivity', config.edgeSensitivity);
    el.style.setProperty('--border-radius', `${config.borderRadius}px`);
    el.style.setProperty('--glow-padding', `${config.glowRadius}px`);
    el.style.setProperty('--cone-spread', config.coneSpread);
    el.style.setProperty('--fill-opacity', config.fillOpacity);
  
    const glowVars = buildGlowVars(config.glowColor, config.glowIntensity);
    for (const [key, val] of Object.entries(glowVars)) {
      el.style.setProperty(key, val);
    }
  
    const gradientVars = buildGradientVars(config.colors);
    for (const [key, val] of Object.entries(gradientVars)) {
      el.style.setProperty(key, val);
    }
  
    // Logic functions
    const getCenterOfElement = (elem) => {
      const rect = elem.getBoundingClientRect();
      return [rect.width / 2, rect.height / 2];
    };
  
    const getEdgeProximity = (elem, x, y) => {
      const [cx, cy] = getCenterOfElement(elem);
      const dx = x - cx;
      const dy = y - cy;
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    };
  
    const getCursorAngle = (elem, x, y) => {
      const [cx, cy] = getCenterOfElement(elem);
      const dx = x - cx;
      const dy = y - cy;
      if (dx === 0 && dy === 0) return 0;
      const radians = Math.atan2(dy, dx);
      let degrees = radians * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      return degrees;
    };
  
    const handlePointerMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      const edge = getEdgeProximity(el, x, y);
      const angle = getCursorAngle(el, x, y);
  
      el.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
      el.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    };
  
    el.addEventListener('pointermove', handlePointerMove);
  
    // Animation
    if (config.animated) {
      const angleStart = 110;
      const angleEnd = 465;
      el.classList.add('sweep-active');
      el.style.setProperty('--cursor-angle', `${angleStart}deg`);
  
      animateValue({ duration: 500, onUpdate: v => el.style.setProperty('--edge-proximity', v) });
      animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {
        el.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
      }});
      animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {
        el.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
      }});
      animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: 100, end: 0,
        onUpdate: v => el.style.setProperty('--edge-proximity', v),
        onEnd: () => el.classList.remove('sweep-active'),
      });
    }
  }
  
