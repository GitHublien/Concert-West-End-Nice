/* ============================================
   DÎNER-OPÉRA — HÔTEL WEST END
   JavaScript : Parallaxe 3D, Scroll-Stop, Audio
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ========== SCÈNE PARALLAXE — TAPISSERIE + OBJETS EN COUCHES ==========
    const parallaxIntro = document.getElementById('parallax-intro');
    // Tableau dynamique pour pouvoir ajouter des clones
    window.pObjectsList = Array.from(document.querySelectorAll('.p-obj'));
    const pObjects = window.pObjectsList;
    const enterBtn = document.getElementById('enter-btn');

    if (sessionStorage.getItem('introSeen')) {
        parallaxIntro.classList.add('hidden');
    } else {
        let mouseX = 0, mouseY = 0;
        let currentX = 0, currentY = 0;
        const lerpFactor = 0.06; // Interpolation fluide (lerp)

        // Vitesses par couche : plus le layer est élevé, plus ça bouge
        const isMobile = window.innerWidth < 768;
        const speedMul = isMobile ? 0.4 : 1;
        const layerSpeeds = {
            0: 0,                   // fond tapisserie : immobile
            1: 6 * speedMul,        // bougies, assiettes
            2: 14 * speedMul,       // verres, encrier, couverts
            3: 24 * speedMul,       // rubans, masques, partitions, gants
            4: 18 * speedMul,       // cercle opéra (mouvement moyen)
            5: 35 * speedMul        // flous premier plan (bougent le plus)
        };

        // Écoute souris
        parallaxIntro.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        // Écoute tactile
        parallaxIntro.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            mouseX = (touch.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (touch.clientY / window.innerHeight - 0.5) * 2;
        });

        // Boucle d'animation avec lerp (interpolation linéaire)
        function animateParallax() {
            if (parallaxIntro.classList.contains('hidden')) return;

            // Lerp : on ne va pas directement à la position souris,
            // on s'en rapproche de 6% par frame → mouvement très fluide
            currentX += (mouseX - currentX) * lerpFactor;
            currentY += (mouseY - currentY) * lerpFactor;

            window.pObjectsList.forEach(obj => {
                // Ne pas bouger les éléments en train de sortir
                if (obj.className.includes('exit-')) return;
                const layer = parseInt(obj.dataset.layer) || 0;
                const speed = layerSpeeds[layer] || 0;
                const moveX = currentX * speed;
                const moveY = currentY * speed;
                // Conserver la rotation si elle existe (ajoutée par l'éditeur)
                const rot = obj.dataset.rotation || '0';
                obj.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${rot}deg)`;
            });

            // Le texte central bouge aussi, mais modérément
            const title = document.querySelector('.parallax-title');
            if (title) {
                title.style.transform = `translate(calc(-50% + ${currentX * 20}px), calc(-50% + ${currentY * 20}px))`;
            }

            requestAnimationFrame(animateParallax);
        }
        animateParallax();

        // === BOUTON "DÉCOUVRIR" : ENVOL COUCHE PAR COUCHE ===
        enterBtn.addEventListener('click', () => {
            sessionStorage.setItem('introSeen', 'true');

            // Passer en plein écran
            var elem = document.documentElement;
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();

            // 1. Le bouton disparaît d'abord
            enterBtn.style.transition = 'opacity 0.5s ease';
            enterBtn.style.opacity = '0';

            // 2. Pause — on admire la scène
            setTimeout(() => {
                // 3. Le texte s'efface doucement
                const title = document.querySelector('.parallax-title');
                title.style.transition = 'opacity 1.5s ease';
                title.style.opacity = '0';
            }, 800);

            // 4. Envol des objets, couche par couche (du premier plan vers le fond)
            setTimeout(() => {
                // Regrouper les objets par couche
                const layers = {};
                window.pObjectsList.forEach(obj => {
                    const layer = parseInt(obj.dataset.layer) || 0;
                    if (!layers[layer]) layers[layer] = [];
                    layers[layer].push(obj);
                });

                // Trier les couches du plus haut (premier plan) vers le plus bas (fond)
                const sortedLayerKeys = Object.keys(layers).map(Number).sort((a, b) => b - a);

                let totalDelay = 0;
                const delayBetweenLayers = 600; // ms entre chaque couche

                sortedLayerKeys.forEach((layerKey) => {
                    const objs = layers[layerKey];
                    objs.forEach((obj, i) => {
                        const exitDir = obj.dataset.exit || 'fade';
                        // Petit décalage entre les objets d'une même couche
                        setTimeout(() => {
                            obj.classList.add('exit-' + exitDir);
                        }, totalDelay + i * 80);
                    });
                    totalDelay += delayBetweenLayers;
                });

                // Fondu final vers le site après le départ de toutes les couches
                setTimeout(() => {
                    parallaxIntro.classList.add('exiting');
                    setTimeout(() => { parallaxIntro.classList.add('hidden'); }, 1500);
                }, totalDelay + 800);

            }, 2500);
        });
    }

    // ========== PARTICULES DORÉES ==========
    const particlesContainer = document.getElementById('golden-particles');
    if (particlesContainer) {
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.width = (Math.random() * 3 + 1) + 'px';
            p.style.height = p.style.width;
            p.style.animationDuration = (Math.random() * 15 + 10) + 's';
            p.style.animationDelay = (Math.random() * 15) + 's';
            particlesContainer.appendChild(p);
        }
    }

    // ========== NAVIGATION SCROLL ==========
    const nav = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 80);
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // ========== PARALLAXE ==========
    const heroBg = document.querySelector('.hero-parallax-bg');
    const lieuBg = document.querySelector('.lieu-parallax-bg');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (heroBg) heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
        if (lieuBg) {
            const lieuSection = document.getElementById('lieu');
            if (lieuSection) {
                const offset = scrollY - lieuSection.offsetTop;
                if (Math.abs(offset) < window.innerHeight * 2) {
                    lieuBg.style.transform = `translateY(${offset * 0.2}px)`;
                }
            }
        }
    });

    // ========== SCROLL-STOP : ARTISTES FRAME PAR FRAME ==========
    const scrollBlocks = document.querySelectorAll('.scroll-stop-block');

    scrollBlocks.forEach(block => {
        const canvas = block.querySelector('.scroll-stop-canvas');
        const ctx = canvas.getContext('2d');
        const artistInfo = block.querySelector('.artist-info');
        const frameCount = parseInt(block.dataset.frames);
        const basePath = block.dataset.path;
        const ext = block.dataset.ext;
        const images = [];
        let loaded = 0;
        let currentFrame = -1;

        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            const num = String(i).padStart(3, '0');
            img.src = basePath + num + ext;
            img.onload = () => {
                loaded++;
                if (i === 1) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                }
            };
            images.push(img);
        }

        function drawFrame(index) {
            if (index === currentFrame) return;
            if (index < 0) index = 0;
            if (index >= frameCount) index = frameCount - 1;
            if (images[index] && images[index].complete) {
                canvas.width = images[index].width;
                canvas.height = images[index].height;
                ctx.drawImage(images[index], 0, 0);
                currentFrame = index;
            }
        }

        let autoPlaying = false;
        let autoReversing = false;
        let autoFrame = 0;
        let autoAnimId = null;
        let hasPlayed = false;
        let hasReversed = true;

        function autoPlay() {
            if (!autoPlaying) return;
            autoFrame += 0.5;
            const idx = Math.min(Math.floor(autoFrame), frameCount - 1);
            drawFrame(idx);
            if (autoFrame > frameCount * 0.1) artistInfo.classList.add('visible');
            if (idx >= frameCount - 1) {
                autoPlaying = false;
                hasPlayed = true;
                hasReversed = false;
                return;
            }
            autoAnimId = requestAnimationFrame(autoPlay);
        }

        function autoReverse() {
            if (!autoReversing) return;
            autoFrame -= 0.5;
            const idx = Math.max(Math.floor(autoFrame), 0);
            drawFrame(idx);
            if (autoFrame < frameCount * 0.9) artistInfo.classList.remove('visible');
            if (idx <= 0) {
                autoReversing = false;
                hasReversed = true;
                hasPlayed = false;
                return;
            }
            autoAnimId = requestAnimationFrame(autoReverse);
        }

        function stopAnim() {
            autoPlaying = false;
            autoReversing = false;
            if (autoAnimId) cancelAnimationFrame(autoAnimId);
        }

        function onScroll() {
            const rect = block.getBoundingClientRect();
            if (rect.top <= 0 && rect.top > -20 && !hasPlayed && !autoPlaying) {
                stopAnim();
                autoPlaying = true;
                autoReversing = false;
                autoFrame = 0;
                autoPlay();
            }
            if (rect.top > -10 && rect.top < window.innerHeight * 0.3 && hasPlayed && !hasReversed && !autoReversing) {
                stopAnim();
                autoReversing = true;
                autoPlaying = false;
                autoFrame = frameCount - 1;
                artistInfo.classList.add('visible');
                autoReverse();
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
    });

    // ========== ANIMATIONS DE RÉVÉLATION AU SCROLL ==========
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => { entry.target.classList.add('visible'); }, parseInt(delay));
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach(el => revealObserver.observe(el));

    // Audio géré dans audio-player.js séparément

});
