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
  // Touch devices fire pointerenter on tap, which would pull a video down
  // just to navigate away. Previews are for real pointers only.
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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
    // Must stay in step with the mobile-nav breakpoint in styles.css
    // (@media max-width: 900px), or the open state outlives the dropdown.
    var desktop = window.matchMedia("(min-width: 901px)");

    function setNav(open) {
      nav.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    navToggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("open"));
    });

    // Close the panel once a destination is chosen.
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });

    // Escape closes and hands focus back to the button that opened it.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        setNav(false);
        navToggle.focus();
      }
    });

    // Tapping anywhere outside the panel closes it.
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("open")) return;
      if (nav.contains(e.target) || navToggle.contains(e.target)) return;
      setNav(false);
    });

    // Widening past the breakpoint reveals the desktop nav, so drop the
    // open state rather than leaving aria-expanded="true" behind.
    var onDesktop = function (e) { if (e.matches) setNav(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onDesktop);
    else if (desktop.addListener) desktop.addListener(onDesktop);
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
     prefers-reduced-motion or on touch-only devices. */
  if (!reducedMotion && canHover) {
    document.querySelectorAll(".card-media[data-video]").forEach(function (media) {
      var video = null;
      var wanted = false;

      function play() {
        wanted = true;
        if (!video) {
          video = document.createElement("video");
          video.className = "card-video";
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.preload = "auto";
          video.setAttribute("aria-hidden", "true");
          // Only cross-fade once there are frames to show, otherwise a slow
          // connection flashes a black box over the poster.
          video.addEventListener("loadeddata", function () {
            if (wanted) media.classList.add("playing");
          });
          video.src = media.dataset.video;
          media.appendChild(video);
        } else if (video.readyState >= 2) {
          media.classList.add("playing");
        }
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked — poster stays */ });
      }

      function stop() {
        wanted = false;
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
    var stageImg, captionEl, countEl, closeBtn, prevBtn, nextBtn, linkEl, linkLabel;
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
        '  <a class="lightbox-link" target="_blank" rel="noopener" hidden>' +
        '    <span class="lightbox-link-label"></span>' +
        '    <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>' +
        "  </a>" +
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
      linkEl = overlay.querySelector(".lightbox-link");
      linkLabel = overlay.querySelector(".lightbox-link-label");

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
          var focusables = [linkEl, prevBtn, nextBtn, closeBtn].filter(function (b) {
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

      // Source link (e.g. back to the LinkedIn post) when the image has one.
      var link = src.getAttribute("data-link");
      if (link) {
        linkEl.href = link;
        linkLabel.textContent = src.getAttribute("data-link-text") || "View post on LinkedIn";
      }
      linkEl.hidden = !link;
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
  // the hero portrait is its own single-image viewer (opens data-full);
  // the LinkedIn post images browse as their own group, each carrying a
  // caption and a link back to its post.
  initLightbox(".media-figure img, .gallery img, .feature-cover img, .award-shot img");
  initLightbox(".hero-portrait img");
  initLightbox(".post-media img");

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

  /* 7. CONTACT FORM ---------------------------------------------------------
     Progressive enhancement over a plain Formspree POST: without JS the form
     submits normally and Formspree shows its own confirmation page. With JS
     it posts in the background and reports back in place, so the visitor
     never leaves the site. */
  document.querySelectorAll(".contact-form").forEach(function (form) {
    var status = form.querySelector(".form-status");
    if (!status || !window.fetch) return;

    var FALLBACK = "That didn't send. Please email me directly.";

    function say(message, state) {
      status.textContent = message;
      status.className = "form-status" + (state ? " " + state : "");
    }

    function clearInvalid() {
      form.querySelectorAll("[aria-invalid]").forEach(function (el) {
        el.removeAttribute("aria-invalid");
      });
    }

    // Formspree replies with { errors: [{ field, message }] } on a rejected
    // submission, so surface what it actually objected to rather than a
    // generic failure, and flag the field it named.
    function reportErrors(data) {
      if (!data || !data.errors || !data.errors.length) return say(FALLBACK, "error");

      data.errors.forEach(function (err) {
        if (!err.field) return;
        var input = form.querySelector('[name="' + err.field + '"]');
        if (input) input.setAttribute("aria-invalid", "true");
      });

      say(data.errors.map(function (err) { return err.message; }).join(". "), "error");
    }

    form.addEventListener("submit", function (e) {
      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        e.preventDefault();
        say("This form is not connected yet. Email me instead.", "error");
        return;
      }

      e.preventDefault();
      clearInvalid();
      form.classList.add("sending");
      say("Sending…");

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        form.classList.remove("sending");
        if (res.ok) {
          form.reset();
          say("Thanks, that's sent. I'll get back to you.", "ok");
          return;
        }
        return res.json().then(reportErrors, function () { say(FALLBACK, "error"); });
      }).catch(function () {
        form.classList.remove("sending");
        say(FALLBACK, "error");
      });
    });
  });

  /* 8. ANALYTICS ------------------------------------------------------------
     GoatCounter: no cookies, no personal data, nothing to consent to.
     GOATCOUNTER_CODE is the subdomain of the GoatCounter site (the "myname"
     in myname.goatcounter.com). Blank it to switch analytics off entirely:
     while it is empty nothing loads and no third-party request is made.
     Note that count.js ignores localhost, so local runs never show up in
     the stats. */
  var GOATCOUNTER_CODE = "oliverneal04";

  if (GOATCOUNTER_CODE) {
    var gc = document.createElement("script");
    gc.async = true;
    gc.src = "https://gc.zgo.at/count.js";
    gc.setAttribute(
      "data-goatcounter",
      "https://" + GOATCOUNTER_CODE + ".goatcounter.com/count"
    );
    document.head.appendChild(gc);
  }
})();
