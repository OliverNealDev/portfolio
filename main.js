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
      // How many cards show before the "show more" button. Cyber Station is
      // featured and sits outside the grid, so unfiltered this is 3 grid cards
      // beside it; filtered, it collapses in and counts as one of the four.
      var LIMIT = 4;

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

        // Then collapse the matches down to the limit unless expanded
        var overflow = Math.max(0, matches.length - LIMIT);
        if (!expanded && overflow) {
          matches.slice(LIMIT).forEach(function (card) { card.hidden = true; });
        }

        var visible = expanded || !overflow ? matches.length : LIMIT;

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
    }
  }

  /* 11. ANALYTICS -----------------------------------------------------------
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
