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
  initPageNavigation();
});

const initPageNavigation = () => {
  const sections = Array.from(document.querySelectorAll(".page-section"));
  const overlay = document.querySelector(".page-transition");
  const main = document.querySelector("main");
  if (!sections.length) return;
  let isTransitioning = false;
  const transitionDuration = 500;

  const restartHeroAnimations = () => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    hero.classList.remove("hero-animate");
    void hero.offsetHeight;
    hero.classList.add("hero-animate");
  };

  const syncMainHeight = (section) => {
    if (!main || !section) return;
    requestAnimationFrame(() => {
      const container = section.querySelector(".container");
      const styles = window.getComputedStyle(section);
      const paddingTop = parseFloat(styles.paddingTop) || 0;
      const paddingBottom = parseFloat(styles.paddingBottom) || 0;
      const contentHeight = container ? container.scrollHeight : section.scrollHeight;
      main.style.height = `${contentHeight + paddingTop + paddingBottom}px`;
    });
  };

  const setActiveSection = (id) => {
    const target = sections.find((section) => section.id === id) || sections[0];
    sections.forEach((section) => {
      if (section === target) return;
      section.classList.remove("is-active");
      section.classList.remove("is-entering");
    });

    target.classList.add("is-active", "is-entering");
    requestAnimationFrame(() => {
      target.classList.remove("is-entering");
    });
    syncMainHeight(target);

    if (target.id === "hero") {
      restartHeroAnimations();
    }
  };

  const setActiveNav = (id) => {
    const links = document.querySelectorAll(".site-nav a");
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const linkId = href.replace("#", "");
      link.classList.toggle("is-current", linkId === id);
    });
  };

  const transitionToSection = (id, instant = false) => {
    if (isTransitioning || !overlay) {
    setActiveSection(id);
    setActiveNav(id);
    window.scrollTo({ top: 0, behavior: "auto" });
      history.replaceState(null, "", `#${id}`);
      return;
    }

    if (instant) {
    setActiveSection(id);
    setActiveNav(id);
    window.scrollTo({ top: 0, behavior: "auto" });
      history.replaceState(null, "", `#${id}`);
      return;
    }

    isTransitioning = true;
    overlay.classList.add("is-active", "is-fading-out");

    setTimeout(() => {
      setActiveSection(id);
      setActiveNav(id);
      window.scrollTo({ top: 0, behavior: "auto" });
      history.replaceState(null, "", `#${id}`);
      overlay.classList.remove("is-fading-out");
      overlay.classList.add("is-fading-in");

      setTimeout(() => {
        overlay.classList.remove("is-fading-in", "is-active");
        isTransitioning = false;
      }, transitionDuration);
    }, transitionDuration);
  };

  const handleNavigate = (hash, instant = false) => {
    const id = hash.replace("#", "") || "hero";
    transitionToSection(id, instant);
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      handleNavigate(href);
    });
  });

  window.addEventListener("hashchange", () => handleNavigate(location.hash));
  handleNavigate(location.hash, true);

  window.addEventListener("resize", () => {
    const active = document.querySelector(".page-section.is-active");
    if (active) {
      syncMainHeight(active);
    }
  });
};