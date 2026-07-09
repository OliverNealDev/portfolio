/* ==========================================================================
   oliverneal.dev — behaviour
   Vanilla JS, no dependencies. Everything degrades gracefully:
   the initial theme is applied by a tiny inline script in <head> (to avoid
   a flash of the wrong theme); this file handles interaction only.
     1. Theme toggle          4. Hover video previews on project cards
     2. Mobile navigation     5. Active nav-link highlighting
     3. Scroll-reveal         6. Footer year
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. THEME TOGGLE -------------------------------------------------------
     The inline head script has already set html[data-theme] from
     localStorage or prefers-color-scheme. The button flips and persists it. */
  function applyTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch (e) { /* private mode */ }
    // Keep the browser chrome colour in sync (mobile address bar).
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0e0e11" : "#fafafa");
  }

  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  });

  /* 2. MOBILE NAVIGATION -------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close the panel once a destination is chosen.
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* 3. SCROLL-REVEAL -------------------------------------------------------
     Elements with .reveal fade/slide in the first time they enter the
     viewport. With reduced motion (or no IntersectionObserver) everything
     is shown immediately — the CSS also guards this. */
  var revealEls = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || reducedMotion) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* 4. HOVER VIDEO PREVIEWS ------------------------------------------------
     Card media with data-video shows its poster image by default and lazily
     creates a muted looping <video> on first hover/focus, so no video data
     is downloaded until the visitor shows intent. Skipped entirely under
     prefers-reduced-motion. */
  if (!reducedMotion) {
    document.querySelectorAll(".card-media[data-video]").forEach(function (media) {
      var video = null;

      function play() {
        if (!video) {
          video = document.createElement("video");
          video.className = "card-video";
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.setAttribute("aria-hidden", "true");
          video.src = media.dataset.video;
          media.appendChild(video);
        }
        media.classList.add("playing");
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked — poster stays */ });
      }

      function stop() {
        if (video) video.pause();
        media.classList.remove("playing");
      }

      media.addEventListener("pointerenter", play);
      media.addEventListener("pointerleave", stop);
      media.addEventListener("focus", play);
      media.addEventListener("blur", stop);
    });
  }

  /* 4b. SHOW MORE PROJECTS --------------------------------------------------
     Buttons with data-show-more="<grid id>" toggle the .expanded class on
     that grid; CSS keeps .project-extra cards hidden until then. Without JS
     the button is hidden and every card is visible. */
  document.querySelectorAll("[data-show-more]").forEach(function (btn) {
    var grid = document.getElementById(btn.getAttribute("data-show-more"));
    if (!grid) return;

    btn.addEventListener("click", function () {
      var expanded = grid.classList.toggle("expanded");
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded ? btn.dataset.less : btn.dataset.more;
      if (!expanded) grid.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* 5. ACTIVE NAV LINK ------------------------------------------------------
     On the single-page index, highlight the nav item for the section
     currently in view. No-op on case-study pages (no same-page anchors). */
  var sectionLinks = Array.prototype.filter.call(
    document.querySelectorAll(".site-nav .nav-link"),
    function (a) { return a.getAttribute("href").indexOf("#") === 0; }
  );

  if (sectionLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    sectionLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          sectionLinks.forEach(function (a) { a.classList.remove("active"); });
          link.classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* 6. FOOTER YEAR ---------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
