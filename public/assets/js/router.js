// assets/js/router.js

// ─── View Initializer Registry ────────────────────────────────────────────────
const viewInits = {};

/**
 * Registers a function to run whenever a given view is loaded.
 * @param {string} viewName  e.g. 'sales', 'products'
 * @param {Function} initFn  the initializer to call after loading that view
 */
export function registerViewInit(viewName, initFn) {
  viewInits[viewName] = initFn;
}

// ─── SPA Router ────────────────────────────────────────────────────────────────
export function setupRouter() {
  const app = document.getElementById('app');

  async function loadView(viewId) {
    console.log('Loading view:', viewId);

    // 🔐 Block access if not logged in
    const username = localStorage.getItem('username');
    if (!username && viewId !== 'landing') {
      window.location.replace('landing.html'); // ✅ FIXED: Call it like a method
      return;
    }

    try {
      const response = await fetch(`views/${viewId}.html?no-cache=${Date.now()}`);
      if (!response.ok) throw new Error(`View not found: ${viewId}`);

      const html = await response.text();
      app.innerHTML = html;

      // ✅ Add active class to the loaded section
      const viewSection = app.querySelector('section.view');
      if (viewSection) viewSection.classList.add('active');

      // 🚀 Run the view's init function if registered
      const initFn = viewInits[viewId];
      if (typeof initFn === 'function') {
        initFn();
      }

    } catch (err) {
      console.error(err);
      app.innerHTML = `<p style="color:red;">Failed to load "${viewId}" view.</p>`;
    }
  }

  function navigate() {
    const viewId = location.hash.slice(1) || 'dashboard';
    loadView(viewId);
    history.replaceState({ viewId }, '', `#${viewId}`);
    console.log('Navigating to view:', viewId);
  }

  window.addEventListener('hashchange', navigate);
  window.addEventListener('popstate', () => navigate());

  // ─── Initial load ─────────────────────────────────────────────
  navigate();
}
