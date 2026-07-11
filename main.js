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

  /* 4c. LIGHTBOX ------------------------------------------------------------
     Case-study figures, galleries and feature covers enlarge on click into a
     shared overlay: Esc / backdrop / × to close, arrow keys or edge buttons
     to move through every image on the page. Built lazily on first open,
     keyboard-operable, and it hands focus back where it came from. */
  function initLightbox(selector) {
    var triggers = Array.prototype.slice.call(
      document.querySelectorAll(selector)
    );
    if (!triggers.length) return;

    var overlay = null;
    var stageImg, captionEl, countEl, closeBtn, prevBtn, nextBtn;
    var current = 0;
    var lastFocused = null;

    function captionFor(img) {
      if (img.getAttribute("data-caption")) return img.getAttribute("data-caption");
      var fig = img.closest("figure");
      var cap = fig && fig.querySelector("figcaption");
      return cap ? cap.textContent.trim() : "";
    }

    function build() {
      overlay = document.createElement("div");
      overlay.className = "lightbox" + (triggers.length < 2 ? " single" : "");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Image viewer");
      overlay.hidden = true;
      overlay.innerHTML =
        '<span class="lightbox-count" aria-hidden="true"></span>' +
        '<figure class="lightbox-stage">' +
        '  <img class="lightbox-img" alt="">' +
        '  <figcaption class="lightbox-caption"></figcaption>' +
        "</figure>" +
        '<button class="icon-btn lightbox-prev" type="button" aria-label="Previous image">' +
        '  <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' +
        "</button>" +
        '<button class="icon-btn lightbox-next" type="button" aria-label="Next image">' +
        '  <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' +
        "</button>" +
        '<button class="icon-btn lightbox-close" type="button" aria-label="Close image viewer">' +
        '  <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        "</button>";
      document.body.appendChild(overlay);

      stageImg = overlay.querySelector(".lightbox-img");
      captionEl = overlay.querySelector(".lightbox-caption");
      countEl = overlay.querySelector(".lightbox-count");
      closeBtn = overlay.querySelector(".lightbox-close");
      prevBtn = overlay.querySelector(".lightbox-prev");
      nextBtn = overlay.querySelector(".lightbox-next");

      closeBtn.addEventListener("click", close);
      prevBtn.addEventListener("click", function () { show(current - 1); });
      nextBtn.addEventListener("click", function () { show(current + 1); });

      // Backdrop click closes; clicks on the image / buttons don't.
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay || e.target.classList.contains("lightbox-stage")) close();
      });

      stageImg.addEventListener("load", function () {
        stageImg.classList.remove("loading");
      });

      overlay.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { close(); return; }
        if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); return; }
        // Keep Tab inside the dialog while it is open.
        if (e.key === "Tab") {
          var focusables = [prevBtn, nextBtn, closeBtn].filter(function (b) {
            return b.offsetParent !== null;
          });
          if (!focusables.length) return;
          var first = focusables[0];
          var last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        }
      });
    }

    function show(index) {
      current = (index + triggers.length) % triggers.length;
      var src = triggers[current];
      var full = src.getAttribute("data-full") || src.currentSrc || src.src;
      if (stageImg.getAttribute("src") !== full) {
        stageImg.classList.add("loading");
      }
      stageImg.src = full;
      stageImg.alt = src.alt || "";
      captionEl.textContent = captionFor(src);
      countEl.textContent = (current + 1) + " / " + triggers.length;
    }

    function open(index) {
      if (!overlay) build();
      lastFocused = document.activeElement;
      show(index);
      overlay.hidden = false;
      root.classList.add("lightbox-open");
      // Force a reflow so the opacity/scale transition actually runs.
      void overlay.offsetWidth;
      overlay.classList.add("open");
      closeBtn.focus();
    }

    function close() {
      overlay.classList.remove("open");
      root.classList.remove("lightbox-open");
      var done = function () { overlay.hidden = true; };
      if (reducedMotion) { done(); } else { setTimeout(done, 300); }
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    triggers.forEach(function (img, i) {
      img.classList.add("lightboxable");
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Enlarge image" + (img.alt ? ": " + img.alt : ""));
      img.addEventListener("click", function () { open(i); });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(i);
        }
      });
    });
  }

  // Case-study figures & feature covers share one navigable viewer;
  // the hero portrait is its own single-image viewer (opens data-full).
  initLightbox(".media-figure img, .gallery img, .feature-cover img");
  initLightbox(".hero-portrait img");

  /* 4d. PRINT BUTTONS -------------------------------------------------------
     Any element with [data-print] (the CV page's "Print" action) triggers
     the browser's print dialog. */
  document.querySelectorAll("[data-print]").forEach(function (btn) {
    btn.addEventListener("click", function () { window.print(); });
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
