/* ============================================
   LECTEUR AUDIO v2 — méthode Concert Croix-Rouge
   Un objet Audio préchargé par morceau
   ============================================ */

window.addEventListener('load', function() {

    var player = document.getElementById('audio-player');
    if (!player) return;

    var titleEl = player.querySelector('.player-title');
    var composerEl = player.querySelector('.player-composer');
    var playPauseBtn = player.querySelector('.player-play-pause');
    var timeEl = player.querySelector('.player-time');
    var closeBtn = player.querySelector('.player-close');
    var progressDiv = player.querySelector('.player-progress');

    // Cacher l'ancienne progress bar
    var oldBar = player.querySelector('.progress-bar');
    if (oldBar) oldBar.style.display = 'none';

    // Créer le seek bar
    var seekBar = document.createElement('input');
    seekBar.type = 'range';
    seekBar.min = 0;
    seekBar.max = 100;
    seekBar.value = 0;
    seekBar.step = 0.1;
    seekBar.id = 'west-end-seek';
    seekBar.style.cssText = 'width:100%;height:6px;cursor:pointer;margin:0;padding:0;-webkit-appearance:none;appearance:none;background:rgba(201,168,76,0.2);border-radius:4px;outline:none;flex:1;';
    progressDiv.insertBefore(seekBar, timeEl);

    // Style du curseur
    var css = document.createElement('style');
    css.textContent = '#west-end-seek::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:#c9a84c;border-radius:50%;cursor:pointer;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.3);}#west-end-seek::-moz-range-thumb{width:14px;height:14px;background:#c9a84c;border-radius:50%;cursor:pointer;border:2px solid #fff;}';
    document.head.appendChild(css);

    // Liste des fichiers — WAV pour compatibilité maximale
    var files = {
        '01': 'audio/01 - Brindisi (Libiamo) - La Traviata - Verdi - Mastering.mp3',
        '02': 'audio/02 - Cara sposa - Rinaldo - Handel - Mastering.mp3',
        '03': 'audio/03 - La ci darem la mano - Don Giovanni - Mozart - Mastering.mp3',
        '04': 'audio/04 - La donna e mobile - Rigoletto - Verdi - Mastering.mp3',
        '05': 'audio/05 - Duo des fleurs - Lakme - Delibes - Mastering.mp3',
        '06': 'audio/06 - Largo al factotum - Le barbier de Seville - Rossini - Mastering.mp3',
        '07': 'audio/07 - Lacrimosa - Requiem - Mozart - Mastering.mp3',
        '08': 'audio/08 - Lascia chio pianga - Rinaldo - Handel - Mastering.mp3',
        '09': 'audio/09 - Au fond du temple saint - Les pecheurs de perles - Bizet - Mastering.mp3',
        '10': 'audio/10 - Je veux vivre - Romeo et Juliette - Gounod - Mastering.mp3',
        '11': 'audio/11 - Votre toast (Toreador) - Carmen - Bizet - Mastering.mp3',
        '12': 'audio/12 - Va pensiero - Nabucco - Verdi - Mastering.mp3',
        '13': 'audio/13 - Duo de la mouche - Orphee et Euridice - Offenbach - Mastering.mp3',
        '14': 'audio/14 - La barcarole - Les contes dHoffmann - Offenbach - Mastering.mp3',
        '15': 'audio/15 - O mio babbino caro - Gianni Schicchi - Puccini - Mastering.mp3',
        '16': 'audio/16 - O sole mio - Di Capua - Mastering-new.mp3'
    };

    // NE PAS précharger — charger au clic seulement
    var audioElements = {};
    for (var id in files) {
        var a = new Audio();
        a.preload = 'none';
        audioElements[id] = a;
    }

    var currentTrack = null;
    var currentAudio = null;
    var isPlaying = false;

    // Fonction seek — EXACTEMENT comme la Croix-Rouge
    function seek(value) {
        if (!currentAudio || !currentAudio.duration) return;
        currentAudio.currentTime = (value / 100) * currentAudio.duration;
    }

    // Seek bar
    seekBar.oninput = function() {
        seek(parseFloat(seekBar.value));
    };

    // Format temps
    function fmt(t) {
        var m = Math.floor(t / 60);
        var s = Math.floor(t % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // Mise à jour affichage — attachée à chaque audio
    function attachEvents(audio) {
        audio.ontimeupdate = function() {
            if (!audio.duration || isNaN(audio.duration)) return;
            if (document.activeElement !== seekBar) {
                seekBar.value = (audio.currentTime / audio.duration) * 100;
            }
            var pct = (audio.currentTime / audio.duration) * 100;
            seekBar.style.background = 'linear-gradient(to right, #c9a84c ' + pct + '%, rgba(201,168,76,0.2) ' + pct + '%)';
            timeEl.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
        };

        audio.onended = function() {
            isPlaying = false;
            playPauseBtn.querySelector('.icon-play').style.display = 'block';
            playPauseBtn.querySelector('.icon-pause').style.display = 'none';
            player.classList.remove('playing');
            seekBar.value = 0;
            seekBar.style.background = 'rgba(201,168,76,0.2)';
            timeEl.textContent = '0:00';
            var all = document.querySelectorAll('.play-btn.playing');
            for (var j = 0; j < all.length; j++) all[j].classList.remove('playing');
        };
    }

    // Attacher les events à tous les audios
    for (var id in audioElements) {
        attachEvents(audioElements[id]);
    }

    // Boutons play du programme
    var btns = document.querySelectorAll('.play-btn');
    for (var i = 0; i < btns.length; i++) {
        (function(btn) {
            var t = btn.getAttribute('data-track');
            if (!audioElements[t]) {
                btn.style.opacity = '0.25';
                btn.style.cursor = 'default';
                return;
            }
            btn.onclick = function() {
                var item = btn.closest('.programme-item');
                var title = item.querySelector('.item-title').textContent.trim();
                var comp = item.querySelector('.item-composer');
                var composer = comp ? comp.textContent : '';

                // Si même morceau en cours → pause/resume
                if (currentTrack === t) {
                    if (isPlaying) {
                        currentAudio.pause();
                        isPlaying = false;
                        btn.classList.remove('playing');
                        player.classList.remove('playing');
                        playPauseBtn.querySelector('.icon-play').style.display = 'block';
                        playPauseBtn.querySelector('.icon-pause').style.display = 'none';
                    } else {
                        currentAudio.play();
                        isPlaying = true;
                        btn.classList.add('playing');
                        player.classList.add('playing');
                        playPauseBtn.querySelector('.icon-play').style.display = 'none';
                        playPauseBtn.querySelector('.icon-pause').style.display = 'block';
                    }
                    return;
                }

                // Nouveau morceau — arrêter l'ancien
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
                var all = document.querySelectorAll('.play-btn.playing');
                for (var j = 0; j < all.length; j++) all[j].classList.remove('playing');

                // Charger et jouer le nouveau
                currentTrack = t;
                currentAudio = audioElements[t];
                currentAudio.src = files[t];
                currentAudio.load();
                currentAudio.play();
                isPlaying = true;

                btn.classList.add('playing');
                player.classList.remove('hidden');
                player.classList.add('playing');
                titleEl.textContent = title;
                composerEl.textContent = composer;
                playPauseBtn.querySelector('.icon-play').style.display = 'none';
                playPauseBtn.querySelector('.icon-pause').style.display = 'block';

                // Reset seek
                seekBar.value = 0;
                seekBar.style.background = 'rgba(201,168,76,0.2)';
            };
        })(btns[i]);
    }

    // Play/Pause global
    playPauseBtn.onclick = function() {
        if (!currentAudio) return;
        if (isPlaying) {
            currentAudio.pause();
            isPlaying = false;
            player.classList.remove('playing');
            playPauseBtn.querySelector('.icon-play').style.display = 'block';
            playPauseBtn.querySelector('.icon-pause').style.display = 'none';
            var all = document.querySelectorAll('.play-btn.playing');
            for (var j = 0; j < all.length; j++) all[j].classList.remove('playing');
        } else {
            currentAudio.play();
            isPlaying = true;
            player.classList.add('playing');
            playPauseBtn.querySelector('.icon-play').style.display = 'none';
            playPauseBtn.querySelector('.icon-pause').style.display = 'block';
            var btn = document.querySelector('.play-btn[data-track="' + currentTrack + '"]');
            if (btn) btn.classList.add('playing');
        }
    };

    // Volume
    var volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.oninput = function() {
            var vol = volumeSlider.value / 100;
            for (var id in audioElements) {
                audioElements[id].volume = vol;
            }
        };
    }

    // Stop
    var stopBtn = document.getElementById('stop-btn');
    if (stopBtn) {
        stopBtn.onclick = function() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            isPlaying = false;
            player.classList.remove('playing');
            playPauseBtn.querySelector('.icon-play').style.display = 'block';
            playPauseBtn.querySelector('.icon-pause').style.display = 'none';
            seekBar.value = 0;
            seekBar.style.background = 'rgba(201,168,76,0.2)';
            timeEl.textContent = '0:00';
            var all = document.querySelectorAll('.play-btn.playing');
            for (var j = 0; j < all.length; j++) all[j].classList.remove('playing');
        };
    }

    // Liste des tracks dans l'ordre pour prev/next
    var trackOrder = Object.keys(files).sort();

    // Next
    var nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.onclick = function() {
            if (!currentTrack) return;
            var idx = trackOrder.indexOf(currentTrack);
            var nextIdx = (idx + 1) % trackOrder.length;
            var nextTrack = trackOrder[nextIdx];
            var btn = document.querySelector('.play-btn[data-track="' + nextTrack + '"]');
            if (btn) btn.click();
        };
    }

    // Prev
    var prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.onclick = function() {
            if (!currentTrack) return;
            // Si on est à plus de 3 secondes, revenir au début du morceau
            if (currentAudio && currentAudio.currentTime > 3) {
                currentAudio.currentTime = 0;
                return;
            }
            var idx = trackOrder.indexOf(currentTrack);
            var prevIdx = (idx - 1 + trackOrder.length) % trackOrder.length;
            var prevTrack = trackOrder[prevIdx];
            var btn = document.querySelector('.play-btn[data-track="' + prevTrack + '"]');
            if (btn) btn.click();
        };
    }

    // Fermer
    closeBtn.onclick = function() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        isPlaying = false;
        currentTrack = null;
        currentAudio = null;
        player.classList.add('hidden');
        player.classList.remove('playing');
        seekBar.value = 0;
        seekBar.style.background = 'rgba(201,168,76,0.2)';
        timeEl.textContent = '0:00';
        var all = document.querySelectorAll('.play-btn.playing');
        for (var j = 0; j < all.length; j++) all[j].classList.remove('playing');
    };

    // ============================================
    // SYSTÈME DE SET — enchaînement automatique
    // ============================================
    var setSize = 0; // 0 = infini
    var setRemaining = 0;
    var autoNext = true;
    var trackOrder = Object.keys(files).sort();
    var ambDelay = 10; // secondes avant que l'ambiance reprenne
    var concertVolume = 1;
    var concertFadeInterval = null;

    var setCountEl = document.getElementById('set-count');
    var setRemainingEl = document.getElementById('set-remaining');
    var autoNextCb = document.getElementById('auto-next');

    // Boutons + et -
    var setPlus = document.getElementById('set-plus');
    var setMinus = document.getElementById('set-minus');

    if (setPlus) setPlus.onclick = function() {
        setSize++;
        setRemaining = setSize;
        setCountEl.textContent = setSize;
        setRemainingEl.textContent = '(reste ' + setRemaining + ')';
    };

    if (setMinus) setMinus.onclick = function() {
        if (setSize > 0) setSize--;
        if (setSize === 0) {
            setCountEl.textContent = '∞';
            setRemainingEl.textContent = '';
        } else {
            setRemaining = setSize;
            setCountEl.textContent = setSize;
            setRemainingEl.textContent = '(reste ' + setRemaining + ')';
        }
    };

    if (autoNextCb) autoNextCb.onchange = function() {
        autoNext = autoNextCb.checked;
    };

    // Boutons délai ambiance
    var delayPlus = document.getElementById('delay-plus');
    var delayMinus = document.getElementById('delay-minus');
    var delayCount = document.getElementById('delay-count');
    if (delayPlus) delayPlus.onclick = function() {
        ambDelay += 5;
        delayCount.textContent = ambDelay;
    };
    if (delayMinus) delayMinus.onclick = function() {
        if (ambDelay > 0) ambDelay -= 5;
        if (ambDelay < 0) ambDelay = 0;
        delayCount.textContent = ambDelay;
    };

    // Fondu d'entrée sur un morceau du concert
    function fadeInConcert(audio) {
        clearInterval(concertFadeInterval);
        audio.volume = 0;
        concertFadeInterval = setInterval(function() {
            if (audio.volume < concertVolume - 0.05) {
                audio.volume = Math.min(concertVolume, audio.volume + 0.05);
            } else {
                audio.volume = concertVolume;
                clearInterval(concertFadeInterval);
                concertFadeInterval = null;
            }
        }, 50); // ~1 seconde de fondu
    }

    // Fondu de sortie sur un morceau du concert (avant la fin)
    function setupFadeOutBeforeEnd(audio) {
        audio.addEventListener('timeupdate', function() {
            if (!audio.duration || isNaN(audio.duration)) return;
            var remaining = audio.duration - audio.currentTime;
            // Fondu de sortie dans les 3 dernières secondes
            if (remaining < 3 && remaining > 0 && !audio.paused) {
                audio.volume = Math.max(0, (remaining / 3) * concertVolume);
            }
        });
    }

    // Appliquer le fondu de sortie à tous les audios
    for (var fid in audioElements) {
        setupFadeOutBeforeEnd(audioElements[fid]);
    }

    // Remplacer le onended de chaque audio pour gérer le set
    function setupSetEnded(audio, trackId) {
        audio.onended = function() {
            isPlaying = false;
            playPauseBtn.querySelector('.icon-play').style.display = 'block';
            playPauseBtn.querySelector('.icon-pause').style.display = 'none';
            player.classList.remove('playing');
            var all = document.querySelectorAll('.play-btn.playing');
            for (var j = 0; j < all.length; j++) all[j].classList.remove('playing');

            // Décrémenter le compteur de set
            if (setSize > 0) {
                setRemaining--;
                if (setRemaining <= 0) {
                    // Set terminé — relancer l'ambiance après le délai
                    setRemainingEl.textContent = '(set terminé — ambiance dans ' + ambDelay + 's)';
                    setTimeout(function() {
                        startAmbiance();
                        setRemainingEl.textContent = '(ambiance en cours)';
                    }, ambDelay * 1000);
                    return;
                }
                setRemainingEl.textContent = '(reste ' + setRemaining + ')';
            }

            // Auto-enchaînement si activé
            if (autoNext) {
                var idx = trackOrder.indexOf(trackId);
                var nextIdx = idx + 1;
                if (nextIdx < trackOrder.length) {
                    var nextTrack = trackOrder[nextIdx];
                    var btn = document.querySelector('.play-btn[data-track="' + nextTrack + '"]');
                    if (btn) {
                        setTimeout(function() { btn.click(); }, 500);
                    }
                } else {
                    // Fin du programme — relancer l'ambiance après le délai
                    setTimeout(function() { startAmbiance(); }, ambDelay * 1000);
                }
            }
        };
    }

    // Réattacher les événements ended avec la gestion de set
    for (var id in audioElements) {
        setupSetEnded(audioElements[id], id);
    }

    // Quand on lance un morceau, réinitialiser le set si nécessaire
    var originalBtnClick = {};
    // (le set se lance au premier morceau cliqué)

    // ============================================
    // LECTEUR AMBIANCE — avec fondu enchaîné
    // ============================================
    var ambAudio = document.getElementById('amb-audio');
    var ambToggle = document.getElementById('amb-toggle');
    var ambControls = document.getElementById('amb-controls');
    var ambPlayBtn = document.getElementById('amb-play');
    var ambSelect = document.getElementById('amb-select');
    var ambVolume = document.getElementById('amb-volume');
    var ambTime = document.getElementById('amb-time');
    var ambPlaying = false;
    var ambTargetVolume = 0.6;
    var ambFadeInterval = null;

    // Toggle le panneau
    if (ambToggle) ambToggle.onclick = function() {
        var visible = ambControls.style.display !== 'none';
        ambControls.style.display = visible ? 'none' : 'flex';
        ambToggle.classList.toggle('active', !visible);
    };

    // Play/Pause ambiance
    if (ambPlayBtn) ambPlayBtn.onclick = function() {
        if (ambPlaying) {
            fadeOutAmbiance();
        } else {
            startAmbiance();
        }
    };

    // Volume
    if (ambVolume) ambVolume.oninput = function() {
        ambTargetVolume = ambVolume.value / 100;
        if (ambPlaying && !ambFadeInterval) {
            ambAudio.volume = ambTargetVolume;
        }
    };

    // Sélection de partie
    if (ambSelect) ambSelect.onchange = function() {
        if (ambPlaying) {
            ambAudio.src = ambSelect.value;
            ambAudio.play();
        }
    };

    // Temps
    if (ambAudio) ambAudio.ontimeupdate = function() {
        if (!ambAudio.duration || isNaN(ambAudio.duration)) return;
        var m = Math.floor(ambAudio.currentTime / 60);
        var s = Math.floor(ambAudio.currentTime % 60);
        ambTime.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    };

    // Quand une partie se termine, passer à la suivante
    if (ambAudio) ambAudio.onended = function() {
        var options = ambSelect.options;
        var idx = ambSelect.selectedIndex;
        if (idx < options.length - 1) {
            ambSelect.selectedIndex = idx + 1;
            ambAudio.src = ambSelect.value;
            ambAudio.play();
        } else {
            // Revenir à la partie 1
            ambSelect.selectedIndex = 0;
            ambPlaying = false;
            ambPlayBtn.textContent = '▶';
            ambPlayBtn.classList.remove('playing');
        }
    };

    // Fondu d'entrée de l'ambiance
    function startAmbiance() {
        if (!ambAudio.src || ambAudio.src === '') {
            ambAudio.src = ambSelect.value;
        }
        ambAudio.volume = 0;
        ambAudio.play();
        ambPlaying = true;
        ambPlayBtn.textContent = '⏸';
        ambPlayBtn.classList.add('playing');

        // Fondu d'entrée sur 3 secondes
        clearInterval(ambFadeInterval);
        ambFadeInterval = setInterval(function() {
            if (ambAudio.volume < ambTargetVolume - 0.02) {
                ambAudio.volume = Math.min(ambTargetVolume, ambAudio.volume + 0.02);
            } else {
                ambAudio.volume = ambTargetVolume;
                clearInterval(ambFadeInterval);
                ambFadeInterval = null;
            }
        }, 60); // 50 steps * 60ms = 3 secondes
    }

    // Fondu de sortie de l'ambiance
    function fadeOutAmbiance(callback) {
        if (!ambPlaying) { if (callback) callback(); return; }
        clearInterval(ambFadeInterval);
        ambFadeInterval = setInterval(function() {
            if (ambAudio.volume > 0.02) {
                ambAudio.volume = Math.max(0, ambAudio.volume - 0.02);
            } else {
                ambAudio.volume = 0;
                ambAudio.pause();
                ambPlaying = false;
                ambPlayBtn.textContent = '▶';
                ambPlayBtn.classList.remove('playing');
                clearInterval(ambFadeInterval);
                ambFadeInterval = null;
                if (callback) callback();
            }
        }, 60);
    }

    // Quand un morceau du concert démarre → couper l'ambiance en fondu
    var origPlayFn = null;
    // Couper l'ambiance IMMÉDIATEMENT (pas de fondu)
    function killAmbiance() {
        clearInterval(ambFadeInterval);
        ambFadeInterval = null;
        if (ambAudio) {
            ambAudio.pause();
            ambAudio.volume = 0;
        }
        ambPlaying = false;
        if (ambPlayBtn) {
            ambPlayBtn.textContent = '▶';
            ambPlayBtn.classList.remove('playing');
        }
    }

    // Quand N'IMPORTE QUEL audio du concert commence à jouer → couper l'ambiance
    // Fondu croisé : ambiance sort en fondu, puis morceau entre en fondu
    function crossfadeToTrack(audio) {
        // D'abord, mettre le morceau en pause et volume 0
        audio.volume = 0;

        if (ambPlaying) {
            // Fondu de sortie rapide de l'ambiance (1 seconde)
            clearInterval(ambFadeInterval);
            ambFadeInterval = setInterval(function() {
                if (ambAudio.volume > 0.05) {
                    ambAudio.volume = Math.max(0, ambAudio.volume - 0.05);
                } else {
                    ambAudio.volume = 0;
                    ambAudio.pause();
                    ambPlaying = false;
                    if (ambPlayBtn) {
                        ambPlayBtn.textContent = '▶';
                        ambPlayBtn.classList.remove('playing');
                    }
                    clearInterval(ambFadeInterval);
                    ambFadeInterval = null;
                    // Maintenant lancer le fondu d'entrée du morceau
                    fadeInConcert(audio);
                }
            }, 50); // 20 steps * 50ms = 1 seconde
        } else {
            // Pas d'ambiance — fondu d'entrée direct
            fadeInConcert(audio);
        }
    }

    for (var tid in audioElements) {
        (function(audio) {
            audio.addEventListener('play', function() {
                // Fondu croisé : ambiance sort, morceau entre
                crossfadeToTrack(audio);
                // Initialiser le compteur de set si nécessaire
                if (setSize > 0 && setRemaining <= 0) {
                    setRemaining = setSize;
                    if (setRemainingEl) setRemainingEl.textContent = '(reste ' + setRemaining + ')';
                }
            });
        })(audioElements[tid]);
    }

    console.log('Lecteur audio v3 chargé — ' + Object.keys(audioElements).length + ' morceaux + ambiance');
});
