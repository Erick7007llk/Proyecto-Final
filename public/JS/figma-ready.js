/** Espera fuentes e imágenes antes de la captura Figma (hash #figmacapture=...) */
(function () {
  if (!location.hash.includes('figmacapture=')) return;

  function markReady() {
    document.documentElement.setAttribute('data-figma-ready', 'true');
  }

  function whenImagesDone() {
    const imgs = Array.from(document.images);
    if (!imgs.length) return Promise.resolve();
    return Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            }
          })
      )
    );
  }

  window.addEventListener('load', () => {
    whenImagesDone().then(() => setTimeout(markReady, 800));
  });
})();
