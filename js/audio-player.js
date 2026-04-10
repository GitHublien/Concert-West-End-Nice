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
        '02': 'audio/02 - Cara sposa - Rinaldo - Händel - Mastering.mp3',
        '03': 'audio/03 - La ci darem la mano - Don Giovanni - Mozart - Mastering.mp3',
        '04': 'audio/04 - La donna è mobile - Rigoletto - Verdi - Mastering.mp3',
        '05': 'audio/05 - Duo des fleurs - Lakmé - Delibes - Mastering.mp3',
        '06': 'audio/06 - Largo al factotum - Le barbier de Séville - Rossini - Mastering.mp3',
        '07': 'audio/07 - Lacrimosa - Requiem - Mozart - Mastering.mp3',
        '08': "audio/08 - Lascia ch'io pianga - Rinaldo - Händel - Mastering.wav",
        '09': 'audio/09 - Au fond du temple saint - Les pêcheurs de perles - Bizet - Mastering.mp3',
        '10': 'audio/10 - Je veux vivre - Roméo et Juliette - Gounod - Mastering.mp3',
        '11': 'audio/11 - Votre toast (Toreador) - Carmen - Bizet - Mastering.mp3',
        '12': 'audio/12 - Va pensiero - Nabucco - Verdi - Mastering.mp3',
        '13': 'audio/13 - Duo de la mouche - Orphée et Euridice - Offenbach - Mastering.mp3',
        '14': "audio/14 - La barcarole - Les contes d'Hoffmann - Offenbach - Mastering.wav",
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

    console.log('Lecteur audio v2 chargé — ' + Object.keys(audioElements).length + ' morceaux préchargés');
});
