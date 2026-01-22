const revealOnScroll = () => {
  const targets = document.querySelectorAll(".section");

  targets.forEach((section) => section.classList.add("reveal-target"));

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  targets.forEach((target) => observer.observe(target));
};

const initInteractiveBackground = () => {
  const layers = document.querySelectorAll(".interactive");
  const gradientLayers = document.querySelectorAll(".gradient-bg");
  if (!layers.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;

  const ease = () => {
    currentX += (targetX - currentX) / 20;
    currentY += (targetY - currentY) / 20;
    const transform = `translate3d(${Math.round(currentX)}px, ${Math.round(
      currentY
    )}px, 0)`;
    layers.forEach((layer) => {
      layer.style.transform = transform;
    });
    requestAnimationFrame(ease);
  };

  const updateTarget = (x, y) => {
    const maxShift = 160;
    const { innerWidth, innerHeight } = window;
    const percentX = (x / innerWidth - 0.5) * 2;
    const percentY = (y / innerHeight - 0.5) * 2;
    targetX = percentX * maxShift;
    targetY = percentY * maxShift;
  };

  const handlePointerMove = (event) => {
    updateTarget(event.clientX, event.clientY);

    const section = event.target.closest(".section");
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    section.style.setProperty("--mouse-x", `${relX}px`);
    section.style.setProperty("--mouse-y", `${relY}px`);
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("mousemove", handlePointerMove, { passive: true });

  updateTarget(window.innerWidth / 2, window.innerHeight / 2);
  gradientLayers.forEach((layer) => {
    layer.style.setProperty("--mouse-x", "50%");
    layer.style.setProperty("--mouse-y", "50%");
  });

  ease();
};

document.addEventListener("DOMContentLoaded", () => {
  revealOnScroll();
  initInteractiveBackground();
});