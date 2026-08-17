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
     Elements with .reveal fade in the first time they approach the viewport.

     The CSS keeps them visible by default; this only adds an entrance
     animation. That ordering matters: an earlier version hid them with
     opacity:0 and relied on this observer to reveal them, so a deep link to an
     anchor could land a visitor on an apparently blank page. Content is never
     gated on JavaScript now.

     rootMargin expands the bottom of the root so an element is triggered
     shortly BEFORE it scrolls into view. Without that pre-roll the fade would
     start from zero on something the reader can already see, which flickers. */
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
    }, { rootMargin: "0px 0px 240px 0px", threshold: 0 });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* 4. CARD VIDEO PREVIEWS -------------------------------------------------
     Card media with data-video shows its poster image by default and lazily
     creates a muted looping <video>, so no video data is downloaded until
     there is a reason to.

     What counts as a reason depends on the device. With a real pointer, hover
     or keyboard focus is the signal. On touch there is nothing to hover, and
     an earlier version simply skipped previews there, which meant a phone
     visitor — the common case for anyone triaging a portfolio — had no way to
     see any of the games move. Those devices now play a preview when a card
     scrolls well into view, one at a time so only the card being looked at
     ever costs anything.

     Skipped entirely under prefers-reduced-motion, and on connections that
     have asked for less: Save-Data or a 2G-class link gets the posters. */
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var frugal = !!conn && (conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || ""));

  if (!reducedMotion && !frugal) {
    // .card-media is the project grids; .tl-media is a picture on the timeline
    // rail. Same contract either way: a poster, a data-video, and a .playing
    // class the stylesheet cross-fades on.
    var previews = [].slice.call(document.querySelectorAll("[data-video]"))
      .map(function (media) {
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

        return { media: media, play: play, stop: stop };
      });

    if (canHover) {
      previews.forEach(function (p) {
        p.media.addEventListener("pointerenter", p.play);
        p.media.addEventListener("pointerleave", p.stop);
        p.media.addEventListener("focus", p.play);
        p.media.addEventListener("blur", p.stop);
      });
    } else if (previews.length && "IntersectionObserver" in window) {
      // The badge says "hover", which is not true here. Autoplay is its own
      // affordance — the card is already moving — so retire the prompt.
      root.classList.add("previews-in-view");

      // Ratios are tracked rather than a plain isIntersecting flag so that
      // when two cards are on screen at once the one the reader is actually
      // looking at wins, instead of whichever fired its callback last.
      var ratios = new WeakMap();
      var playing = null;

      var pick = function () {
        var best = null;
        previews.forEach(function (p) {
          var r = ratios.get(p.media) || 0;
          if (r >= 0.65 && (!best || r > (ratios.get(best.media) || 0))) best = p;
        });
        if (best === playing) return;
        if (playing) playing.stop();
        playing = best;
        if (playing) playing.play();
      };

      var inView = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          ratios.set(entry.target, entry.intersectionRatio);
        });
        pick();
      }, { threshold: [0, 0.35, 0.65, 0.9] });

      previews.forEach(function (p) { inView.observe(p.media); });

      // A backgrounded tab should not keep decoding video.
      document.addEventListener("visibilitychange", function () {
        if (document.hidden && playing) { playing.stop(); playing = null; }
        else pick();
      });
    }
  }

  /* 4b. ONE ROW, THE REST BEHIND A TOGGLE -----------------------------------
     Buttons with data-show-more="<grid id>" collapse their grid to a single
     row. How many cards that is is not a number worth choosing: the grids are
     auto-fill, so the browser has already decided how many columns fit at this
     width, and hard-coding a count means a wide screen shows a half-empty row
     while a narrow one hides things it had room for. So the count is read back
     out of the computed style instead, and re-read whenever the grid resizes.

     data-more may contain {n}, replaced with however many are actually hidden.
     Without JS the button is hidden and every card is visible. */
  function columnsOf(grid) {
    var tracks = getComputedStyle(grid).gridTemplateColumns;
    // Computed value is used track sizes ("310px 310px 310px"), so counting
    // them is counting columns. "none" means the element is not a grid yet.
    if (!tracks || tracks === "none") return 1;
    return tracks.split(/\s+/).filter(Boolean).length;
  }

  // One column is the case where "as many as fit across" stops meaning
  // anything: there is no horizontal space left to trade, and a section
  // showing a single card over a "show 4 more" button reads as broken rather
  // than as restraint. So a stacked layout gets a floor of two.
  function rowBudget(grid) {
    return Math.max(columnsOf(grid), 2);
  }

  document.querySelectorAll("[data-show-more]").forEach(function (btn) {
    var grid = document.getElementById(btn.getAttribute("data-show-more"));
    if (!grid) return;

    var wrap = btn.parentNode;
    var items = [].slice.call(grid.children);
    var expanded = false;
    var lastWidth = -1;

    function sync() {
      var budget = rowBudget(grid);
      var allFit = items.length <= budget;
      // Widening past the point where everything fits retires the toggle, so
      // it never sits there saying "show fewer" with nothing left to hide.
      if (allFit) expanded = false;

      var visible = expanded || allFit ? items.length : budget;
      items.forEach(function (el, i) { el.hidden = i >= visible; });

      wrap.hidden = allFit;
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded
        ? btn.dataset.less
        : (btn.dataset.more || "").replace("{n}", items.length - budget);
    }

    btn.addEventListener("click", function () {
      expanded = !expanded;
      sync();
      if (!expanded) grid.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });

    // Width only: a ResizeObserver also fires on the height change that
    // showing and hiding cards causes, which would loop.
    var onResize = function () {
      if (grid.clientWidth === lastWidth) return;
      lastWidth = grid.clientWidth;
      sync();
    };

    if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(grid);
    else window.addEventListener("resize", onResize);

    onResize();
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
  // the hero portrait is its own single-image viewer (opens data-full).
  // The LinkedIn post images are not in here: their cards open the post
  // viewer below, which shows every image at full width in context.
  initLightbox(".media-figure img, .gallery img, .feature-cover img, .award-shot img");
  initLightbox(".hero-portrait img");

  /* 4d. LINKEDIN POST VIEWER ------------------------------------------------
     A log card opens into the whole post: author, date, the full message
     with its breaks intact, every image, and a link to the original. Laid
     out the way LinkedIn lays out a post, but in the page's own theme.

     Everything is read back off the .post-card markup and the grid's
     data-author-* attributes, so adding a post to the grid needs no change
     here. Arrows walk the entire log, including the posts still hidden
     behind "Show older posts". */
  (function initPostViewer() {
    var grid = document.getElementById("post-grid");
    if (!grid) return;

    var cards = [].slice.call(grid.querySelectorAll(".post-card"));
    if (!cards.length) return;

    var overlay = null;
    var cardEl, avatarEl, nameEl, headlineEl, dateEl, textEl, mediaEl,
        linkEl, linkLabel, countEl, closeBtn, prevBtn, nextBtn;
    var zoomEl, zoomImg, zoomCaption, zoomCount, zoomPrev, zoomNext, zoomClose;
    var current = 0;
    var zoomAt = -1; // -1 when the enlarged image is closed
    var lastFocused = null;
    var lastTile = null;

    function build() {
      overlay = document.createElement("div");
      overlay.className = "postview" + (cards.length < 2 ? " single" : "");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "LinkedIn post viewer");
      overlay.hidden = true;
      overlay.innerHTML =
        '<span class="postview-count" aria-hidden="true"></span>' +
        '<article class="postview-card">' +
        '  <header class="postview-head">' +
        '    <img class="postview-avatar" alt="" width="96" height="96">' +
        "    <div>" +
        '      <p class="postview-name"></p>' +
        '      <p class="postview-headline"></p>' +
        '      <p class="postview-date">' +
        '        <svg class="icon" aria-hidden="true"><use href="#i-linkedin"/></svg>' +
        "        <time></time>" +
        "      </p>" +
        "    </div>" +
        "  </header>" +
        '  <p class="postview-text"></p>' +
        '  <div class="postview-media"></div>' +
        '  <footer class="postview-foot">' +
        '    <a class="postview-link" target="_blank" rel="noopener">' +
        '      <span class="postview-link-label"></span>' +
        '      <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>' +
        "    </a>" +
        "  </footer>" +
        "</article>" +
        '<button class="icon-btn postview-prev" type="button" aria-label="Previous post">' +
        '  <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' +
        "</button>" +
        '<button class="icon-btn postview-next" type="button" aria-label="Next post">' +
        '  <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' +
        "</button>" +
        '<button class="icon-btn postview-close" type="button" aria-label="Close post viewer">' +
        '  <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        "</button>" +
        // Tapping a tile enlarges it over the post rather than opening a
        // second dialog, so there is only ever one thing to escape from.
        '<div class="postview-zoom" hidden>' +
        '  <span class="postview-zoom-count" aria-hidden="true"></span>' +
        '  <figure class="postview-zoom-stage">' +
        '    <img class="postview-zoom-img" alt="">' +
        '    <figcaption class="postview-zoom-caption"></figcaption>' +
        "  </figure>" +
        '  <button class="icon-btn postview-zoom-prev" type="button" aria-label="Previous image">' +
        '    <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' +
        "  </button>" +
        '  <button class="icon-btn postview-zoom-next" type="button" aria-label="Next image">' +
        '    <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' +
        "  </button>" +
        '  <button class="icon-btn postview-zoom-close" type="button" aria-label="Back to the post">' +
        '    <svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        "  </button>" +
        "</div>";
      document.body.appendChild(overlay);

      cardEl = overlay.querySelector(".postview-card");
      avatarEl = overlay.querySelector(".postview-avatar");
      nameEl = overlay.querySelector(".postview-name");
      headlineEl = overlay.querySelector(".postview-headline");
      dateEl = overlay.querySelector(".postview-date time");
      textEl = overlay.querySelector(".postview-text");
      mediaEl = overlay.querySelector(".postview-media");
      linkEl = overlay.querySelector(".postview-link");
      linkLabel = overlay.querySelector(".postview-link-label");
      countEl = overlay.querySelector(".postview-count");
      closeBtn = overlay.querySelector(".postview-close");
      prevBtn = overlay.querySelector(".postview-prev");
      nextBtn = overlay.querySelector(".postview-next");
      zoomEl = overlay.querySelector(".postview-zoom");
      zoomImg = overlay.querySelector(".postview-zoom-img");
      zoomCaption = overlay.querySelector(".postview-zoom-caption");
      zoomCount = overlay.querySelector(".postview-zoom-count");
      zoomPrev = overlay.querySelector(".postview-zoom-prev");
      zoomNext = overlay.querySelector(".postview-zoom-next");
      zoomClose = overlay.querySelector(".postview-zoom-close");

      // The author strip is the same on every post, so it is written once.
      var name = grid.getAttribute("data-author-name") || "";
      var profile = grid.getAttribute("data-author-url");
      nameEl.textContent = name;
      if (profile) {
        nameEl.innerHTML = "";
        var a = document.createElement("a");
        a.href = profile;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = name;
        nameEl.appendChild(a);
      }
      headlineEl.textContent = grid.getAttribute("data-author-headline") || "";
      avatarEl.src = grid.getAttribute("data-author-avatar") || "";
      avatarEl.alt = name ? "Portrait of " + name : "";

      closeBtn.addEventListener("click", close);
      prevBtn.addEventListener("click", function () { show(current - 1); });
      nextBtn.addEventListener("click", function () { show(current + 1); });

      zoomClose.addEventListener("click", closeZoom);
      zoomPrev.addEventListener("click", function () { showZoom(zoomAt - 1); });
      zoomNext.addEventListener("click", function () { showZoom(zoomAt + 1); });
      zoomEl.addEventListener("click", function (e) {
        if (e.target === zoomEl || e.target.classList.contains("postview-zoom-stage")) closeZoom();
      });

      // Tiles are rebuilt on every post, so the click lives on the block.
      mediaEl.addEventListener("click", function (e) {
        var shot = e.target.closest(".postview-shot");
        if (shot) openZoom(tiles().indexOf(shot));
      });
      mediaEl.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var shot = e.target.closest(".postview-shot");
        if (!shot) return;
        e.preventDefault();
        openZoom(tiles().indexOf(shot));
      });

      // Backdrop click closes; clicks inside the post card don't.
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close();
      });

      overlay.addEventListener("keydown", function (e) {
        // The enlarged image is the innermost thing open, so it answers
        // Escape and the arrows first and hands them back when it closes.
        if (zoomAt > -1) {
          if (e.key === "Escape") { e.stopPropagation(); closeZoom(); return; }
          if (e.key === "ArrowLeft") { e.preventDefault(); showZoom(zoomAt - 1); return; }
          if (e.key === "ArrowRight") { e.preventDefault(); showZoom(zoomAt + 1); return; }
        } else {
          if (e.key === "Escape") { close(); return; }
          if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); return; }
          if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); return; }
        }
        if (e.key === "Tab") {
          var ring = zoomAt > -1
            ? [zoomPrev, zoomNext, zoomClose]
            : [linkEl, prevBtn, nextBtn, closeBtn];
          var focusables = ring.filter(function (b) {
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

    function tiles() {
      return [].slice.call(mediaEl.querySelectorAll(".postview-shot"));
    }

    /* The enlarged image. It lives inside the post overlay rather than in a
       dialog of its own, so the post stays open behind it and Escape peels
       one layer at a time. Arrows here walk this post's images, not posts. */
    function showZoom(index) {
      var shots = tiles();
      if (!shots.length) return;
      zoomAt = (index + shots.length) % shots.length;

      var shot = shots[zoomAt];
      var img = shot.querySelector("img");
      zoomImg.src = img.src;
      zoomImg.alt = img.alt || "";
      zoomCaption.textContent = shot.getAttribute("data-caption") || "";
      zoomCount.textContent = (zoomAt + 1) + " / " + shots.length;
      zoomEl.classList.toggle("single", shots.length < 2);
    }

    function openZoom(index) {
      if (index < 0) return;
      lastTile = tiles()[index] || null;
      showZoom(index);
      zoomEl.hidden = false;
      overlay.classList.add("zoomed");
      void zoomEl.offsetWidth;
      zoomEl.classList.add("open");
      zoomClose.focus();
    }

    function closeZoom() {
      if (zoomAt < 0) return;
      zoomAt = -1;
      zoomEl.classList.remove("open");
      overlay.classList.remove("zoomed");
      var done = function () { zoomEl.hidden = true; };
      if (reducedMotion) { done(); } else { setTimeout(done, 200); }
      if (lastTile && lastTile.isConnected) lastTile.focus();
      else closeBtn.focus();
    }

    function show(index) {
      closeZoom();
      current = (index + cards.length) % cards.length;
      var card = cards[current];

      var time = card.querySelector(".post-meta time");
      if (time) {
        dateEl.textContent = "LinkedIn · " + time.textContent.trim();
        dateEl.setAttribute("datetime", time.getAttribute("datetime") || "");
      }

      var text = card.querySelector(".post-text");
      textEl.textContent = text ? text.textContent.trim() : "";

      // Rebuild the media block from the card's own images. They tile into
      // one block rather than stacking, so the count drives the layout; CSS
      // does the rest. No captions, because a caption between two tiles is
      // what stops a pair reading as one image the way LinkedIn shows it.
      mediaEl.innerHTML = "";
      var flag = card.querySelector(".post-flag");
      var images = [].slice.call(card.querySelectorAll(".post-media img"));
      mediaEl.setAttribute("data-count", String(Math.min(images.length, 4)));

      images.forEach(function (img, i) {
        var shot = document.createElement("span");
        shot.className = "postview-shot";
        shot.setAttribute("role", "button");
        shot.setAttribute("tabindex", "0");
        shot.setAttribute(
          "aria-label",
          "Enlarge image" + (images.length > 1 ? " " + (i + 1) + " of " + images.length : "")
        );

        var full = document.createElement("img");
        full.src = img.getAttribute("data-full") || img.currentSrc || img.src;
        // data-caption is the fuller line the card has no room for; it makes
        // a better description here than the card's own short alt.
        full.alt = img.getAttribute("data-caption") || img.alt || "";
        full.loading = "lazy";
        shot.appendChild(full);
        // Kept on the tile so the enlarged view can caption it.
        if (img.getAttribute("data-caption")) {
          shot.setAttribute("data-caption", img.getAttribute("data-caption"));
        }

        // The corner note ("1-minute demo") belongs to the first tile only.
        if (flag && i === 0) {
          var badge = document.createElement("span");
          badge.className = "postview-flag";
          badge.innerHTML = flag.innerHTML;
          shot.appendChild(badge);
        }
        mediaEl.appendChild(shot);
      });

      var source = card.querySelector(".post-link");
      var firstImg = card.querySelector(".post-media img");
      linkEl.href = source ? source.getAttribute("href") : "";
      linkLabel.textContent =
        (firstImg && firstImg.getAttribute("data-link-text")) || "View post on LinkedIn";

      countEl.textContent = (current + 1) + " / " + cards.length;
      cardEl.scrollTop = 0;
    }

    function open(index) {
      if (!overlay) build();
      lastFocused = document.activeElement;
      show(index);
      overlay.hidden = false;
      root.classList.add("postview-open");
      // Force a reflow so the opacity/scale transition actually runs.
      void overlay.offsetWidth;
      overlay.classList.add("open");
      closeBtn.focus();
    }

    function close() {
      closeZoom();
      overlay.classList.remove("open");
      root.classList.remove("postview-open");
      var done = function () { overlay.hidden = true; };
      if (reducedMotion) { done(); } else { setTimeout(done, 300); }
      // A post reached with the arrows can be one the "show older" toggle is
      // still hiding, and focus() on a hidden card goes nowhere, so fall back
      // to the card that opened the viewer.
      var target = lastFocused && lastFocused.offsetParent !== null
        ? lastFocused
        : cards.filter(function (c) { return c.offsetParent !== null; })[0];
      if (target && target.focus) target.focus();
    }

    cards.forEach(function (card, i) {
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      var time = card.querySelector(".post-meta time");
      card.setAttribute(
        "aria-label",
        "Read the full LinkedIn post" + (time ? " from " + time.textContent.trim() : "")
      );

      card.addEventListener("click", function (e) {
        // "Read on LinkedIn" is a real link and stays one.
        if (e.target.closest("a")) return;
        open(i);
      });

      card.addEventListener("keydown", function (e) {
        if (e.target !== card) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(i);
        }
      });
    });
  })();

  /* 4e. PRINT BUTTONS -------------------------------------------------------
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

  /* 6. FOOTER YEAR ----------------------------------------------------------
     Scoped to the footer on purpose. This used to match [data-year] anywhere,
     which is a landmine: any element that legitimately carries a year, such as
     the milestones on the timeline page, had its entire contents replaced with
     the current year. */
  document.querySelectorAll(".site-footer [data-year]").forEach(function (el) {
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

  /* 8. CODE HIGHLIGHTING ----------------------------------------------------
     The breakdown excerpts ship as plain verbatim text in the HTML, so they
     stay correct, copyable and readable with JavaScript off. This layers token
     colouring and per-line wrapping on top.

     It is a deliberately small C# tokeniser, not a parser: these are short,
     known excerpts, and the worst case for a mis-typed token is a wrong colour.
     Order matters in the pattern — comments and strings must win over the
     identifier rule, which is why they come first. */
  var codeBlocks = document.querySelectorAll(".code code");

  if (codeBlocks.length) {
    var CS_KEYWORD = /^(?:if|else|for|foreach|in|while|do|switch|case|default|break|continue|return|new|null|true|false|void|var|int|float|double|bool|string|object|public|private|protected|internal|static|readonly|const|class|struct|enum|interface|this|base|out|ref|using|namespace|override|virtual|abstract|async|await|try|catch|finally|throw)$/;

    // 1: line comment  2: string  3: number  4: identifier
    var CS_TOKEN = /(\/\/[^\n]*)|("(?:\\.|[^"\\])*")|(\b\d+(?:\.\d+)?[fFdDmM]?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;

    var escapeHtml = function (s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    var wrap = function (cls, text) {
      return '<span class="' + cls + '">' + escapeHtml(text) + "</span>";
    };

    var highlightLine = function (line) {
      var out = "";
      var last = 0;
      var m;

      CS_TOKEN.lastIndex = 0;
      while ((m = CS_TOKEN.exec(line)) !== null) {
        out += escapeHtml(line.slice(last, m.index));

        if (m[1]) out += wrap("t-com", m[1]);
        else if (m[2]) out += wrap("t-str", m[2]);
        else if (m[3]) out += wrap("t-num", m[3]);
        else if (CS_KEYWORD.test(m[4])) out += wrap("t-key", m[4]);
        else if (line.charAt(m.index + m[0].length) === "(") {
          // Rider colours a call site differently from the type it sits on:
          // in Mathf.Lerp(...), Mathf is a type and Lerp is a method.
          out += wrap("t-fn", m[4]);
        } else if (/^[A-Z]/.test(m[4])) out += wrap("t-typ", m[4]);
        else out += escapeHtml(m[4]);

        last = m.index + m[0].length;
      }

      return out + escapeHtml(line.slice(last));
    };

    var slug = function (s) {
      return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };

    codeBlocks.forEach(function (block, blockIndex) {
      var source = block.textContent;

      // Split only so the comment rule can be line-anchored, then rejoin with
      // the original newlines. The .cl wrappers stay INLINE and the newlines
      // stay in the text: wrapping each line in a block element instead would
      // drop blank lines from anything the reader copies, because an empty
      // block contributes no text to a selection.
      var lines = source.split("\n");

      for (var i = 0; i < lines.length; i++) {
        // .cl carries the line number, .cl-code is the width-constrained
        // column that keeps a wrapped line from running back under the gutter
        lines[i] =
          '<span class="cl"><span class="cl-code">' +
          highlightLine(lines[i]) +
          "</span></span>";
      }

      block.innerHTML = lines.join("\n");

      var figure = block.closest(".code");
      if (!figure) return;

      var caption = figure.querySelector("figcaption");
      if (!caption) return;

      // Stable anchor so a specific excerpt can be linked in an application
      // email. Derived from the file name, not the DOM order alone.
      if (!figure.id) {
        var fileEl = caption.querySelector(".code-file");
        var base = fileEl ? slug(fileEl.textContent.split("/").pop()) : "excerpt";
        figure.id = "code-" + base + (blockIndex ? "-" + blockIndex : "");
      }

      var lang = document.createElement("span");
      lang.className = "code-lang";
      lang.textContent = "C#";
      caption.appendChild(lang);

      if (!navigator.clipboard) return;

      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "code-copy";
      copy.textContent = "Copy";
      copy.addEventListener("click", function () {
        navigator.clipboard.writeText(source).then(function () {
          copy.textContent = "Copied";
          copy.setAttribute("data-done", "true");
          setTimeout(function () {
            copy.textContent = "Copy";
            copy.removeAttribute("data-done");
          }, 1600);
        });
      });
      caption.appendChild(copy);
    });
  }

  /* 9. BREAKDOWN CONTENTS ---------------------------------------------------
     The case studies run long, and code excerpts made them longer. This builds
     an in-page contents list from the section headings so a reader can skim to
     the system they care about. Generated rather than hand-written in each
     page, so adding a section to a breakdown never means updating a nav by
     hand. Only runs where there is enough to be worth it. */
  var csSections = document.querySelectorAll(".cs-section h2");

  if (csSections.length >= 4) {
    var slugify = function (s) {
      return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };

    var toc = document.createElement("nav");
    toc.className = "cs-toc";
    toc.setAttribute("aria-label", "On this page");

    var heading = document.createElement("h2");
    heading.className = "cs-toc-title";
    heading.textContent = "On this page";
    toc.appendChild(heading);

    var list = document.createElement("ol");
    var tocLinks = [];

    csSections.forEach(function (h, i) {
      if (!h.id) h.id = slugify(h.textContent) || "section-" + i;

      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
      tocLinks.push({ link: a, target: h });
    });

    toc.appendChild(list);

    // Sits after the hero so it reads as a summary of what follows
    var firstSection = document.querySelector(".cs-section");
    if (firstSection && firstSection.parentNode) {
      firstSection.parentNode.insertBefore(toc, firstSection);
    }

    // Mark the section currently being read
    if ("IntersectionObserver" in window) {
      var tocObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            tocLinks.forEach(function (item) {
              item.link.classList.toggle("current", item.target === entry.target);
            });
          });
        },
        { rootMargin: "-15% 0px -70% 0px" }
      );

      tocLinks.forEach(function (item) { tocObserver.observe(item.target); });
    }
  }

  /* 10. PROJECT FILTER ------------------------------------------------------
     Replaces the "show all" collapse. Hiding four of seven projects behind a
     toggle meant the work most likely to match what someone is hiring for was
     the work they never saw. Everything is listed now, and these filters let a
     visitor jump to the kind of problem they care about.

     Groups are curated rather than derived from every tag: the raw tag list
     runs to a dozen entries, most of which nobody filters by. */
  var soloGrid = document.getElementById("solo-grid");

  if (soloGrid) {
    var GROUPS = [
      { label: "All", tags: null },
      { label: "AI & behaviour", tags: ["enemy ai", "stealth ai", "ai navigation", "fsm"] },
      { label: "Multiplayer", tags: ["netcode", "multiplayer"] },
      { label: "Procedural", tags: ["procedural"] },
      { label: "Simulation", tags: ["simulation", "rts"] }
    ];

    var projectSection = document.getElementById("projects");
    // The featured card sits outside the grid, so collect both
    var cards = projectSection
      ? [].slice.call(projectSection.querySelectorAll(".card.project"))
      : [];

    if (cards.length) {
      // How many cards show before the "show more" button: one grid row,
      // however many columns that is at the current width. Unfiltered the
      // featured card sits outside the grid and spans it, so it is a row of
      // its own and the budget is one more than the column count; filtered it
      // collapses in and is just another cell.
      var limitFor = function (filtering) {
        var cols = rowBudget(soloGrid);
        return filtering ? cols : cols + 1;
      };

      var featuredCard = projectSection.querySelector(".project-featured");
      // Remember where the featured card lives so it can be put back
      var featuredHome = featuredCard ? featuredCard.nextElementSibling : null;
      var featuredParent = featuredCard ? featuredCard.parentNode : null;

      var moreBtn = projectSection.querySelector("[data-show-more='solo-grid']");
      var moreWrap = projectSection.querySelector(".show-more-wrap");

      // This module owns the collapse now, so retire the generic toggle by
      // replacing the button with a clone (drops the old listener).
      if (moreBtn) {
        var fresh = moreBtn.cloneNode(true);
        moreBtn.parentNode.replaceChild(fresh, moreBtn);
        moreBtn = fresh;
      }
      soloGrid.classList.add("expanded"); // .project-extra is no longer the gate

      var tagsOf = function (card) {
        return [].slice.call(card.querySelectorAll(".tags li")).map(function (li) {
          return li.textContent.trim().toLowerCase();
        });
      };

      var bar = document.createElement("div");
      bar.className = "filter-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Filter projects");

      var status = document.createElement("p");
      status.className = "filter-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");

      var buttons = [];

      var expanded = false;
      var activeGroup = GROUPS[0];

      var apply = function (group, btn) {
        activeGroup = group;

        var filtering = !!group.tags;

        // Under a filter the featured card is just another result, so it drops
        // its hero treatment and joins the grid. Unfiltered, it goes back.
        if (featuredCard) {
          featuredCard.classList.toggle("is-collapsed", filtering);
          if (filtering) {
            if (featuredCard.parentNode !== soloGrid) soloGrid.insertBefore(featuredCard, soloGrid.firstChild);
          } else if (featuredCard.parentNode !== featuredParent) {
            featuredParent.insertBefore(featuredCard, featuredHome);
          }
        }

        var matches = cards.filter(function (card) {
          return !filtering || tagsOf(card).some(function (t) {
            return group.tags.indexOf(t) !== -1;
          });
        });

        cards.forEach(function (card) { card.hidden = matches.indexOf(card) === -1; });

        // Then collapse the matches down to one row unless expanded
        var limit = limitFor(filtering);
        var overflow = Math.max(0, matches.length - limit);
        // Nothing left to hide means nothing to expand, so drop the state
        // rather than leaving a "show fewer" button over a full list.
        if (!overflow) expanded = false;
        if (!expanded && overflow) {
          matches.slice(limit).forEach(function (card) { card.hidden = true; });
        }

        var visible = expanded || !overflow ? matches.length : limit;

        if (btn) {
          buttons.forEach(function (b) {
            var on = b === btn;
            b.classList.toggle("current", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
          });
        }

        if (moreWrap) moreWrap.hidden = !overflow;
        if (moreBtn && overflow) {
          moreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
          moreBtn.textContent = expanded
            ? "Show fewer"
            : "Show all " + matches.length + (filtering ? " matching projects" : " projects");
        }

        var noun = function (n) { return n === 1 ? "project" : "projects"; };

        status.textContent = filtering
          ? matches.length === 1
            ? "Showing the 1 matching project"
            : "Showing " + visible + " of " + matches.length + " matching projects"
          : "Showing " + visible + " of " + cards.length + " " + noun(cards.length);
      };

      if (moreBtn) {
        moreBtn.addEventListener("click", function () {
          expanded = !expanded;
          apply(activeGroup, null);
          if (!expanded) {
            var top = projectSection.querySelector(".filter-bar");
            if (top) top.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
          }
        });
      }

      GROUPS.forEach(function (group, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-btn";
        btn.textContent = group.label;
        btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        if (i === 0) btn.classList.add("current");
        // Changing filter starts collapsed again, so a switch never dumps
        // an expanded list on the reader
        btn.addEventListener("click", function () {
          expanded = false;
          apply(group, btn);
        });
        buttons.push(btn);
        bar.appendChild(btn);
      });

      var featured = projectSection.querySelector(".project-featured");
      var anchor = featured || soloGrid;
      anchor.parentNode.insertBefore(bar, anchor);
      bar.parentNode.insertBefore(status, bar.nextSibling);

      apply(GROUPS[0], buttons[0]);

      // The row is however many columns fit, so a resize can change it.
      // Width only: hiding and showing cards changes the height, and reacting
      // to that would loop.
      var lastGridWidth = soloGrid.clientWidth;
      var onGridResize = function () {
        if (soloGrid.clientWidth === lastGridWidth) return;
        lastGridWidth = soloGrid.clientWidth;
        apply(activeGroup, null);
      };

      if ("ResizeObserver" in window) new ResizeObserver(onGridResize).observe(soloGrid);
      else window.addEventListener("resize", onGridResize);
    }
  }

  /* 11. CAREER TIMELINE -----------------------------------------------------
     timeline.html only. Turns the vertical list of milestones into a rail that
     runs left to right as the page scrolls down.

     The mechanism is deliberately not scroll hijacking. #timeline is a tall
     empty driver whose height is set here to (stage height + travel distance);
     the stage inside it is position:sticky, so it parks under the header for
     exactly that many pixels while the rail is translated by the same amount.
     Vertical scrolling is never cancelled, so the scrollbar tells the truth
     and wheel, trackpad, touch, space bar and Page Down all keep working.

     Distance along the rail means elapsed time, and what is measured is the
     stride: the distance from one milestone's left edge to the next one's, set
     to TL_PX_PER_MONTH for every month between their dates. Spacing the gaps
     instead of the strides would not work, because a card is 320px wide and
     most of these milestones are a month or two apart, so the cards themselves
     would be most of the distance and the scale would be theirs, not time's.

     Two bounds, both of them geometry rather than taste. A stride can never be
     shorter than a card, or cards would overlap, which puts everything under
     about a month and a half at the same minimum. And a stride is capped, so
     the emptiest stretches stay inside a screen; those runs get month marks
     drawn along the axis, so a long empty stretch reads as time passing rather
     than as a layout mistake. In between, which is most of the rail, the
     spacing is the elapsed time to scale. The one stretch far outside both
     bounds is 2019 to 2022, and that is a labelled .tl-gap element on the page
     saying so rather than a silent compression.

     It only engages where it is an improvement: a wide enough window for a
     320px card to make sense, a tall enough one for a card to fit without
     clipping, and no reduced-motion preference. Everywhere else, and with no
     JavaScript at all, the CSS default vertical list is what renders. */
  var tl = document.getElementById("timeline");

  if (tl) {
    var TL_PX_PER_MONTH = 200;
    var TL_GAP_MIN = 18;      // clearance between two cards at the minimum stride
    var TL_STRIDE_MAX = 1000; // about five months; past that it is dead scrolling
    var TL_RAMP_IN = 320;   // px of travel a card animates in over
    var TL_RAMP_OUT = 280;

    var tlStage = tl.querySelector(".tl-stage");
    var tlViewport = tl.querySelector(".tl-viewport");
    var tlRail = tl.querySelector(".tl-rail");
    var tlItems = Array.prototype.slice.call(tl.querySelectorAll(".tl-item"));
    var tlFill = tl.querySelector("[data-tl-fill]");
    var tlTickBox = tl.querySelector("[data-tl-ticks]");
    var tlScaleBox = tl.querySelector("[data-tl-scale]");
    var tlMonthBox = tl.querySelector("[data-tl-months]");
    var tlReadoutEl = tl.querySelector("[data-tl-readout]");
    var tlYearOut = tl.querySelector("[data-tl-year]");
    var tlLabelOut = tl.querySelector("[data-tl-label]");
    var tlIndexOut = tl.querySelector("[data-tl-index]");
    var tlTotalOut = tl.querySelector("[data-tl-total]");
    var tlSteps = Array.prototype.slice.call(tl.querySelectorAll("[data-tl-step]"));

    var tlPinned = false;
    var tlDistance = 0;
    var tlStickyTop = 0;
    var tlOffsets = [];   // each item's travel offset, cached to avoid reflow
    var tlRaw = [];       // unclamped offsetLeft, for the entry animation
    var tlWidths = [];
    var tlEase = [];      // last --tl-e written, so unchanged frames cost nothing
    var tlTicks = [];
    var tlAt = -1;        // index of the milestone currently being read
    var tlQueued = false;

    var tlWide = window.matchMedia("(min-width: 901px)");

    /* Dates. data-date on every milestone is the one source for both the
       spacing and the scale, so the page never carries a second list of them
       that could drift out of step with the cards. */
    var tlDates = tlItems.map(function (item) {
      var parts = (item.dataset.date || "").split("-");
      return {
        y: +parts[0] || 0,
        m: +parts[1] || 1,
        d: +parts[2] || 1,
        // months since year 0, fractional by day, which is all the precision
        // the layout needs
        t: (+parts[0] || 0) * 12 + (+parts[1] || 1) - 1 + ((+parts[2] || 1) - 1) / 30
      };
    });

    if (tlTotalOut) tlTotalOut.textContent = tlItems.length;

    // A 320px card needs room to sit beside its neighbours, and it needs the
    // height to render without being clipped by its own row. 700 is where the
    // tallest card, its screenshot included, still fits the stage once the
    // header and the bar have taken their share.
    function tlCanPin() {
      return !reducedMotion && tlWide.matches && window.innerHeight >= 700;
    }

    function tlClamp(n, lo, hi) { return n < lo ? lo : (n > hi ? hi : n); }

    /* Travel offset that brings this milestone to the reading position. Not
       flush against the left edge but the rail's own left gutter in from it,
       which is where the very first card sits at rest, so a card arrived at by
       a step, a year marker or the keyboard lands exactly where a card that has
       not been travelled to yet already is.

       offsetLeft is a layout value, so the rail's transform never skews it. */
    function tlLead() {
      return parseFloat(window.getComputedStyle(tlRail).paddingLeft) || 0;
    }
    function tlTravelOf(item) {
      return tlClamp(item.offsetLeft - tlLead(), 0, tlDistance);
    }

    // Page scroll position that produces a given travel offset
    function tlScrollFor(travel) {
      var top = tl.getBoundingClientRect().top + window.pageYOffset;
      return top - tlStickyTop + travel;
    }

    function tlCurrentTravel() {
      return tlClamp(tlStickyTop - tl.getBoundingClientRect().top, 0, tlDistance);
    }

    /* The spacing pass. Everything about the pacing of the rail comes from
       here: the stride from each milestone to the next is the months between
       them times TL_PX_PER_MONTH, and the margin is whatever that leaves over
       once the card itself is paid for. Where a .tl-gap element sits between
       two milestones it is already standing in for that stretch, so the margin
       is left at zero and the element's own width is the space. */
    function tlSpace() {
      // Read every width before writing any margin. A margin cannot change a
      // card's width, so interleaving the two would only buy nineteen forced
      // reflows for nothing.
      var cards = tlItems.map(function (item) { return item.offsetWidth; });

      tlItems.forEach(function (item, i) {
        if (!i) { item.style.marginLeft = ""; return; }

        var prev = item.previousElementSibling;
        if (prev && prev.classList.contains("tl-gap")) {
          item.style.marginLeft = "";
          return;
        }

        var card = cards[i - 1];
        var months = tlDates[i].t - tlDates[i - 1].t;
        var stride = tlClamp(
          months * TL_PX_PER_MONTH, card + TL_GAP_MIN, TL_STRIDE_MAX
        );
        item.style.marginLeft = Math.round(stride - card) + "px";
      });
    }

    function tlUnspace() {
      tlItems.forEach(function (item) {
        item.style.marginLeft = "";
        item.style.removeProperty("--tl-e");
        item.classList.remove("is-current");
      });
      tlEase = [];
    }

    /* Position of an arbitrary date, interpolated along the stride between the
       two milestones either side of it. Both rulers are drawn through here, in
       whichever coordinates they need: the quarter scale in travel offsets, the
       axis month marks in rail offsets. Deriving them from the layout rather
       than from an independent idea of where time should be is what keeps the
       ruler and the thing it measures in agreement. */
    function tlPosForDate(t, at) {
      if (!at.length) return 0;
      if (t <= tlDates[0].t) return at[0];

      for (var i = 1; i < tlDates.length; i++) {
        if (t > tlDates[i].t) continue;
        var span = tlDates[i].t - tlDates[i - 1].t;
        var f = span > 0 ? (t - tlDates[i - 1].t) / span : 0;
        return at[i - 1] + f * (at[i] - at[i - 1]);
      }
      return at[at.length - 1];
    }

    /* Year markers, built from the years already on the milestones so adding a
       card to the page never means editing a second list. */
    function tlBuildTicks() {
      if (tlTicks.length) return;
      var seen = {};

      tlItems.forEach(function (item) {
        var year = item.dataset.year;
        if (!year || seen[year]) return;
        seen[year] = true;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tl-tick";
        btn.textContent = year;
        btn.setAttribute("aria-label", "Jump to " + year);
        btn.addEventListener("click", function () {
          window.scrollTo({ top: tlScrollFor(tlTravelOf(item)), behavior: "smooth" });
        });

        tlTickBox.appendChild(btn);
        tlTicks.push({ el: btn, item: item, year: year });
      });
    }

    /* The quarter scale under the progress bar. It starts at the first
       milestone that is inside the continuously scaled part of the rail, which
       means the first one after the compressed .tl-gap, because marks drawn
       across a compressed stretch would be measuring nothing. */
    function tlBuildScale() {
      if (!tlScaleBox || !tlDistance) return;
      tlScaleBox.textContent = "";

      var from = 0;
      for (var i = 0; i < tlItems.length; i++) {
        var prev = tlItems[i].previousElementSibling;
        if (prev && prev.classList.contains("tl-gap")) { from = i; break; }
      }

      var start = tlDates[from];
      var end = tlDates[tlDates.length - 1];
      var y = start.y;
      var m = 1 + 3 * Math.floor((start.m - 1) / 3);   // back to the quarter start

      while (y * 12 + m - 1 <= end.t) {
        var pos = tlPosForDate(y * 12 + m - 1, tlOffsets);
        if (pos >= tlOffsets[from] - 1) {
          var mark = document.createElement("span");
          mark.className = m === 1 ? "tl-mark tl-mark-year" : "tl-mark";
          mark.style.left = (pos / tlDistance) * 100 + "%";
          tlScaleBox.appendChild(mark);
        }
        m += 3;
        if (m > 12) { m = 1; y++; }
      }
    }

    /* Month marks along the axis, in the stretches long enough to be worth
       measuring. Nothing is drawn where the cards are close together: there the
       cards themselves are the scale, and marks would only collide with the
       dates already printed beside every dot. */
    function tlBuildMonths() {
      if (!tlMonthBox) return;
      tlMonthBox.textContent = "";

      for (var i = 1; i < tlItems.length; i++) {
        var before = tlItems[i].previousElementSibling;
        if (before && before.classList.contains("tl-gap")) continue;

        var from = tlRaw[i - 1] + tlWidths[i - 1];   // trailing edge of the last card
        var to = tlRaw[i];                           // leading edge of this one
        if (to - from < 90) continue;

        for (var m = Math.ceil(tlDates[i - 1].t + 0.02); m < tlDates[i].t; m++) {
          var pos = tlPosForDate(m, tlRaw);
          if (pos < from + 12 || pos > to - 12) continue;

          var mark = document.createElement("span");
          var january = m % 12 === 0;
          mark.className = january ? "tl-mmark tl-mmark-year" : "tl-mmark";
          if (january) mark.dataset.label = m / 12;
          mark.style.left = Math.round(pos) + "px";
          tlMonthBox.appendChild(mark);
        }
      }
    }

    /* How tall the pictures are allowed to be.

       A card has to fit its picture and its whole write-up inside one row of
       the stage, and that row is whatever the window has left once the header
       and the bar have taken their share. The previous version guessed at that
       with a few viewport-height breakpoints and settled on a letterbox strip
       thin enough that a photograph of two people showed neither of them.

       So it is measured instead. The pictures are collapsed to nothing, every
       write-up is measured at its real width, and whatever the tallest one
       leaves over is what the pictures get. Landscape sources share one height,
       so cards still line up; the portrait one is measured separately, because
       it is the shape a portrait needs that made the old crop wrong and it sits
       beside a shorter write-up anyway. */
    function tlShots() {
      if (!tlItems.length) return;

      var portraits = [];
      var landscapes = [];

      tlItems.forEach(function (item) {
        var card = item.querySelector(".tl-card");
        if (!card) return;
        (item.querySelector(".tl-shot-portrait") ? portraits : landscapes)
          .push(card);
      });

      // Collapse first, then measure: with the pictures at zero a card's height
      // is its write-up, which is the one number that does not depend on the
      // answer being computed here.
      tl.style.setProperty("--tl-shot-h", "0px");
      tl.style.setProperty("--tl-shot-h-portrait", "0px");

      var rows = window.getComputedStyle(tlItems[0]).gridTemplateRows.split(" ");
      var room = tlItems[0].clientHeight - (parseFloat(rows[0]) || 70);

      function tallest(cards) {
        return cards.reduce(function (n, card) {
          return Math.max(n, card.offsetHeight);
        }, 0);
      }

      // Bounds, not taste: below the floor a picture is not worth showing, and
      // above the ceiling one picture would be the whole card.
      tl.style.setProperty(
        "--tl-shot-h",
        tlClamp(Math.floor(room - tallest(landscapes)), 96, 236) + "px"
      );
      tl.style.setProperty(
        "--tl-shot-h-portrait",
        tlClamp(Math.floor(room - tallest(portraits)), 130, 330) + "px"
      );
    }

    function tlMeasure() {
      tlStickyTop = parseFloat(window.getComputedStyle(tlStage).top) || 0;

      tlShots();
      tlSpace();
      tlDistance = Math.max(0, tlRail.scrollWidth - tlViewport.clientWidth);

      // A rail that already fits has nothing to travel through
      if (!tlDistance) { tlUnpin(); return; }

      tl.style.height = (tlStage.offsetHeight + tlDistance) + "px";
      tlOffsets = tlItems.map(function (item) { return tlTravelOf(item); });
      tlRaw = tlItems.map(function (item) { return item.offsetLeft; });
      tlWidths = tlItems.map(function (item) { return item.offsetWidth; });
      tlEase = [];

      tlTicks.forEach(function (t) {
        t.el.style.left = (tlTravelOf(t.item) / tlDistance) * 100 + "%";
      });
      tlBuildScale();
      tlBuildMonths();

      tlAt = -1;
      tlUpdate();
    }

    function tlPin() {
      if (tlPinned) return;
      tlPinned = true;
      tl.dataset.mode = "pinned";
      tlBuildTicks();
      tlMeasure();
    }

    function tlUnpin() {
      tlPinned = false;
      delete tl.dataset.mode;
      tl.style.height = "";
      tlRail.style.transform = "";
      tl.style.removeProperty("--tl-shot-h");
      tl.style.removeProperty("--tl-shot-h-portrait");
      tlUnspace();
    }

    /* The scene behind the rail. The milestone being read lights the room: its
       own picture, blown up and blurred to nothing but colour and shape, is
       cross-faded in behind the cards, and the year stands behind that.

       Two layers alternating rather than one layer changing its background,
       because a background-image swap is a cut, and a cut behind a rail that is
       gliding is the one thing that would make the whole page feel cheap. The
       outgoing layer keeps its picture until the incoming one has finished
       arriving, so there is never a frame of empty backdrop between them.

       Everything here is decorative: it is aria-hidden in the markup, it is
       only ever built while pinned, and pinned mode never engages under
       prefers-reduced-motion. */
    var tlSceneLayers = tl.querySelectorAll("[data-tl-scene-layer]");
    var tlSceneYear = tl.querySelector("[data-tl-scene-year]");
    var tlSceneFace = 0;
    var tlSceneSrc = "";
    var tlSceneYearAt = "";

    function tlScene(item) {
      if (!tlSceneLayers.length) return;

      // The card's own picture, or the crest for a milestone that is a course.
      // A card with neither keeps whatever was already lit rather than dropping
      // to a bare background, so the room dims between pictures instead of
      // going out.
      var img = item.querySelector(".tl-media img") || item.querySelector(".tl-crest");
      var src = img ? img.currentSrc || img.src : "";
      if (!src || src === tlSceneSrc) return;

      tlSceneSrc = src;
      tlSceneFace = 1 - tlSceneFace;

      var next = tlSceneLayers[tlSceneFace];
      next.style.backgroundImage = 'url("' + src + '")';
      // Restart the drift so the incoming picture arrives moving. Reading
      // offsetWidth between the two writes is what makes it a new animation
      // rather than a no-op.
      next.classList.remove("is-on");
      void next.offsetWidth;
      next.classList.add("is-on");

      tlSceneLayers[1 - tlSceneFace].classList.remove("is-on");
    }

    function tlSceneYearSet(year) {
      if (!tlSceneYear || year === tlSceneYearAt) return;
      tlSceneYearAt = year;
      tlSceneYear.textContent = year;
      tlSceneYear.classList.remove("is-turning");
      void tlSceneYear.offsetWidth;
      tlSceneYear.classList.add("is-turning");
    }

    function tlReadout(travel) {
      // The year and title describe the leftmost card in the viewport, so the
      // reading line sits just past the middle of one card rather than a
      // fraction of the whole viewport, which would skip the first milestone
      // before the reader had moved at all. Compared against the unclamped
      // offsets, because the last few cards all share the same clamped travel
      // value and would otherwise read as one milestone.
      var probe = travel + (tlWidths[0] || 344) * 0.6;
      var idx = 0;

      if (travel >= tlDistance - 1) {
        // At the end of the travel the rail has stopped but there is still a
        // screen of cards to the right of the reading line, and the last of
        // them is where the reader has actually arrived.
        idx = tlItems.length - 1;
      } else {
        for (var i = 0; i < tlRaw.length; i++) {
          if (tlRaw[i] > probe) break;
          idx = i;
        }
      }
      if (idx === tlAt) return;

      if (tlAt >= 0 && tlItems[tlAt]) tlItems[tlAt].classList.remove("is-current");
      tlAt = idx;

      var item = tlItems[idx];
      item.classList.add("is-current");

      tlYearOut.textContent = item.dataset.year;
      var heading = item.querySelector("h2");
      tlLabelOut.textContent = heading ? heading.textContent.trim() : "";
      if (tlIndexOut) tlIndexOut.textContent = idx + 1;

      tlScene(item);
      tlSceneYearSet(item.dataset.year);

      tlTicks.forEach(function (t) {
        t.el.classList.toggle("current", t.year === item.dataset.year);
      });

      // Restart the readout's animation. Cheap: this runs once per milestone
      // crossed, not once per frame.
      if (tlReadoutEl) {
        tlReadoutEl.classList.remove("is-turning");
        void tlReadoutEl.offsetWidth;
        tlReadoutEl.classList.add("is-turning");
      }
    }

    /* Cards fade and rise into place as they arrive and settle back out as they
       leave, driven straight off the travel position rather than a transition,
       so the motion tracks the scroll exactly and reverses with it. One custom
       property per card, written only when it has actually changed. */
    function tlAnimate(travel) {
      var vw = tlViewport.clientWidth;

      for (var i = 0; i < tlItems.length; i++) {
        var x = tlRaw[i] - travel;
        var inEase = tlClamp((vw - x) / TL_RAMP_IN, 0, 1);
        var outEase = tlClamp((x + tlWidths[i]) / TL_RAMP_OUT, 0, 1);
        var e = Math.round(Math.min(inEase, outEase) * 50) / 50;

        if (tlEase[i] === e) continue;
        tlEase[i] = e;
        tlItems[i].style.setProperty("--tl-e", e);
      }
    }

    function tlUpdate() {
      tlQueued = false;
      if (!tlPinned) return;

      var travel = tlCurrentTravel();
      tlRail.style.transform = "translate3d(" + -travel + "px, 0, 0)";
      tlFill.style.width = (travel / tlDistance) * 100 + "%";
      tlReadout(travel);
      tlAnimate(travel);

      tlSteps.forEach(function (btn) {
        var spent = +btn.dataset.tlStep < 0
          ? travel <= 1
          : travel >= tlDistance - 1;
        if (btn.disabled !== spent) btn.disabled = spent;
      });
    }

    function tlSchedule() {
      if (tlQueued || !tlPinned) return;
      tlQueued = true;
      window.requestAnimationFrame(tlUpdate);
    }

    window.addEventListener("scroll", tlSchedule, { passive: true });

    var tlResizeQueued = false;
    window.addEventListener("resize", function () {
      if (tlResizeQueued) return;
      tlResizeQueued = true;
      window.requestAnimationFrame(function () {
        tlResizeQueued = false;
        tlSettle();
      });
    });

    /* Stepping one milestone at a time. Both buttons move the page rather than
       a scroller of their own, for the same reason the rail is driven off page
       scroll: there is only ever one position to be in. */
    tlSteps.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!tlPinned) return;
        var idx = tlClamp(tlAt + (+btn.dataset.tlStep), 0, tlItems.length - 1);
        window.scrollTo({
          top: tlScrollFor(tlTravelOf(tlItems[idx])),
          behavior: "smooth"
        });
      });
    });

    /* Keyboard. Tabbing into a card that is off to the right would otherwise
       make the browser scroll the clipped viewport to reveal it, which desyncs
       the transform from the page position and strands the reader. Undo that
       scroll and move the page instead, so focus and travel stay in step. */
    tlRail.addEventListener("focusin", function (e) {
      if (!tlPinned) return;
      tlViewport.scrollLeft = 0;

      var item = e.target.closest ? e.target.closest(".tl-item") : null;
      if (!item) return;

      var target = tlTravelOf(item);
      var travel = tlCurrentTravel();
      var offRight = target - travel + item.offsetWidth > tlViewport.clientWidth;

      if (target < travel || offRight) {
        window.scrollTo({ top: tlScrollFor(target), behavior: "instant" });
      }
    });

    // Left and right do nothing on a page that does not scroll sideways, so
    // giving them the timeline costs nothing and is the obvious mapping. One
    // press is one milestone, which is also what the two buttons do.
    document.addEventListener("keydown", function (e) {
      if (!tlPinned) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      // The viewer takes the arrow keys while it is open, and its keydown
      // still bubbles out to here, so the rail has to stand down for it.
      if (document.querySelector("dialog[open]")) return;

      // Only while the stage actually fills the viewport
      var rect = tl.getBoundingClientRect();
      if (rect.top > tlStickyTop + 1 || rect.bottom < window.innerHeight - 1) return;

      e.preventDefault();
      var idx = tlClamp(tlAt + (e.key === "ArrowRight" ? 1 : -1), 0, tlItems.length - 1);
      window.scrollTo({ top: tlScrollFor(tlTravelOf(tlItems[idx])), behavior: "smooth" });
    });

    /* Re-run the whole decision rather than only re-measuring. The first pass
       happens while this script is still parsing, when the web fonts have not
       landed and, in a background or zero-height tab, the viewport may not have
       its real size yet. Anything that changes either the gate or the rail's
       width has to be able to pull it back through here. */
    function tlSettle() {
      if (tlCanPin()) {
        if (tlPinned) tlMeasure();
        else tlPin();
      } else if (tlPinned) {
        tlUnpin();
      }
    }

    tlSettle();
    window.addEventListener("load", tlSettle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tlSettle);
  }

  /* 11b. FULL SIZE VIEWER ---------------------------------------------------
     timeline.html only. Every picture on the rail is shown inside a card that
     has to crop it to fit; this is where one can be looked at whole.

     A native <dialog> opened with showModal, which is what makes the focus
     trap, the Escape key, the inertness of the page behind it and the return
     of focus to the picture that was clicked the browser's job rather than
     four things to get subtly wrong by hand. Where showModal is missing, no
     listener is attached and .has-lightbox is never set, so the pictures never
     claim to open and nothing is broken by promising it. */
  var lb = document.getElementById("tl-lightbox");
  var lbShots = lb ? [].slice.call(document.querySelectorAll("[data-full]")) : [];

  if (lb && lbShots.length && typeof lb.showModal === "function") {
    root.classList.add("has-lightbox");

    var lbImg = lb.querySelector("[data-lb-img]");
    var lbCap = lb.querySelector("[data-lb-cap]");
    var lbFig = lb.querySelector(".lb-figure");
    var lbAt = 0;

    var lbShow = function (i) {
      // Wrapping rather than stopping: this is a gallery of a dozen pictures,
      // not a form, and a dead arrow at either end is only a dead end.
      lbAt = (i + lbShots.length) % lbShots.length;

      var shot = lbShots[lbAt];
      var img = shot.querySelector("img");

      lbImg.src = shot.dataset.full;
      // The card's alt already describes this exact picture, so it is reused
      // rather than written twice and left to drift.
      lbImg.alt = img ? img.alt : "";
      lbCap.textContent = shot.dataset.caption || "";

      // Re-run the arrival animation, so stepping through reads as one picture
      // replacing another rather than a src quietly changing.
      lbFig.style.animation = "none";
      void lbFig.offsetWidth;
      lbFig.style.animation = "";
    };

    lbShots.forEach(function (shot, i) {
      shot.addEventListener("click", function () {
        lbShow(i);
        if (!lb.open) lb.showModal();
      });
    });

    lb.addEventListener("click", function (e) {
      var hit = e.target.closest ? e.target : e.target.parentNode;
      if (hit.closest("[data-lb-close]")) { lb.close(); return; }

      var step = hit.closest("[data-lb-step]");
      if (step) { lbShow(lbAt + (+step.dataset.lbStep)); return; }

      // Anywhere that is not the picture itself closes it, including the
      // backdrop, which reports the dialog as the target.
      if (!hit.closest(".lb-figure")) lb.close();
    });

    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); lbShow(lbAt - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); lbShow(lbAt + 1); }
    });

    // Release the full size photograph once the viewer is shut. Opening always
    // goes through lbShow, so an engine that never fires this only costs one
    // decoded image held longer than it needed to be.
    lb.addEventListener("close", function () { lbImg.removeAttribute("src"); });
  }

  /* 12. ANALYTICS -----------------------------------------------------------
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

    /* Event tracking. Page views alone cannot answer the only questions worth
       asking of this site: does anyone take the CV, does anyone go and play
       the games, does anyone open a breakdown. These are counted as named
       events, and carry nothing about who did it — same no-cookie, no-personal
       -data model as the page counts, so the privacy policy still holds.

       Delegated from the document so links added later are covered too. */
    var countEvent = function (name, title) {
      if (!window.goatcounter || !window.goatcounter.count) return;
      window.goatcounter.count({ path: name, title: title, event: true });
    };

    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest("a") : null;
      if (!link) return;

      var href = link.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#") return;

      // Icon-only links carry their meaning in aria-label, not in text
      var label = (link.textContent.trim() || link.getAttribute("aria-label") || href).slice(0, 40);

      if (/\.pdf$/i.test(href)) {
        var file = href.split("/").pop();
        // Not every PDF is the CV; a project report is a different signal
        if (/cv/i.test(file)) countEvent("cv-download", "CV downloaded: " + file);
        else countEvent("pdf-download", "PDF downloaded: " + file);
      } else if (/itch\.io/i.test(href)) {
        countEvent("play-itch", "Play on itch.io: " + label);
      } else if (/github\.com/i.test(href)) {
        countEvent("view-source", "Source on GitHub: " + href.split("/").pop());
      } else if (/^timeline\.html/.test(href)) {
        countEvent("open-timeline", "Timeline opened");
      } else if (/^(?!https?:)/.test(href) && /-|cv\.html/.test(href) && /\.html$/i.test(href)) {
        countEvent("open-breakdown", "Breakdown opened: " + href.replace(/\.html$/, ""));
      } else if (link.protocol === "mailto:") {
        countEvent("email-click", "Email link clicked");
      }
    });

    // Whether anyone actually takes the code is worth knowing too
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".code-copy") : null;
      if (!btn) return;
      var fig = btn.closest(".code");
      var file = fig && fig.querySelector(".code-file");
      countEvent("copy-code", "Code copied: " + (file ? file.textContent.trim() : "unknown"));
    });

    var contactForm = document.querySelector(".contact-form");
    if (contactForm) {
      contactForm.addEventListener("submit", function () {
        countEvent("contact-submit", "Contact form submitted");
      });
    }
  }
})();
