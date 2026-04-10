/* ============================================
   ÉDITEUR v5 — Complet
   E = activer/désactiver
   Glisser = déplacer
   Molette = taille
   R + molette = rotation
   ↑↓ = z-index
   H = cacher/montrer tout sauf sélection
   Suppr = supprimer objet
   Z = restaurer dernier supprimé
   ============================================ */

(function() {
    let editorActive = false;
    let selectedObj = null;
    let dragging = false;
    let startX, startY, origLeft, origTop;
    let savedLeft, savedTop; // position sauvegardée avant clic
    let rotateMode = false;
    let allHidden = false;
    let deletedObjs = [];
    const objGroups = new Map();
    let nextGroupId = 1;
    let multiSelection = [];
    let zoomLevel = 1;
    let zoomMode = false;

    const allObjs = Array.from(document.querySelectorAll('.p-obj'));
    const titleBlock = document.querySelector('.parallax-title');
    if (titleBlock) {
        titleBlock.style.position = 'absolute';
        allObjs.push(titleBlock);
    }

    const objNames = new Map();
    const objVisible = new Map();
    const objRotation = new Map();

    allObjs.forEach((obj, i) => {
        const img = obj.querySelector('img');
        const src = img ? img.src.split('/').pop().split('.')[0] : 'TEXTE';
        const name = src.replace(/-/g, ' ').replace(/\d{12,}/g, '').replace(/Modifi/g, '').trim() || 'TEXTE';
        const short = name.substring(0, 18);
        objNames.set(obj, short);
        objVisible.set(obj, true);
        objRotation.set(obj, 0);
    });

    // Mini barre en haut
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;top:5px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.92);color:#0f0;font-family:monospace;font-size:11px;padding:4px 12px;z-index:99999;border-radius:20px;border:1px solid #333;display:none;white-space:nowrap;';
    panel.innerHTML = `
        <span id="ed-info" style="color:#ff0;margin-right:8px;">ÉDITEUR</span>
        <button id="ed-menu-btn" style="background:none;border:1px solid #555;color:#0f0;cursor:pointer;font-size:10px;padding:2px 8px;border-radius:10px;margin-right:4px;">Menu</button>
        <button id="ed-hide-all" style="background:none;border:1px solid #555;color:#f80;cursor:pointer;font-size:10px;padding:2px 8px;border-radius:10px;margin-right:4px;">Cacher tout</button>
        <button id="ed-copy" style="background:#0f0;color:#000;border:none;padding:3px 10px;cursor:pointer;font-weight:bold;font-size:10px;border-radius:10px;">COPIER</button>
        <button id="ed-help-btn" style="background:none;border:1px solid #555;color:#888;cursor:pointer;font-size:10px;padding:2px 6px;border-radius:10px;margin-left:4px;">?</button>
    `;
    document.body.appendChild(panel);

    // Menu déroulant
    const menu = document.createElement('div');
    menu.style.cssText = 'position:fixed;top:35px;right:10px;background:rgba(0,0,0,0.95);border:1px solid #333;border-radius:8px;padding:8px;width:260px;max-height:70vh;overflow-y:auto;z-index:99999;display:none;font-family:monospace;font-size:11px;color:#0f0;';

    let menuHtml = '<div style="color:#666;font-size:9px;margin-bottom:5px;">Glisser=déplacer | Molette=taille | R+Molette=rotation | H=tout cacher | Suppr=supprimer | Z=restaurer</div>';
    menuHtml += '<div id="ed-layers" style="max-height:50vh;overflow-y:auto;">';

    const layerGroups = {};
    allObjs.forEach((obj, i) => {
        const layer = obj.dataset ? (obj.dataset.layer || 'txt') : 'txt';
        if (!layerGroups[layer]) layerGroups[layer] = [];
        layerGroups[layer].push({ obj, idx: i });
    });

    const layerLabels = { '1': 'Bougies/Assiettes', '2': 'Verres/Couverts', '3': 'Masques/Rubans', '4': 'Cercle opéra', '5': 'Flous premier plan', 'txt': 'Texte' };

    for (const [layer, items] of Object.entries(layerGroups)) {
        menuHtml += `<div style="color:#ff0;font-size:10px;margin:6px 0 2px;border-bottom:1px solid #333;padding-bottom:2px;">
            Layer ${layer} — ${layerLabels[layer] || ''}
            <button class="ed-hide-layer" data-layer="${layer}" style="background:none;border:1px solid #555;color:#0f0;cursor:pointer;font-size:9px;padding:1px 5px;border-radius:8px;float:right;">👁</button>
        </div>`;
        items.forEach(({ obj, idx }) => {
            const name = objNames.get(obj);
            menuHtml += `<div class="ed-row" data-idx="${idx}" style="display:flex;align-items:center;padding:3px 4px;cursor:pointer;border-bottom:1px solid #1a1a1a;">
                <button class="ed-eye" data-idx="${idx}" style="background:none;border:none;color:#0f0;cursor:pointer;font-size:12px;width:20px;">👁</button>
                <button class="ed-del" data-idx="${idx}" style="background:none;border:none;color:#f44;cursor:pointer;font-size:10px;width:16px;">✕</button>
                <button class="ed-dup" data-idx="${idx}" style="background:none;border:none;color:#0ff;cursor:pointer;font-size:12px;width:16px;" title="Dupliquer">+</button>
                <span style="flex:1;color:#ccc;font-size:10px;margin-left:4px;">${name}</span>
                <span class="ed-coords" data-idx="${idx}" style="color:#555;font-size:9px;"></span>
            </div>`;
        });
    }
    menuHtml += '</div>';
    menu.innerHTML = menuHtml;
    document.body.appendChild(menu);

    let menuOpen = false;
    document.getElementById('ed-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        menuOpen = !menuOpen;
        menu.style.display = menuOpen ? 'block' : 'none';
        updateCoords();
    });

    function updateCoords() {
        allObjs.forEach((obj, idx) => {
            const el = document.querySelector(`.ed-coords[data-idx="${idx}"]`);
            if (el) {
                const l = Math.round(parseFloat(obj.style.left) * 10) / 10;
                const t = Math.round(parseFloat(obj.style.top) * 10) / 10;
                const w = Math.round(parseFloat(obj.style.width) * 10) / 10;
                const r = objRotation.get(obj) || 0;
                el.textContent = `${l},${t} ${w}% ${r !== 0 ? r + '°' : ''}`;
            }
        });
    }

    function selectObj(obj) {
        if (selectedObj) selectedObj.style.outline = '';
        selectedObj = obj;
        document.querySelectorAll('.ed-row').forEach(r => r.style.background = '');
        if (obj) {
            obj.style.outline = '2px solid #0f0'; // VERT = sélectionné
            const idx = allObjs.indexOf(obj);
            const row = document.querySelector(`.ed-row[data-idx="${idx}"]`);
            if (row) row.style.background = '#1a3a1a';

            // Montrer les autres membres du groupe en jaune
            const gId = objGroups.get(obj);
            if (gId) {
                allObjs.forEach(o => {
                    if (o !== obj && objGroups.get(o) === gId) {
                        o.style.outline = '2px solid #ff0'; // JAUNE = même groupe
                    }
                });
            }
            const name = objNames.get(obj);
            const l = Math.round(parseFloat(obj.style.left) * 10) / 10;
            const t = Math.round(parseFloat(obj.style.top) * 10) / 10;
            const w = Math.round(parseFloat(obj.style.width) * 10) / 10;
            const r = objRotation.get(obj) || 0;
            document.getElementById('ed-info').innerHTML = `<span style="color:#0f0">${name}</span> L:${l} T:${t} W:${w} R:${r}°`;
        } else {
            document.getElementById('ed-info').textContent = 'ÉDITEUR';
        }
        updateCoords();
    }

    function toggleEditor() {
        editorActive = !editorActive;
        panel.style.display = editorActive ? 'flex' : 'none';
        if (!editorActive) {
            menu.style.display = 'none';
            menuOpen = false;
        }
        allObjs.forEach(obj => {
            obj.style.pointerEvents = editorActive ? 'all' : 'none';
            obj.style.cursor = editorActive ? 'move' : '';
        });
        const enterBtn = document.getElementById('enter-btn');
        if (enterBtn) {
            enterBtn.style.pointerEvents = editorActive ? 'none' : 'all';
            enterBtn.style.opacity = editorActive ? '0.3' : '1';
        }
        if (!editorActive && selectedObj) { selectedObj.style.outline = ''; selectedObj = null; }
    }

    // Touche E
    // Fonction utilitaire : récupérer tous les membres d'un groupe
    function getGroupMembers(obj) {
        const gId = objGroups.get(obj);
        if (!gId) return [obj];
        return allObjs.filter(o => objGroups.get(o) === gId);
    }

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'e' || e.key === 'E') toggleEditor();
        if (!editorActive) return;

        // M = miroir horizontal
        if ((e.key === 'm' || e.key === 'M') && selectedObj) {
            getGroupMembers(selectedObj).forEach(obj => {
                const current = obj.dataset.mirror === 'true';
                obj.dataset.mirror = current ? '' : 'true';
                const img = obj.querySelector('img');
                if (img) {
                    img.style.transform = current ? '' : 'scaleX(-1)';
                }
            });
            const mirrored = selectedObj.dataset.mirror === 'true';
            document.getElementById('ed-info').innerHTML += ` <span style="color:#f80">${mirrored ? '[MIROIR]' : '[NORMAL]'}</span>`;
        }

        // R = mode rotation
        if (e.key === 'r' || e.key === 'R') {
            rotateMode = !rotateMode;
            document.getElementById('ed-info').innerHTML += rotateMode ? ' <span style="color:#f80">[ROTATION]</span>' : '';
        }

        // D = dupliquer l'objet sélectionné
        if ((e.key === 'd' || e.key === 'D') && selectedObj && selectedObj !== titleBlock) {
            const clone = selectedObj.cloneNode(true);
            // Décaler légèrement
            const cloneLeft = (parseFloat(clone.style.left) || 0) + 3;
            const cloneTop = (parseFloat(clone.style.top) || 0) + 3;
            clone.style.left = cloneLeft + '%';
            clone.style.top = cloneTop + '%';
            clone.style.outline = '';
            clone.style.display = '';
            // Z-index le plus haut pour être devant tout
            const maxZD = Math.max(0, ...allObjs.map(o => parseInt(o.style.zIndex) || 0));
            clone.style.zIndex = maxZD + 1;
            // Copier le data-layer et data-rotation
            clone.dataset.layer = selectedObj.dataset.layer || '5';
            clone.dataset.rotation = selectedObj.dataset.rotation || '0';
            // Ajouter à la scène HTML
            const scene = document.querySelector('.parallax-scene');
            scene.appendChild(clone);
            // Ajouter au moteur parallaxe (IMPORTANT)
            if (window.pObjectsList) {
                window.pObjectsList.push(clone);
            }
            // Ajouter à l'éditeur
            allObjs.push(clone);
            const name = objNames.get(selectedObj) + ' (copie)';
            objNames.set(clone, name);
            objVisible.set(clone, true);
            objRotation.set(clone, objRotation.get(selectedObj) || 0);
            clone.style.cursor = 'move';
            clone.style.pointerEvents = 'all';
            // Rendre cliquable
            clone.addEventListener('mousedown', (ev) => {
                if (!editorActive || !objVisible.get(clone)) return;
                ev.preventDefault(); ev.stopPropagation();
                if (ev.shiftKey) {
                    const idx = multiSelection.indexOf(clone);
                    if (idx >= 0) { multiSelection.splice(idx, 1); clone.style.outline = ''; }
                    else { multiSelection.push(clone); clone.style.outline = '2px solid #0ff'; }
                    return;
                }
                multiSelection.forEach(o => o.style.outline = '');
                multiSelection = [];
                selectObj(clone);
                dragging = true;
                startX = ev.clientX; startY = ev.clientY;
                origLeft = parseFloat(clone.style.left) || 0;
                origTop = parseFloat(clone.style.top) || 0;
            });
            selectObj(clone);
            document.getElementById('ed-info').innerHTML = `<span style="color:#0ff">Dupliqué : ${name}</span>`;
        }

        // F = mode flou (F + molette pour ajuster le blur)
        if (e.key === 'f' || e.key === 'F') {
            if (!selectedObj) return;
            const currentBlur = parseFloat(selectedObj.dataset.blur || '0');
            document.getElementById('ed-info').innerHTML += ` <span style="color:#f0f">[FLOU: ${currentBlur}px — Molette pour ajuster]</span>`;
        }

        // G = grouper/dégrouper la sélection multiple
        if (e.key === 'g' || e.key === 'G') {
            if (multiSelection.length > 1) {
                // Vérifier si déjà groupés
                const firstGroup = objGroups.get(multiSelection[0]);
                const allSameGroup = firstGroup && multiSelection.every(o => objGroups.get(o) === firstGroup);

                if (allSameGroup) {
                    // Dégrouper
                    multiSelection.forEach(o => {
                        objGroups.delete(o);
                        o.style.outline = '';
                    });
                    multiSelection = [];
                    document.getElementById('ed-info').innerHTML = `<span style="color:#f80">Dégroupé !</span>`;
                } else {
                    // Grouper : même layer que le premier sélectionné
                    const gId = nextGroupId++;
                    const layer = multiSelection[0].dataset.layer;
                    multiSelection.forEach(o => {
                        objGroups.set(o, gId);
                        o.dataset.layer = layer;
                        o.style.outline = '2px solid #ff0'; // JAUNE = groupé
                    });
                    multiSelection = [];
                    document.getElementById('ed-info').innerHTML = `<span style="color:#ff0">Groupe ${gId} créé (${multiSelection.length} objets) — jaune = groupé</span>`;
                }
            } else if (selectedObj) {
                document.getElementById('ed-info').innerHTML += ' <span style="color:#888">Shift+clic pour sélectionner plusieurs, puis G</span>';
            }
        }

        // H = cacher/montrer tout sauf sélection
        if (e.key === 'h' || e.key === 'H') {
            allHidden = !allHidden;
            allObjs.forEach(obj => {
                if (obj === selectedObj) return;
                obj.style.opacity = allHidden ? '0.05' : (obj.style.opacity === '0.05' ? '1' : obj.style.opacity);
                obj.style.pointerEvents = allHidden ? 'none' : 'all';
            });
            document.getElementById('ed-hide-all').textContent = allHidden ? 'Montrer tout' : 'Cacher tout';
            document.getElementById('ed-hide-all').style.color = allHidden ? '#0f0' : '#f80';
        }

        // Suppr = supprimer
        if (e.key === 'Delete' && selectedObj) {
            deletedObjs.push(selectedObj);
            selectedObj.style.display = 'none';
            selectedObj.dataset.deleted = 'true';
            // Barrer dans le menu
            const delIdx = allObjs.indexOf(selectedObj);
            const delRow = menu.querySelector(`.ed-row[data-idx="${delIdx}"]`);
            if (delRow) {
                delRow.style.opacity = '0.4';
                delRow.style.textDecoration = 'line-through';
                delRow.style.background = '#1a0000';
            }
            selectedObj.style.outline = '';
            selectedObj = null;
            document.getElementById('ed-info').textContent = 'Supprimé — cliquer dans le menu pour restaurer';
            updateCoords();
        }

        // W = afficher/cacher la barre de zoom (sans toucher à la position)
        if (e.key === 'w' || e.key === 'W') {
            zoomMode = !zoomMode;
            zoomBar.style.display = zoomMode ? 'flex' : 'none';
            // On ne reset PAS — le zoom et la position restent
        }

        // R = reset zoom complet (remet tout à 100% et position normale)
        if (e.key === 'r' || e.key === 'R') {
            panX = 0;
            panY = 0;
            zoomLevel = 100;
            const intro = document.getElementById('parallax-intro');
            if (intro) intro.style.transform = '';
            document.getElementById('zoom-val').textContent = '100%';
            document.getElementById('zoom-slider').value = 100;
        }

        // Z = restaurer
        if ((e.key === 'z' || e.key === 'Z') && deletedObjs.length > 0) {
            const restored = deletedObjs.pop();
            restored.style.display = '';
            selectObj(restored);
        }

        // 8 (pavé num) = z-index +1 (mettre devant)
        // 2 (pavé num) = z-index -1 (mettre derrière)
        if (selectedObj && (e.key === '8')) {
            e.preventDefault();
            selectedObj.style.zIndex = (parseInt(selectedObj.style.zIndex) || 0) + 1;
            selectObj(selectedObj);
        }
        if (selectedObj && (e.key === '2')) {
            e.preventDefault();
            selectedObj.style.zIndex = (parseInt(selectedObj.style.zIndex) || 0) - 1;
            selectObj(selectedObj);
        }
    });

    // Triple tap (mobile)
    let tapCount = 0, tapTimer = null;
    document.addEventListener('touchend', () => {
        tapCount++;
        if (tapCount === 3) { tapCount = 0; clearTimeout(tapTimer); toggleEditor(); }
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { tapCount = 0; }, 500);
    });

    // Bouton cacher tout
    document.getElementById('ed-hide-all').addEventListener('click', (e) => {
        e.stopPropagation();
        allHidden = !allHidden;
        allObjs.forEach(obj => {
            if (obj === selectedObj) return;
            obj.style.opacity = allHidden ? '0.05' : '';
            obj.style.pointerEvents = allHidden ? 'none' : 'all';
        });
        e.target.textContent = allHidden ? 'Montrer tout' : 'Cacher tout';
        e.target.style.color = allHidden ? '#0f0' : '#f80';
    });

    // Œil par calque dans le menu
    menu.querySelectorAll('.ed-eye').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            const obj = allObjs[idx];
            const vis = objVisible.get(obj);
            objVisible.set(obj, !vis);
            obj.style.opacity = vis ? '0.05' : '';
            obj.style.pointerEvents = vis ? 'none' : 'all';
            btn.textContent = vis ? '🚫' : '👁';
        });
    });

    // Cacher/montrer par layer
    menu.querySelectorAll('.ed-hide-layer').forEach(btn => {
        let hidden = false;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            hidden = !hidden;
            const layer = btn.dataset.layer;
            allObjs.forEach(obj => {
                const objLayer = obj.dataset ? (obj.dataset.layer || 'txt') : 'txt';
                if (objLayer === layer) {
                    obj.style.opacity = hidden ? '0.05' : '';
                    obj.style.pointerEvents = hidden ? 'none' : 'all';
                    objVisible.set(obj, !hidden);
                }
            });
            btn.textContent = hidden ? '🚫' : '👁';
        });
    });

    // Supprimer dans le menu (le bouton ✕)
    menu.querySelectorAll('.ed-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            const obj = allObjs[idx];
            deletedObjs.push(obj);
            obj.style.display = 'none';
            obj.dataset.deleted = 'true';
            // Barrer dans le menu
            const row = btn.parentElement;
            row.style.opacity = '0.4';
            row.style.textDecoration = 'line-through';
            row.style.background = '#1a0000';
            if (selectedObj === obj) { selectedObj.style.outline = ''; selectedObj = null; }
            updateCoords();
        });
    });

    // Bouton + dans le menu = dupliquer et placer au centre en premier plan
    menu.querySelectorAll('.ed-dup').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            const obj = allObjs[idx];
            if (obj.style.display === 'none' || obj.dataset.deleted === 'true') return;

            const clone = obj.cloneNode(true);
            // Placer au centre de l'écran
            clone.style.left = '45%';
            clone.style.top = '45%';
            clone.style.outline = '';
            clone.style.display = '';
            clone.style.opacity = '1';
            // Z-index le plus haut pour être devant tout
            const maxZ = Math.max(0, ...allObjs.map(o => parseInt(o.style.zIndex) || 0));
            clone.style.zIndex = maxZ + 1;
            clone.dataset.layer = obj.dataset.layer || '5';
            clone.dataset.rotation = obj.dataset.rotation || '0';

            const scene = document.querySelector('.parallax-scene');
            scene.appendChild(clone);
            if (window.pObjectsList) window.pObjectsList.push(clone);

            allObjs.push(clone);
            const name = objNames.get(obj) + ' +';
            objNames.set(clone, name);
            objVisible.set(clone, true);
            objRotation.set(clone, objRotation.get(obj) || 0);
            clone.style.cursor = 'move';
            clone.style.pointerEvents = 'all';

            clone.addEventListener('mousedown', (ev) => {
                if (!editorActive || !objVisible.get(clone)) return;
                ev.preventDefault(); ev.stopPropagation();
                if (ev.shiftKey) {
                    if (selectedObj && multiSelection.indexOf(selectedObj) < 0) {
                        multiSelection.push(selectedObj);
                        selectedObj.style.outline = '2px solid #0ff';
                    }
                    const mi = multiSelection.indexOf(clone);
                    if (mi >= 0) { multiSelection.splice(mi, 1); clone.style.outline = ''; }
                    else { multiSelection.push(clone); clone.style.outline = '2px solid #0ff'; }
                    return;
                }
                multiSelection.forEach(o => o.style.outline = '');
                multiSelection = [];
                selectObj(clone);
                dragging = true;
                startX = ev.clientX; startY = ev.clientY;
                origLeft = parseFloat(clone.style.left) || 0;
                origTop = parseFloat(clone.style.top) || 0;
                savedLeft = origLeft; savedTop = origTop;
            });

            selectObj(clone);
            document.getElementById('ed-info').innerHTML = `<span style="color:#0ff">Copie créée : ${name}</span>`;
        });
    });

    // Sélection dans le menu = voir l'objet directement OU restaurer si supprimé
    menu.querySelectorAll('.ed-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.classList.contains('ed-eye') || e.target.classList.contains('ed-del')) return;
            const idx = parseInt(row.dataset.idx);
            const obj = allObjs[idx];

            // Si l'objet est supprimé → le restaurer
            if (obj.dataset.deleted === 'true') {
                obj.style.display = '';
                obj.dataset.deleted = '';
                row.style.opacity = '1';
                row.style.textDecoration = 'none';
                row.style.background = '';
                objVisible.set(obj, true);
                obj.style.pointerEvents = 'all';
                const delIdx = deletedObjs.indexOf(obj);
                if (delIdx >= 0) deletedObjs.splice(delIdx, 1);
                // Ne PAS déplacer l'objet restauré — il revient à sa position d'origine
                document.getElementById('ed-info').innerHTML = `<span style="color:#0f0">Restauré : ${objNames.get(obj)}</span>`;
                selectObj(obj);
                return;
            }

            // Rendre visible si caché
            if (obj.style.display === 'none' || obj.style.opacity === '0.05' || !objVisible.get(obj)) {
                obj.style.display = '';
                obj.style.opacity = '1';
                obj.style.pointerEvents = 'all';
                objVisible.set(obj, true);
                const eyeBtn = menu.querySelector(`.ed-eye[data-idx="${idx}"]`);
                if (eyeBtn) { eyeBtn.textContent = '👁'; }
                // Ne PAS déplacer l'objet — il reste à sa position d'origine
            }
            selectObj(obj);
        });
    });

    // Clic sur objet (+ Shift pour sélection multiple)
    allObjs.forEach(obj => {
        obj.addEventListener('mousedown', (e) => {
            if (!editorActive || !objVisible.get(obj)) return;
            e.preventDefault(); e.stopPropagation();

            if (e.shiftKey) {
                // Shift+clic : d'abord, ajouter l'objet déjà sélectionné au multi s'il n'y est pas
                if (selectedObj && multiSelection.indexOf(selectedObj) < 0) {
                    multiSelection.push(selectedObj);
                    selectedObj.style.outline = '2px solid #0ff';
                }

                // Ajouter/retirer l'objet cliqué
                const idx = multiSelection.indexOf(obj);
                if (idx >= 0) {
                    // Déjà dans la sélection → retirer
                    multiSelection.splice(idx, 1);
                    obj.style.outline = '';
                } else {
                    // Pas encore → ajouter
                    multiSelection.push(obj);
                    obj.style.outline = '2px solid #0ff';
                }

                // Afficher le compteur
                document.getElementById('ed-info').innerHTML = `<span style="color:#0ff">${multiSelection.length} objets sélectionnés — G pour grouper</span>`;

                // Pas de drag en mode Shift
                dragging = false;
                return;
            }

            // Clic normal = sélection simple, reset multi
            multiSelection.forEach(o => {
                // Garder la couleur jaune si groupé, sinon enlever
                const gId = objGroups.get(o);
                o.style.outline = gId ? '2px solid #ff0' : '';
            });
            multiSelection = [];

            selectObj(obj);

            dragging = true;
            startX = e.clientX; startY = e.clientY;
            origLeft = parseFloat(obj.style.left) || 0;
            origTop = parseFloat(obj.style.top) || 0;
            // Sauvegarder la position exacte pour la restaurer si pas de vrai drag
            savedLeft = origLeft;
            savedTop = origTop;
        });
    });

    // Clic dans le vide = désélectionner TOUT (aperçu propre)
    document.getElementById('parallax-intro').addEventListener('mousedown', (e) => {
        if (!editorActive) return;
        if (e.target.closest('.p-obj') || e.target.closest('.parallax-title')) return;

        // Enlever TOUS les contours (vert, bleu, jaune)
        allObjs.forEach(obj => { obj.style.outline = ''; });
        multiSelection = [];
        if (selectedObj) {
            selectedObj = null;
        }
        document.getElementById('ed-info').textContent = 'ÉDITEUR — cliquez un objet';
        document.querySelectorAll('.ed-row').forEach(r => r.style.background = '');
    });

    // Fonction pour vérifier si un événement vient du lecteur audio
    function isFromAudioPlayer(e) {
        return e.target && (e.target.closest('#audio-player') || e.target.id === 'audio-seek-bar');
    }

    // Glisser (+ déplacer le groupe entier si groupé)
    let dragStarted = false;
    document.addEventListener('mousemove', (e) => {
        if (isFromAudioPlayer(e)) return;
        if (!editorActive || !dragging || !selectedObj) return;

        // Seuil de 5px avant de commencer à déplacer (évite le micro-décalage au clic)
        if (!dragStarted) {
            const dist = Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);
            if (dist < 10) return;
            dragStarted = true;
        }

        e.preventDefault();
        const scene = document.querySelector('.parallax-scene') || document.getElementById('parallax-intro');
        const rect = scene.getBoundingClientRect();
        const dx = ((e.clientX - startX) / rect.width) * 100;
        const dy = ((e.clientY - startY) / rect.height) * 100;

        // Déplacer l'objet principal
        selectedObj.style.left = Math.round((origLeft + dx) * 10) / 10 + '%';
        selectedObj.style.top = Math.round((origTop + dy) * 10) / 10 + '%';

        // Si groupé, déplacer tous les objets du même groupe
        const gId = objGroups.get(selectedObj);
        if (gId) {
            allObjs.forEach(obj => {
                if (obj !== selectedObj && objGroups.get(obj) === gId) {
                    const objOrigLeft = parseFloat(obj.dataset.origLeft || obj.style.left) || 0;
                    const objOrigTop = parseFloat(obj.dataset.origTop || obj.style.top) || 0;
                    if (!obj.dataset.origLeft) {
                        obj.dataset.origLeft = objOrigLeft;
                        obj.dataset.origTop = objOrigTop;
                    }
                    obj.style.left = Math.round((parseFloat(obj.dataset.origLeft) + dx) * 10) / 10 + '%';
                    obj.style.top = Math.round((parseFloat(obj.dataset.origTop) + dy) * 10) / 10 + '%';
                }
            });
        }

        selectObj(selectedObj);
    });

    document.addEventListener('mouseup', () => {
        if (dragging && selectedObj) {
            // Si le drag n'a pas vraiment commencé, restaurer la position exacte
            if (!dragStarted) {
                selectedObj.style.left = savedLeft + '%';
                selectedObj.style.top = savedTop + '%';
            }
            const gId = objGroups.get(selectedObj);
            if (gId) {
                allObjs.forEach(obj => {
                    delete obj.dataset.origLeft;
                    delete obj.dataset.origTop;
                });
            }
        }
        dragging = false;
        dragStarted = false;
    });

    // Molette = taille OU rotation
    document.addEventListener('wheel', (e) => {
        if (isFromAudioPlayer(e)) return;
        if (!editorActive || !selectedObj) return;
        e.preventDefault();
        // Si mode zoom actif : molette = TOUJOURS zoom (même avec objet sélectionné)
        if (zoomMode) {
            e.preventDefault();
            const newZoom = Math.max(50, Math.min(400, zoomLevel + (e.deltaY < 0 ? 25 : -25)));
            applyZoom(newZoom);
            return;
        }

        // Ctrl + Molette = rotation
        // Shift + Molette = flou
        // Alt + Molette = opacité
        const rotationMode = e.ctrlKey;
        const blurMode = e.shiftKey;
        const opacityMode = e.altKey;

        if (rotationMode && selectedObj) {
            e.preventDefault();
            let r = objRotation.get(selectedObj) || 0;
            r += e.deltaY < 0 ? 5 : -5;
            getGroupMembers(selectedObj).forEach(obj => {
                objRotation.set(obj, r);
                obj.dataset.rotation = r;
            });
            document.getElementById('ed-info').innerHTML = `<span style="color:#f80">Rotation: ${r}°</span>`;
            return;
        } else if (opacityMode && selectedObj) {
            e.preventDefault();
            let o = parseFloat(selectedObj.style.opacity || '1');
            o += e.deltaY < 0 ? 0.05 : -0.05;
            o = Math.max(0.05, Math.min(1, Math.round(o * 100) / 100));
            getGroupMembers(selectedObj).forEach(obj => {
                obj.style.opacity = o;
            });
            document.getElementById('ed-info').innerHTML = `<span style="color:#ff0">Opacité: ${Math.round(o * 100)}%</span>`;
            return;
        } else if (blurMode && selectedObj) {
            let b = parseFloat(selectedObj.dataset.blur || '0');
            b += e.deltaY < 0 ? 0.5 : -0.5;
            b = Math.max(0, Math.min(20, b));
            getGroupMembers(selectedObj).forEach(obj => {
                obj.dataset.blur = b;
                obj.style.filter = b > 0 ? `blur(${b}px)` : '';
            });
            document.getElementById('ed-info').innerHTML = `<span style="color:#f0f">Flou: ${b}px</span>`;
        } else if (rotateMode) {
            let r = objRotation.get(selectedObj) || 0;
            r += e.deltaY < 0 ? 5 : -5;
            getGroupMembers(selectedObj).forEach(obj => {
                objRotation.set(obj, r);
                obj.dataset.rotation = r;
            });
        } else {
            const delta = e.deltaY < 0 ? 2 : -2;
            getGroupMembers(selectedObj).forEach(obj => {
                let w = parseFloat(obj.style.width) || 10;
                w += delta;
                w = Math.max(2, Math.min(300, w));
                obj.style.width = w + '%';
            });
        }
        selectObj(selectedObj);
    }, { passive: false });

    // COPIER
    document.getElementById('ed-copy').addEventListener('click', () => {
        let txt = '=== COORDONNÉES PARALLAXE ===\n\n';
        allObjs.forEach(obj => {
            const name = objNames.get(obj);
            if (obj.style.display === 'none') { txt += `${name}: SUPPRIMÉ\n`; return; }
            const l = Math.round(parseFloat(obj.style.left) * 10) / 10;
            const t = Math.round(parseFloat(obj.style.top) * 10) / 10;
            const w = Math.round(parseFloat(obj.style.width) * 10) / 10;
            const r = objRotation.get(obj) || 0;
            const o = obj.style.opacity || '1';
            const z = obj.style.zIndex || 'auto';
            const g = objGroups.get(obj);
            const groupTxt = g ? `  groupe:${g}` : '';
            const blur = obj.dataset.blur || '0';
            const blurTxt = blur !== '0' ? `  blur:${blur}px` : '';
            const mirror = obj.dataset.mirror === 'true' ? '  miroir:oui' : '';
            txt += `${name}: left:${l}%  top:${t}%  width:${w}%  rotation:${r}°  opacity:${o}  z:${z}  layer:${obj.dataset.layer || '?'}${groupTxt}${blurTxt}${mirror}\n`;
        });
        navigator.clipboard.writeText(txt).then(() => {
            const btn = document.getElementById('ed-copy');
            btn.textContent = '✅ COPIÉ !';
            setTimeout(() => { btn.textContent = 'COPIER'; }, 2000);
        });
    });

    // ZOOM — barre en bas
    const zoomBar = document.createElement('div');
    zoomBar.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#0f0;font-family:monospace;font-size:11px;padding:6px 15px;z-index:99999;border-radius:15px;border:1px solid #333;display:none;align-items:center;gap:10px;';
    zoomBar.innerHTML = `
        <span style="color:#888;">ZOOM</span>
        <button id="zoom-out" style="background:none;border:1px solid #555;color:#0f0;cursor:pointer;font-size:14px;width:24px;height:24px;border-radius:50%;line-height:1;">−</button>
        <input id="zoom-slider" type="range" min="50" max="400" value="100" style="width:150px;cursor:pointer;">
        <button id="zoom-in" style="background:none;border:1px solid #555;color:#0f0;cursor:pointer;font-size:14px;width:24px;height:24px;border-radius:50%;line-height:1;">+</button>
        <span id="zoom-val" style="color:#0f0;min-width:35px;">100%</span>
        <button id="zoom-reset" style="background:none;border:1px solid #555;color:#f80;cursor:pointer;font-size:10px;padding:2px 8px;border-radius:10px;">Reset</button>
    `;
    document.body.appendChild(zoomBar);

    let panX = 0, panY = 0;
    let isPanning = false;
    let panStartX, panStartY, panOrigX, panOrigY;

    function applyZoom(level) {
        zoomLevel = level;
        const intro = document.getElementById('parallax-intro');
        if (intro) {
            intro.style.transformOrigin = '0 0';
            intro.style.transform = `translate(${panX}px, ${panY}px) scale(${level / 100})`;
        }
        document.getElementById('zoom-val').textContent = level + '%';
        document.getElementById('zoom-slider').value = level;
    }

    function applyPan() {
        const intro = document.getElementById('parallax-intro');
        if (intro) {
            intro.style.transformOrigin = '0 0';
            intro.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel / 100})`;
        }
    }

    // Quand zoom est actif : clic + glisser dans le vide = panoramique
    document.addEventListener('mousedown', (e) => {
        if (isFromAudioPlayer(e)) return;
        if (!zoomMode || !editorActive) return;
        if (e.target.closest('#editor-panel') || e.target.closest('#ed-layers')) return;
        if (e.target.closest('input') || e.target.closest('button')) return;
        // Pas sur un objet → panoramique
        if (!e.target.closest('.p-obj') && !e.target.closest('.parallax-title')) {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panOrigX = panX;
            panOrigY = panY;
            document.body.style.cursor = 'grab';
            e.preventDefault();
            e.stopPropagation(); // empêcher le site de réagir
        }
    }, true); // capture phase pour intercepter avant le site

    document.addEventListener('mousemove', (e) => {
        if (isFromAudioPlayer(e)) return;
        if (!isPanning) return;
        document.body.style.cursor = 'grabbing';
        panX = panOrigX + (e.clientX - panStartX);
        panY = panOrigY + (e.clientY - panStartY);
        applyPan();
    });

    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            document.body.style.cursor = '';
        }
    });

    document.getElementById('zoom-slider').addEventListener('input', (e) => {
        applyZoom(parseInt(e.target.value));
    });
    document.getElementById('zoom-in').addEventListener('click', () => {
        applyZoom(Math.min(400, zoomLevel + 25));
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
        applyZoom(Math.max(50, zoomLevel - 25));
    });
    document.getElementById('zoom-reset').addEventListener('click', () => {
        panX = 0;
        panY = 0;
        applyZoom(100);
    });

    // Aide-mémoire des raccourcis
    const helpPanel = document.createElement('div');
    helpPanel.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.92);color:#aaa;font-family:monospace;font-size:10px;padding:8px 14px;z-index:99999;border-radius:12px;border:1px solid #333;display:none;white-space:nowrap;';
    helpPanel.innerHTML = `
        <span style="color:#0f0">E</span> éditeur
        <span style="color:#555">|</span> <span style="color:#0f0">Glisser</span> déplacer
        <span style="color:#555">|</span> <span style="color:#0f0">Molette</span> taille
        <span style="color:#555">|</span> <span style="color:#0f0">Ctrl</span>+mol rotation
        <span style="color:#555">|</span> <span style="color:#0f0">Shift</span>+mol flou
        <span style="color:#555">|</span> <span style="color:#0f0">Alt</span>+mol opacité
        <span style="color:#555">|</span> <span style="color:#0f0">M</span> miroir
        <span style="color:#555">|</span> <span style="color:#0f0">D</span> dupliquer
        <span style="color:#555">|</span> <span style="color:#0f0">G</span> grouper
        <span style="color:#555">|</span> <span style="color:#0f0">H</span> tout cacher
        <span style="color:#555">|</span> <span style="color:#0f0">8/2</span> avant/arrière
        <span style="color:#555">|</span> <span style="color:#0f0">Suppr</span> supprimer
        <span style="color:#555">|</span> <span style="color:#0f0">Z</span> restaurer
        <span style="color:#555">|</span> <span style="color:#0f0">W</span> zoom
        <span style="color:#555">|</span> <span style="color:#0f0">Clic vide</span> aperçu
    `;
    document.body.appendChild(helpPanel);

    document.getElementById('ed-help-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none';
    });

    updateCoords();
})();
