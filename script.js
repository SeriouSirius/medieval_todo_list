document.addEventListener('DOMContentLoaded', () => {
    const questInput = document.getElementById('quest-input');
    const addBtn = document.getElementById('add-quest-btn');
    const questBoard = document.getElementById('quest-board');

    // Animation Overlay Elements
    const overlay = document.getElementById('animation-overlay');
    const animText = document.getElementById('anim-text');
    const animHand = document.getElementById('anim-hand');

    // Bin & Completed List Elements
    const rubbishBinBtn = document.getElementById('rubbish-bin-container');
    const completedLog = document.getElementById('completed-log');
    const completedList = document.getElementById('completed-list');
    const closeLogBtn = document.getElementById('close-log-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // Load quests from local storage
    let quests = JSON.parse(localStorage.getItem('medievalQuests')) || [];
    let completedQuests = JSON.parse(localStorage.getItem('medievalCompletedQuests')) || [];

    function saveQuests() {
        localStorage.setItem('medievalQuests', JSON.stringify(quests));
        localStorage.setItem('medievalCompletedQuests', JSON.stringify(completedQuests));
    }

    function renderQuests() {
        questBoard.innerHTML = '';
        quests.forEach((quest, index) => {
            createQuestElement(quest, index);
        });
    }

    function renderCompletedLog() {
        completedList.innerHTML = '';
        completedQuests.forEach((quest, index) => {
            const li = document.createElement('li');

            const span = document.createElement('span');
            // Preserve newlines
            span.innerHTML = quest.text.replace(/\n/g, '<br>');

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '✖';
            deleteBtn.title = "Delete Permanently";
            deleteBtn.addEventListener('click', () => {
                deleteCompletedQuest(index);
            });

            li.appendChild(span);
            li.appendChild(deleteBtn);
            completedList.appendChild(li);
        });
    }

    function deleteCompletedQuest(index) {
        completedQuests.splice(index, 1);
        saveQuests();
        renderCompletedLog();
    }

    function showModal() {
        document.getElementById('confirm-modal').classList.remove('hidden');
    }

    function hideModal() {
        document.getElementById('confirm-modal').classList.add('hidden');
    }

    function clearAllCompleted() {
        if (completedQuests.length > 0) {
            showModal();
        }
    }

    // Modal Event Listeners
    document.getElementById('modal-cancel-btn').addEventListener('click', hideModal);

    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
        completedQuests = [];
        saveQuests();
        renderCompletedLog();
        hideModal();
    });

    // Close modal on outside click
    document.getElementById('confirm-modal').addEventListener('click', (e) => {
        if (e.target.id === 'confirm-modal') hideModal();
    });

    let highestZIndex = 100; // Start validation

    function createQuestElement(quest, index) {
        const div = document.createElement('div');
        div.classList.add('quest-scroll');
        div.id = `quest-${index}`;

        // --- Phase 5: Dimensions ---
        // Apply saved or auto dimensions
        if (quest.width) div.style.width = `${quest.width}px`;
        if (quest.height) div.style.height = `${quest.height}px`;

        // Position
        if (!quest.x || !quest.y) {
            quest.x = window.innerWidth / 2 - 100 + (Math.random() * 100 - 50);
            quest.y = window.innerHeight / 2 + (Math.random() * 100);
        }
        div.style.left = `${quest.x}px`;
        div.style.top = `${quest.y}px`;

        // Z-Index (Restore or Init)
        if (quest.zIndex) {
            div.style.zIndex = quest.zIndex;
            if (quest.zIndex > highestZIndex) highestZIndex = quest.zIndex;
        } else {
            div.style.zIndex = index + 1; // fallback
        }

        // Selection Logic
        div.addEventListener('click', (e) => {
            // Prevent deselecting immediately if clicking inside
            e.stopPropagation();
            bringToFront(div, index); // Pin to top
            selectQuest(div, index);
        });

        const span = document.createElement('span');
        span.innerHTML = quest.text.replace(/\n/g, '<br>');

        const controls = document.createElement('div');
        controls.classList.add('quest-controls');

        const completeBtn = document.createElement('button');
        completeBtn.innerHTML = '✔';
        completeBtn.classList.add('quest-btn', 'complete-btn');
        completeBtn.title = "Complete Quest";
        completeBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            completeQuest(index, div);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '✖';
        deleteBtn.classList.add('quest-btn', 'delete-btn');
        deleteBtn.title = "Abandon Quest";
        deleteBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            deleteQuest(index);
        });

        controls.appendChild(completeBtn);
        // controls.appendChild(deleteBtn);

        // --- Phase 5: Resize Handle ---
        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');
        initResize(resizeHandle, div, index);

        // --- Phase 5: Dimension Controls ---
        const dimControls = document.createElement('div');
        dimControls.classList.add('dimension-controls');

        // Width Input
        const wInput = document.createElement('input');
        wInput.classList.add('dimension-input', 'width-input');
        wInput.placeholder = "W";

        // Height Input
        const hInput = document.createElement('input');
        hInput.classList.add('dimension-input', 'height-input');
        hInput.placeholder = "H";

        // Pre-fill
        const startW = parseInt(div.style.width) || 200;
        const startH = parseInt(div.style.height) || 100;
        wInput.value = startW;
        hInput.value = startH;

        // Prevent drag/close on inputs
        [wInput, hInput].forEach(inp => {
            inp.addEventListener('click', (e) => e.stopPropagation());
            inp.addEventListener('mousedown', (e) => e.stopPropagation());
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    applyDimensions(div, wInput.value, hInput.value, index);
                }
            });
        });

        const dimBtn = document.createElement('button');
        dimBtn.textContent = 'OK';
        dimBtn.classList.add('dimension-btn');
        dimBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyDimensions(div, wInput.value, hInput.value, index);
        });
        dimBtn.addEventListener('mousedown', (e) => e.stopPropagation());

        dimControls.appendChild(wInput);
        dimControls.appendChild(hInput);
        dimControls.appendChild(dimBtn);

        div.appendChild(span);
        div.appendChild(controls);
        div.appendChild(resizeHandle);
        div.appendChild(dimControls);

        makeDraggable(div, index);
        questBoard.appendChild(div);

        // Auto-stretch check after append
        setTimeout(() => checkAutoStretch(div, quest, index), 0);
    }

    // --- Phase 5 & 6: Helper Functions ---

    function bringToFront(element, index) {
        highestZIndex++;
        element.style.zIndex = highestZIndex;
        if (quests[index]) {
            quests[index].zIndex = highestZIndex;
            saveQuests();
        }
    }

    function selectQuest(element, index) {
        // Deselect others
        document.querySelectorAll('.quest-scroll.selected').forEach(el => {
            el.classList.remove('selected');
        });
        element.classList.add('selected');

        // Update input value to current size 
        updateInputs(element);
    }

    function updateInputs(element) {
        const wInput = element.querySelector('.width-input');
        const hInput = element.querySelector('.height-input');
        if (wInput && hInput) {
            const rect = element.getBoundingClientRect();
            wInput.value = Math.round(rect.width);
            hInput.value = Math.round(rect.height);
        }
    }

    function deselectAll() {
        document.querySelectorAll('.quest-scroll.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }

    // Click background to deselect
    document.addEventListener('click', () => {
        deselectAll();
    });

    function applyDimensions(element, wVal, hVal, index) {
        const w = parseInt(wVal);
        const h = parseInt(hVal);
        if (!isNaN(w) && !isNaN(h)) {
            element.style.width = `${w}px`;
            element.style.height = `${h}px`;

            // Update Data
            if (quests[index]) {
                quests[index].width = w;
                quests[index].height = h;
                saveQuests();
            }
        }
    }

    function checkAutoStretch(element, quest, index) {
        let updated = false;

        if (element.scrollHeight > element.clientHeight) {
            element.style.height = `${element.scrollHeight}px`;
            quest.height = element.scrollHeight;
            updated = true;
        }

        if (element.scrollWidth > element.clientWidth) {
            element.style.width = `${element.scrollWidth}px`;
            quest.width = element.scrollWidth;
            updated = true;
        }

        if (updated) {
            saveQuests();
            updateInputs(element);
        }
    }

    function initResize(handle, element, index) {
        let isResizing = false;
        let startX, startY, startW, startH;

        handle.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = element.getBoundingClientRect();
            startW = rect.width;
            startH = rect.height;
            document.body.style.cursor = 'nwse-resize';
            handle.setPointerCapture(e.pointerId);
        });

        handle.addEventListener('pointermove', (e) => {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const newW = Math.max(150, startW + dx);
            const newH = Math.max(100, startH + dy);

            element.style.width = `${newW}px`;
            element.style.height = `${newH}px`;

            // Update input real-time
            updateInputs(element);
        });

        handle.addEventListener('pointerup', (e) => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                handle.releasePointerCapture(e.pointerId);

                // Save final size
                if (quests[index]) {
                    const rect = element.getBoundingClientRect();
                    quests[index].width = rect.width;
                    quests[index].height = rect.height;
                    saveQuests();
                }
            }
        });
    }

    // --- Phase 7: Fire Purge Logic ---
    const fireBtn = document.getElementById('fire-purge-btn');
    const fireWave = document.getElementById('fire-wave');
    let fireInterval;

    fireBtn.addEventListener('click', () => {
        // Reset animation
        fireWave.classList.remove('fire-sweeping');
        void fireWave.offsetWidth; // Trigger reflow

        // Start animation
        fireWave.classList.add('fire-sweeping');

        // Start collision detection loop
        const startTime = Date.now();
        const duration = 2000; // 2s animation

        if (fireInterval) clearInterval(fireInterval);

        fireInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                clearInterval(fireInterval);
                fireWave.classList.remove('fire-sweeping');
                return;
            }

            checkFireCollision(progress);
        }, 50); // Check every 50ms
    });

    function checkFireCollision(progress) {
        // Approximating the "Fire Line" moving from Bottom-Left to Top-Right
        // The wave is linear-gradient at 45deg moving TranslateX/Y.
        // Simplified Logic: 
        // A diagonal line: Y = -X + C(progress)
        // Screen coords: Top-Left (0,0), Bottom-Right (W, H)
        // Fire starts at Bottom-Left: (0, H) -> Top-Right: (W, 0)
        // Equation of line passing through Bottom-Left to Top-Right is roughly X + Y = Constant
        // But the wave moves perpendicular to that... actually the animation translates (100vw, -100vh).
        // Let's us a simple distance metric based on progress.

        const w = window.innerWidth;
        const h = window.innerHeight;

        // Visual approximation:
        // At progress 0: fire is at bottom-left.
        // At progress 1: fire is at top-right.
        // Let's define a "sweeping line" perpendicular to the direction of motion (Bottom-Left to Top-Right).
        // Direction vector: (1, -1) (visually up-right).
        // We can just check if an element is "behind" the wave front.

        // Current Wave Front Position (approximate center of the gradient band)
        // It travels from (0, H) to (W, 0) roughly.
        // Let's say "FireValue" of a point (x,y) = x + (H - y)
        // Max value is W + H (at Top-Right). Min is 0 (at Bottom-Left).
        // The wave covers values from 0 to (W+H).
        // Current Threshold = (W + H) * progress.

        // Actually, let's look at the animation: translate(100vw, -100vh).
        // It moves +X and -Y.

        document.querySelectorAll('.quest-scroll:not(.burning)').forEach((scroll) => {
            const rect = scroll.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Normalize coords so (0,0) is bottom-left
            const normX = centerX;
            const normY = h - centerY;

            // "Distance" along the diagonal (projected onto the vector (1,1))
            // The wave moves in direction (1,1) in this normalized space (right and up).
            // Projected position = normX + normY
            // Max possible = W + H.

            // The wave has a width. We touch if (Position < CurrentFront) AND (Position > CurrentBack)
            // But user said "When fire effect touch... scroll will be deleted".
            // So if WaveFront passes the scroll.

            // Tuning the threshold based on visual speed
            // Progress 0 -> 1.
            // Wave Front roughly at: (W + H) * progress * 1.5 (to ensure it clears).
            // Let's allow a bit of "burning" window.

            const position = normX + normY;
            const waveFront = (w + h) * progress * 1.5; // Multiplier to sync with visual speed
            const waveBack = waveFront - 300; // Approximate thickness of the gradient

            if (position < waveFront && position > waveBack) {
                burnScroll(scroll);
            }
        });
    }

    function burnScroll(element) {
        element.classList.add('burning');

        // Remove from Data immediately
        // Finding index might be tricky if array shifts, so we get ID logic or find by element
        // But our IDs are `quest-${index}` which is purely render-time index.
        // We must be careful not to shift indices while iterating/looping if we rely on them.
        // Actually, we should find the QUEST OBJECT that corresponds to this element.
        // Issue: `quest-index` relies on rendering order.

        // Safe approach:
        // 1. Mark as burning.
        // 2. Wait for animation end to actually remove from DOM.
        // 3. BUT we need to remove from `quests` array so it doesn't reappear on reload.

        // To safely remove from array, we need to know WHICH quest it is.
        // Let's re-parse the ID `quest-X`. 
        // CAUTION: If we splice the array, subsequent indices shift!
        // So we can't just splice(X, 1) if we are burning multiple at once?
        // Actually, if we delete X, then quest-Y (where Y > X) is now at Y-1.
        // If we rely on the DOM ID stored at create time, it becomes stale instantly after one deletion.

        // Better Solution:
        // Add a unique ID to each quest object.
        // Or simply Filter the array at the end of the burn?
        // Let's filter!

        // Update: We can't easily filter "live" during loop.
        // Let's mark the quest object as "deleted" first, then clean up.

        const idStr = element.id; // "quest-5"
        const index = parseInt(idStr.split('-')[1]);

        // We can't trust the index if we already deleted something?
        // Actually, `script.js` uses strict index from render.
        // If we haven't re-rendered, indexes are stable relative to the `quests` array in memory.

        // Mark for deletion in memory
        if (quests[index]) {
            quests[index]._markedForDeletion = true;
        }

        setTimeout(() => {
            element.remove();

            // Cleanup array: remove all marked quests
            // We need to do this carefully so we don't save "marked" quests if connection is lost?
            // Just filter and save.

            // Only trigger SAVE/Filter if we are the last one? 
            // Or just do it every time? It's cheap.
            const newQuests = quests.filter(q => !q._markedForDeletion);

            // If length changed, save and re-render ONLY if all burning is done?
            // If we re-render while others are burning, they will snap back or disappear.
            // We should just update localStorage and NOT re-render fully until necessary.
            // But wait, if we don't re-render, the IDs of remaining elements on screen are wrong versus the new array!
            // E.g. We have 0, 1, 2. We delete 1. Array has 0, 2.
            // DOM has quest-0, [burnt], quest-2.
            // If we save [0, 2], next reload is fine.
            // But if user clicks quest-2 now, it passes index "2" to functions.
            // quest[2] in new array is undefined! 

            // CRITICAL FIX: We need robust ID tracking or re-render.
            // Given the complexity of "Mass Purge", re-rendering is safest, but kills animation.
            // Alternative: Assign a random UUID to each quest and lookup by UUID.

            // For now, let's defer the "Array Cleanup" until the fire wave ends?
            // "When fire... deleted but not throw to rubbish bin".

            // Strategy:
            // 1. Mark object as `_deleted = true`.
            // 2. Save `quests` (with `_deleted` flags? No, filter them out).
            // 3. Actually, just filter them out from LS.
            // 4. In memory `quests`, keep them as null/placeholders? No.

            // Let's Upgrade to UUIDs in Phase 8? 
            // For now, simple hack:
            // Just mark them hidden in DOM.
            // At the end of the Fire Interval (2s), we Clean Up everything.

        }, 1000);
    }

    // Cleanup function after fire wave
    setInterval(() => {
        // If we have any marked quests, purge them and re-render
        if (quests.some(q => q._markedForDeletion)) {
            // Check if animation is pretty much done?
            // Actually, `burnScroll` removes from DOM after 1s.
            // We can just filter the array and re-save.
            // BUT we must Re-Render so IDs match indices again.

            // Wait until NO ".burning" elements are left in DOM?
            const burning = document.querySelectorAll('.burning');
            if (burning.length === 0 && !fireWave.classList.contains('fire-sweeping')) {
                quests = quests.filter(q => !q._markedForDeletion);
                saveQuests();
                renderQuests(); // This restores order
            }
        }
    }, 500);

    // Renaming old makeDraggable slightly to ensure it doesn't conflict or if logic needs tweak
    // ... logic remains same, just ensuring we don't start drag if clicking controls ...

    function makeDraggable(element, index) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        element.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return; // Only check left click for mouse
            // For touch, button might not be 0, but we want to allow it.

            // Check if target is a control button or input
            if (e.target.closest('button') || e.target.closest('input')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = element.getBoundingClientRect();
            initialLeft = parseFloat(element.style.left) || rect.left;
            initialTop = parseFloat(element.style.top) || rect.top;
            element.style.zIndex = 1000;
            e.preventDefault(); // Prevent text selection/scrolling
            element.setPointerCapture(e.pointerId);
        });

        element.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${initialLeft + dx}px`;
            element.style.top = `${initialTop + dy}px`;
        });

        element.addEventListener('pointerup', (e) => {
            if (isDragging) {
                isDragging = false;
                element.releasePointerCapture(e.pointerId);
                if (quests[index]) {
                    quests[index].x = parseFloat(element.style.left);
                    quests[index].y = parseFloat(element.style.top);
                    saveQuests();
                }
            }
        });
    }

    function playWritingAnimation(text, callback) {
        overlay.classList.remove('hidden');
        animText.innerHTML = "";
        animHand.classList.add('writing');

        let charIndex = 0;
        const typingSpeed = 30;

        const typeInterval = setInterval(() => {
            if (charIndex < text.length) {
                const char = text.charAt(charIndex);
                animText.innerHTML += char === '\n' ? '<br>' : char;
                charIndex++;
            } else {
                clearInterval(typeInterval);
                animHand.classList.remove('writing');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    callback();
                }, 800);
            }
        }, typingSpeed);
    }

    function completeQuest(index, element) {
        element.classList.add('crumpled');

        const binRect = rubbishBinBtn.getBoundingClientRect();
        // Target center of bin
        const targetX = binRect.left + binRect.width / 2 - 25; // 25 is half of crumpled width
        const targetY = binRect.top + binRect.height / 2 - 25;

        element.style.transition = "all 1s ease-in";
        element.style.left = `${targetX}px`;
        element.style.top = `${targetY}px`;
        element.style.transform = "rotate(720deg) scale(0.5)";
        element.style.opacity = "0";

        setTimeout(() => {
            const completedItem = quests[index];
            if (completedItem) {
                quests.splice(index, 1);
                completedQuests.push(completedItem);
                saveQuests();
                renderQuests();
                renderCompletedLog();
            }
        }, 1000);
    }

    function addQuest() {
        const text = questInput.value.trim();
        if (text) {
            playWritingAnimation(text, () => {
                quests.push({
                    text,
                    completed: false,
                    x: null,
                    y: null
                });
                saveQuests();
                renderQuests();
                questInput.value = '';
                questInput.style.height = 'auto';
            });
        }
    }

    function deleteQuest(index) {
        quests.splice(index, 1);
        saveQuests();
        renderQuests();
    }

    addBtn.addEventListener('click', addQuest);

    questInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    questInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addQuest();
        }
    });

    rubbishBinBtn.addEventListener('click', () => {
        completedLog.classList.add('open');
        renderCompletedLog();
    });

    closeLogBtn.addEventListener('click', () => {
        completedLog.classList.remove('open');
    });

    clearAllBtn.addEventListener('click', clearAllCompleted);

    renderQuests();
    renderCompletedLog();
});
