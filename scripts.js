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

const initHeroConstellation = () => {
  const hero = document.getElementById("hero");
  const canvas = document.getElementById("hero-constellation");
  if (!hero || !canvas || !(canvas instanceof HTMLCanvasElement)) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let stars = [];
  let mouseX = -100;
  let mouseY = -100;
  let rafId = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const starDensity = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    return Math.min(140, Math.max(48, Math.floor((w * h) / 9000)));
  };

  const buildStars = (width, height) => {
    const pad = 16;
    const count = starDensity();
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: pad + Math.random() * Math.max(1, width - 2 * pad),
        y: pad + Math.random() * Math.max(1, height - 2 * pad),
      });
    }
    return list;
  };

  const syncCanvasSize = () => {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (w < 1 || h < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = buildStars(w, h);
  };

  const drawStaticStars = () => {
    if (!ctx) return;
    for (const star of stars) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const animateConstellation = () => {
    if (!ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const connectionRadius = 100;

    for (const star of stars) {
      const dist = Math.hypot(star.x - mouseX, star.y - mouseY);
      if (dist < connectionRadius) {
        const opacity = 1 - dist / connectionRadius;
        ctx.strokeStyle = `rgba(147, 197, 253, ${opacity * 0.8})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(star.x, star.y);
        ctx.stroke();

        for (const other of stars) {
          if (other === star) continue;
          const starDist = Math.hypot(star.x - other.x, star.y - other.y);
          const otherMouseDist = Math.hypot(other.x - mouseX, other.y - mouseY);
          if (starDist < 80 && otherMouseDist < connectionRadius) {
            const lineOpacity = (1 - starDist / 80) * opacity * 0.5;
            ctx.strokeStyle = `rgba(147, 197, 253, ${lineOpacity})`;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }
    }

    for (const star of stars) {
      const dist = Math.hypot(star.x - mouseX, star.y - mouseY);
      const isNear = dist < connectionRadius;
      const size = isNear ? 3 : 1.5;
      const opacity = isNear ? 1 : 0.5;

      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
      ctx.fill();

      if (isNear) {
        ctx.fillStyle = `rgba(147, 197, 253, ${0.3 * (1 - dist / connectionRadius)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size + 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    rafId = requestAnimationFrame(animateConstellation);
  };

  const updatePointer = (clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    const inside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;
    if (inside) {
      mouseX = clientX - rect.left;
      mouseY = clientY - rect.top;
    } else {
      mouseX = -100;
      mouseY = -100;
    }
  };

  const onPointerMove = (e) => {
    updatePointer(e.clientX, e.clientY);
  };

  const onPointerLeaveWindow = () => {
    mouseX = -100;
    mouseY = -100;
  };

  const startLoop = () => {
    cancelAnimationFrame(rafId);
    syncCanvasSize();
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (reduceMotion.matches) {
      ctx.clearRect(0, 0, cw, ch);
      drawStaticStars();
      return;
    }
    animateConstellation();
  };

  const ro = new ResizeObserver(() => {
    startLoop();
  });
  ro.observe(hero);

  reduceMotion.addEventListener("change", () => {
    startLoop();
  });

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("blur", onPointerLeaveWindow);
  document.addEventListener("mouseleave", onPointerLeaveWindow);

  startLoop();
};

document.addEventListener("DOMContentLoaded", () => {
  revealOnScroll();
  initInteractiveBackground();
  initHeroConstellation();
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