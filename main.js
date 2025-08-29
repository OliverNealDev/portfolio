        function throttle(func, limit) {
            let lastFunc;
            let lastRan;
            return function (...args) {
                const context = this;
                if (!lastRan) {
                    func.apply(context, args);
                    lastRan = Date.now();
                } else {
                    clearTimeout(lastFunc);
                    lastFunc = setTimeout(function () {
                        if ((Date.now() - lastRan) >= limit) {
                            func.apply(context, args);
                            lastRan = Date.now();
                        }
                    }, limit - (Date.now() - lastRan));
                }
            }
        }
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;
        function applyTheme(theme) {
            if (theme === 'light') {
                html.classList.add('light-theme');
                if (themeToggle) themeToggle.checked = true;
            } else {
                html.classList.remove('light-theme');
                if (themeToggle) themeToggle.checked = false;
            }
        }
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
        applyTheme(initialTheme);
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                const newTheme = themeToggle.checked ? 'light' : 'dark';
                applyTheme(newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }
        const navLinks = document.querySelectorAll('nav a');
        const sections = document.querySelectorAll('main section');
        const header = document.querySelector('header');
        let headerHeight = header?.offsetHeight || 80;
        const contactLink = document.querySelector('nav a[href="#contact"]');
        function updateHeaderHeight() {
            headerHeight = header?.offsetHeight || 80;
        }
        window.addEventListener('resize', throttle(updateHeaderHeight, 200));
        window.addEventListener('orientationchange', throttle(updateHeaderHeight, 200));
        function changeActiveLink() {
            let currentSectionId = '';
            const scrollPosition = window.scrollY;
            const scrollPositionWithOffset = scrollPosition + headerHeight + 20;
            const bottomOfPageReached = (window.innerHeight + scrollPosition >= document.documentElement.scrollHeight - 50);
            sections.forEach(section => {
                if (section.id && section.offsetTop <= scrollPositionWithOffset) {
                    if ((section.offsetTop + section.offsetHeight) > scrollPositionWithOffset) {
                        currentSectionId = section.id;
                    }
                }
            });
            if (scrollPosition < headerHeight) {
                currentSectionId = 'about';
            }
            navLinks.forEach((link) => {
                link.classList.remove('active-nav');
            });
            if (bottomOfPageReached && contactLink) {
                navLinks.forEach(link => { if (link !== contactLink) link.classList.remove('active-nav'); });
                contactLink.classList.add('active-nav');
            } else {
                let activeLinkFound = false;
                if (currentSectionId) {
                    const activeLink = document.querySelector(`nav a[href="#${currentSectionId}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active-nav');
                        activeLinkFound = true;
                    }
                }
                if (!activeLinkFound && !bottomOfPageReached) {
                    document.querySelector('nav a[href="#about"]')?.classList.add('active-nav');
                }
            }
        }
        let slideIndexes = {};
        let slideshowTimeouts = {};
        function initializeSlideshows() {
            document.querySelectorAll('.slideshow-container').forEach(container => {
                const id = container.id;
                if (!id) {
                    console.error("Slideshow container needs an ID:", container);
                    return;
                }
                slideIndexes[id] = 0;
                showSlides(0, id, false);
                const figures = container.querySelectorAll('figure');
                const infoBox = container.nextElementSibling;
                container.addEventListener('mouseenter', () => pauseSlideshow(id));
                container.addEventListener('mouseleave', () => resumeSlideshow(id));
                if (infoBox?.classList.contains('slideshow-info')) {
                    infoBox.addEventListener('mouseenter', () => pauseSlideshow(id));
                    infoBox.addEventListener('mouseleave', () => resumeSlideshow(id));
                }
                if (figures.length > 1) {
                    slideshowTimeouts[id] = setTimeout(() => autoAdvanceSlides(id), 5000);
                }
                container.querySelectorAll('video').forEach(video => {
                    video.addEventListener('mouseenter', () => {
                        if (video.closest('figure')?.classList.contains('active')) {
                            video.play().catch(e => { });
                        }
                    });
                    video.addEventListener('mouseleave', () => {
                        video.pause();
                    });
                });
                updateSlideshowCaption(id);
            });
        }
        function plusSlides(n, slideshowId, useTransition = false) {
            clearTimeout(slideshowTimeouts[slideshowId]);
            showSlides(slideIndexes[slideshowId] + n, slideshowId, useTransition);
            const container = document.getElementById(slideshowId);
            if (container?.querySelectorAll('figure').length > 1) {
                slideshowTimeouts[slideshowId] = setTimeout(() => autoAdvanceSlides(slideshowId), 8000);
            }
        }
        function autoAdvanceSlides(slideshowId) {
            showSlides(slideIndexes[slideshowId] + 1, slideshowId, true);
            const container = document.getElementById(slideshowId);
            if (container?.querySelectorAll('figure').length > 1) {
                slideshowTimeouts[slideshowId] = setTimeout(() => autoAdvanceSlides(slideshowId), 5000);
            }
        }
        function pauseSlideshow(slideshowId) {
            clearTimeout(slideshowTimeouts[slideshowId]);
        }
        function resumeSlideshow(slideshowId) {
            clearTimeout(slideshowTimeouts[slideshowId]);
            const container = document.getElementById(slideshowId);
            if (container?.querySelectorAll('figure').length > 1) {
                slideshowTimeouts[slideshowId] = setTimeout(() => autoAdvanceSlides(slideshowId), 3000);
            }
        }
        function updateSlideshowCaption(slideshowId) {
            const slideshow = document.getElementById(slideshowId);
            if (!slideshow) return;
            const slides = slideshow.getElementsByTagName('figure');
            const captionDiv = slideshow.nextElementSibling?.querySelector('.slideshow-caption');
            if (!captionDiv) return;
            const currentIndex = slideIndexes[slideshowId] >= 0 ? slideIndexes[slideshowId] : 0;
            if (slides.length > 0 && currentIndex < slides.length) {
                const currentSlide = slides[currentIndex];
                const hiddenCaption = currentSlide?.querySelector('.hidden-caption');
                captionDiv.textContent = hiddenCaption ? hiddenCaption.textContent.trim() : `Item ${currentIndex + 1}`;
            } else {
                captionDiv.textContent = '';
            }
        }
        function showSlides(n, slideshowId, useTransition) {
            const slideshow = document.getElementById(slideshowId);
            if (!slideshow) return;
            const slides = slideshow.getElementsByTagName('figure');
            if (slides.length === 0) return;
            let newIndex = n % slides.length;
            if (newIndex < 0) {
                newIndex += slides.length;
            }
            slideIndexes[slideshowId] = newIndex;
            useTransition ? slideshow.classList.add('fade-transition') : slideshow.classList.remove('fade-transition');
            for (let i = 0; i < slides.length; i++) {
                slides[i].classList.remove('active');
                const video = slides[i].querySelector('video');
                if (video) {
                    video.pause();
                }
            }
            if (slides[slideIndexes[slideshowId]]) {
                slides[slideIndexes[slideshowId]].classList.add('active');
            }
            updateSlideshowCaption(slideshowId);
            const activeVideo = slides[slideIndexes[slideshowId]]?.querySelector('video');
            if (activeVideo && (slideshow.matches(':hover') || slideshow.nextElementSibling?.matches(':hover'))) {
                activeVideo.play().catch(e => { });
            }
        }
        const lightboxOverlay = document.getElementById('lightboxOverlay');
        const lightboxContent = document.getElementById('lightboxContent');
        const lightboxMediaContainer = document.getElementById('lightboxMediaContainer');
        const lightboxVideo = document.getElementById('lightboxVideo');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCaption = document.getElementById('lightboxCaption');
        const lightboxPrev = document.getElementById('lightboxPrev');
        const lightboxNext = document.getElementById('lightboxNext');
        let currentLightboxSlideshowId = null;
        let currentLightboxIndex = 0;
        let currentSlides = [];
        function getSlidesFromSlideshow(slideshowId) {
            const el = document.getElementById(slideshowId);
            return el ? Array.from(el.getElementsByTagName('figure')) : [];
        }
        function openLightbox(slideshowId, index) {
            currentLightboxSlideshowId = slideshowId;
            currentSlides = getSlidesFromSlideshow(slideshowId);
            if (currentSlides.length === 0) return;
            currentLightboxIndex = index;
            updateLightboxContent();
            lightboxOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleLightboxKeys);
        }
        function updateLightboxContent() {
            if (currentSlides.length === 0 || currentLightboxIndex < 0 || currentLightboxIndex >= currentSlides.length) {
                closeLightbox();
                return;
            }
            const currentFigure = currentSlides[currentLightboxIndex];
            if (!currentFigure) return;
            const videoElement = currentFigure.querySelector('video');
            const imgElement = currentFigure.querySelector('img');
            const hiddenCaption = currentFigure.querySelector('.hidden-caption');
            lightboxVideo.style.display = 'none';
            lightboxImage.style.display = 'none';
            lightboxVideo.pause();
            lightboxVideo.removeAttribute('src');
            lightboxImage.removeAttribute('src');
            lightboxVideo.poster = '';
            if (videoElement) {
                const source = videoElement.querySelector('source');
                if (source) {
                    lightboxVideo.src = source.src;
                    lightboxVideo.poster = videoElement.poster || '';
                    lightboxVideo.style.display = 'block';
                    lightboxVideo.load();
                    lightboxVideo.play().catch(e => { });
                }
            }
            else if (imgElement) {
                lightboxImage.src = imgElement.src;
                lightboxImage.alt = imgElement.alt || (hiddenCaption?.textContent || 'Lightbox Image');
                lightboxImage.style.display = 'block';
            }
            lightboxCaption.textContent = hiddenCaption?.textContent.trim() || `Item ${currentLightboxIndex + 1}`;
            const showNav = currentSlides.length > 1;
            lightboxPrev.style.display = showNav ? 'block' : 'none';
            lightboxNext.style.display = showNav ? 'block' : 'none';
        }
        function closeLightbox() {
            lightboxOverlay.style.display = 'none';
            document.body.style.overflow = '';
            lightboxVideo.pause();
            lightboxVideo.removeAttribute('src');
            lightboxImage.removeAttribute('src');
            currentSlides = [];
            currentLightboxSlideshowId = null;
            document.removeEventListener('keydown', handleLightboxKeys);
        }
        function closeLightboxOutside(event) {
            if (event.target === lightboxOverlay) {
                closeLightbox();
            }
        }
        function changeLightboxSlide(n) {
            let newIndex = currentLightboxIndex + n;
            const len = currentSlides.length;
            newIndex = (newIndex % len + len) % len;
            currentLightboxIndex = newIndex;
            updateLightboxContent();
        }
        function handleLightboxKeys(event) {
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowLeft') {
                if (currentSlides.length > 1) changeLightboxSlide(-1);
            } else if (event.key === 'ArrowRight') {
                if (currentSlides.length > 1) changeLightboxSlide(1);
            }
        }
        function revealSections() {
            const reveals = document.querySelectorAll('.reveal');
            const windowHeight = window.innerHeight;
            const elementVisibleThreshold = 100;
            reveals.forEach(el => {
                const elementTop = el.getBoundingClientRect().top;
                if (elementTop < windowHeight - elementVisibleThreshold) {
                    el.classList.add('visible');
                }
            });
        }
        const messageOverlay = document.getElementById('customMessageOverlay');
        const messageTextElement = document.getElementById('customMessageText');
        const messageCloseBtn = document.getElementById('customMessageCloseBtn');
        function showProjectDetailsMessage(projectName) {
            if (!messageOverlay || !messageTextElement) return;
            const message = `Details for the '${projectName}' project have not been formatted into a webpage yet. Please check back later or contact me for more information.`;
            messageTextElement.textContent = message;
            messageOverlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }
        function hideProjectDetailsMessage() {
            if (!messageOverlay) return;
            messageOverlay.classList.remove('visible');
            document.body.style.overflow = '';
        }
        if (messageCloseBtn && messageOverlay) {
            messageCloseBtn.addEventListener('click', hideProjectDetailsMessage);
            messageOverlay.addEventListener('click', (event) => {
                if (event.target === messageOverlay) {
                    hideProjectDetailsMessage();
                }
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && messageOverlay.classList.contains('visible')) {
                    hideProjectDetailsMessage();
                }
            });
        }
        document.addEventListener('DOMContentLoaded', () => {
            updateHeaderHeight();
            initializeSlideshows();
            revealSections();
            changeActiveLink();
        });
        const scrollHandler = throttle(() => {
            revealSections();
            changeActiveLink();
        }, 150);
        window.addEventListener('scroll', scrollHandler);

