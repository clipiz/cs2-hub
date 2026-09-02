const FAVORITES_STORAGE_KEY = 'helpstrike_favorites';
const LEETIFY_MATCH_CACHE_KEY = 'helpstrike_leetify_match_cache';

// Load and render items from data.json
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        renderItems('callouts', data.callouts);
        renderQuickUtilMapMenu(data.quickutil);
        renderPrefireMapMenu(data.prefire);
        renderItems('guides', data.guides);
        renderUtilities(data.utilities);
        renderTeams(data.teams);
        renderCrosshairPros(data.crosshairs || []);
        renderProConfigs(data.proConfigs || []);
        renderFavoritesPage(data);
        loadProMatches();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

const sidebarNavHeightUpdaters = [];
let hasSidebarNavResizeListener = false;

// Map logo image paths with correct capitalization
const mapLogosImages = {
    'Mirage': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Mirage.png',
    'Inferno': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Inferno.png',
    'Dust 2': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Dust 2.png',
    'Ancient': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Ancient.png',
    'Nuke': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Nuke.png',
    'Vertigo': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Vertigo.png',
    'Train': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Train.png',
    'Overpass': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Overpass.png',
    'Anubis': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Anubis.png',
    'Cache': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Set_cache_cs2.png',
    'Yprac': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/ypraclogo.png'
};

// QuickUtil map images (HZ versions)
const quickUtilImages = {
    'Dust 2': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Dust2HZ.jpg',
    'Mirage': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/MirageHZ.jpg',
    'Inferno': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/InfernoHZ.jpeg',
    'Nuke': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/NukeHZ.png',
    'Ancient': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/AncientHZ.jpg',
    'Train': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/TrainHZ.jpg',
    'Cache': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/CacheHZ.png',
    'Anubis': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/AnubisHZ.jpg',
    'Overpass': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/OverpassHZ.jpg',
    'Vertigo': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/VertigoHZ.jpg'
};

// QuickUtil URLs (cs2util.com)
const quickUtilURLs = {
    'Dust 2': 'https://www.cs2util.com/dust2',
    'Mirage': 'https://www.cs2util.com/mirage',
    'Inferno': 'https://www.cs2util.com/inferno',
    'Nuke': 'https://www.cs2util.com/nuke',
    'Ancient': 'https://www.cs2util.com/ancient',
    'Train': 'https://www.cs2util.com/train',
    'Cache': 'https://www.cs2util.com/cache',
    'Anubis': 'https://www.cs2util.com/anubis',
    'Overpass': 'https://www.cs2util.com/overpass',
    'Vertigo': 'https://www.cs2util.com/vertigo'
};

// Prefire map images (same as QuickUtil)
const prefireImages = {
    'Dust 2': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/Dust2HZ.jpg',
    'Mirage': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/MirageHZ.jpg',
    'Inferno': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/InfernoHZ.jpeg',
    'Nuke': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/NukeHZ.png',
    'Ancient': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/AncientHZ.jpg',
    'Train': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/TrainHZ.jpg',
    'Cache': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/CacheHZ.png',
    'Anubis': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/AnubisHZ.jpg',
    'Overpass': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/OverpassHZ.jpg',
    'Vertigo': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/VertigoHZ.jpg'
};

// Prefire Steam Community URLs
const prefireURLs = {
    'Dust 2': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3295650711',
    'Mirage': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3267302800',
    'Inferno': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3289507717',
    'Nuke': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3318295422',
    'Anubis': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3307639951',
    'Train': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3562576256',
    'Vertigo': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3274138705',
    'Cache': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3770489042',
    'Ancient': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3282067356',
    'Overpass': 'https://steamcommunity.com/sharedfiles/filedetails/?id=3328383138'
};

// Favorites helpers
function getAllFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error reading favorites:', error);
        return [];
    }
}

function getLeetifyFavoriteItems() {
    try {
        const raw = localStorage.getItem(LEETIFY_MATCH_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
        return Object.values(parsed);
    } catch (error) {
        console.error('Error reading Leetify favorites cache:', error);
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

function isFavorite(type, id) {
    const normalizedId = String(id);
    return getAllFavorites().some(favorite => favorite.type === type && String(favorite.id) === normalizedId);
}

function toggleFavorite(type, id) {
    const normalizedId = String(id);
    const favorites = getAllFavorites();
    const existingIndex = favorites.findIndex(favorite => favorite.type === type && String(favorite.id) === normalizedId);

    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push({ type, id: normalizedId });
    }

    saveFavorites(favorites);
    refreshFavoriteButtons();

    if (document.getElementById('favorites-content')) {
        loadFavoritesPage();
    }
}

function getFavoriteButtonLabel(type, id) {
    return isFavorite(type, id) ? '★ Favori' : '☆ Favori';
}

function createFavoriteButton(type, id) {
    return `
        <button class="favorite-btn" data-favorite-type="${type}" data-favorite-id="${id}" type="button">
            ${getFavoriteButtonLabel(type, id)}
        </button>
    `;
}

function refreshFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(button => {
        const type = button.getAttribute('data-favorite-type');
        const id = button.getAttribute('data-favorite-id');
        button.textContent = getFavoriteButtonLabel(type, id);
        button.classList.toggle('is-active', isFavorite(type, id));
    });
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return entities[character] || character;
    });
}

function findItemByMapName(items, mapName) {
    if (!Array.isArray(items)) return null;
    return items.find(item => item.name && item.name.includes(mapName)) || null;
}

// Extract map name from item name
function getMapName(itemName) {
    if (itemName.includes('Yprac')) return 'Yprac';
    if (itemName.includes('Cache')) return 'Cache';
    if (itemName.includes('Dust 2')) return 'Dust 2';
    return itemName.split(' ')[0];
}

// Render QuickUtil map selection menu
function renderQuickUtilMapMenu(items) {
    const menuGrid = document.getElementById('quickutil-map-menu');
    if (!menuGrid) return;

    const mapOrder = ['Dust 2', 'Mirage', 'Inferno', 'Nuke', 'Ancient', 'Train', 'Cache', 'Anubis', 'Overpass', 'Vertigo'];

    menuGrid.innerHTML = mapOrder.map(mapName => {
        const imgUrl = quickUtilImages[mapName] || '';
        const widgetUrl = quickUtilURLs[mapName] || '#';
        const item = findItemByMapName(items, mapName);
        const favoriteButton = item ? createFavoriteButton('quickutil', item.id) : '';

        return `
            <a class="map-menu-item quickutil-widget" href="${widgetUrl}" target="_blank" rel="noopener noreferrer" data-map="${mapName}" aria-label="View QuickUtil for ${mapName}">
                <div class="map-menu-bg" style="background-image: url('${imgUrl}')"></div>
                <div class="map-menu-overlay">${mapName}</div>
                <div class="metallic-shine"></div>
                ${favoriteButton}
            </a>
        `;
    }).join('');

    refreshFavoriteButtons();
}

// Render Prefire map selection menu
function renderPrefireMapMenu(items) {
    const menuGrid = document.getElementById('prefire-map-menu');
    if (!menuGrid) return;

    const mapOrder = ['Dust 2', 'Mirage', 'Inferno', 'Nuke', 'Ancient', 'Train', 'Cache', 'Anubis', 'Overpass', 'Vertigo'];

    menuGrid.innerHTML = mapOrder.map(mapName => {
        const imgUrl = prefireImages[mapName] || '';
        const widgetUrl = prefireURLs[mapName] || '#';
        const item = findItemByMapName(items, mapName);
        const favoriteButton = item ? createFavoriteButton('prefire', item.id) : '';

        return `
            <a class="map-menu-item prefire-widget" href="${widgetUrl}" target="_blank" rel="noopener noreferrer" data-map="${mapName}" aria-label="View Prefire for ${mapName}">
                <div class="map-menu-bg" style="background-image: url('${imgUrl}')"></div>
                <div class="map-menu-overlay">${mapName}</div>
                <div class="metallic-shine"></div>
                ${favoriteButton}
            </a>
        `;
    }).join('');

    refreshFavoriteButtons();
}

// Render items in grid
function renderItems(category, items) {
    const gridId = `${category}-grid`;
    const grid = document.getElementById(gridId);

    if (!grid) return;

    grid.innerHTML = items.map(item => {
        const mapName = getMapName(item.name);
        let logoUrl = '';

        if (category === 'callouts') {
            logoUrl = mapLogosImages[mapName] || '';
        }

        return `
            <div class="item-card">
                ${createFavoriteButton(category, item.id)}
                ${logoUrl ? `<div class="map-logo" style="background-image: url('${logoUrl}')"></div>` : ''}
                <span class="item-type">${item.type}</span>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="item-links">
                    ${item.links.map(link => `
                        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="item-link">
                            ${link.text}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    refreshFavoriteButtons();
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (watchMatch && watchMatch[1]) {
        return watchMatch[1];
    }

    const embedMatch = url.match(/youtube\.com\/embed\/([^&\n?#]+)/);
    if (embedMatch && embedMatch[1]) {
        return embedMatch[1];
    }

    return null;
}

// Render utilities with video embeds
function renderUtilities(utilities) {
    const grid = document.getElementById('utilities-grid') || document.getElementById('utility-grid');

    if (!grid) return;

    grid.innerHTML = utilities.map(utility => {
        const mapName = getMapName(utility.name);
        const logoUrl = mapLogosImages[mapName] || '';
        const videoId = extractYouTubeId(utility.videoUrl);

        return `
            <div class="item-card utility-card">
                ${createFavoriteButton('utilities', utility.id)}
                ${logoUrl ? `<div class="map-logo" style="background-image: url('${logoUrl}')"></div>` : ''}
                <span class="item-type">${utility.type}</span>
                <h3>${utility.name}</h3>
                ${videoId ? `
                    <div class="utility-video">
                        <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
                    </div>
                ` : ''}
                <p>${utility.description}</p>
                <div class="item-links">
                    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" class="item-link">
                        📹 Watch Video
                    </a>
                </div>
            </div>
        `;
    }).join('');

    refreshFavoriteButtons();
}

// Render pro teams
function renderTeams(teams) {
    const teamsList = document.getElementById('teams-list');

    if (!teamsList) return;

    teamsList.innerHTML = teams.map((team, index) => `
        <div class="team-item">
            <div>
                <div class="team-name">#${index + 1} ${team.name}</div>
                <div style="font-size: 0.8em; color: #95afc7;">${team.region}</div>
            </div>
            <div class="team-rating">${team.rating}</div>
        </div>
    `).join('');
}

function calculateEDPI(sensitivity, dpi) {
    return Math.round(Number(sensitivity) * Number(dpi));
}

function renderProConfigCard(config) {
    const video = config.videoSettings || {};

    return `
        <div class="item-card config-card" data-config-player="${config.player.toLowerCase()}" data-config-team="${config.team}" data-config-region="${config.region}">
            ${createFavoriteButton('proConfigs', config.id)}
            <span class="item-type">${escapeHtml(config.team)}</span>
            <h3>${escapeHtml(config.player)}</h3>
            <p class="config-meta"><strong>Région:</strong> ${escapeHtml(config.region)} • <strong>eDPI:</strong> ${calculateEDPI(config.sensitivity, config.dpi)}</p>
            <p class="config-meta"><strong>Sens:</strong> ${config.sensitivity} • <strong>DPI:</strong> ${config.dpi}</p>
            <p class="config-meta"><strong>Résolution:</strong> ${escapeHtml(config.resolution)} • <strong>Ratio:</strong> ${escapeHtml(config.aspectRatio)}</p>
            <p class="config-meta"><strong>Refresh rate:</strong> ${escapeHtml(config.refreshRate)}</p>
            <ul class="config-video-settings">
                <li><strong>Brightness:</strong> ${escapeHtml(video.brightness)}</li>
                <li><strong>Anti-Aliasing:</strong> ${escapeHtml(video.antiAliasing)}</li>
                <li><strong>Shadow:</strong> ${escapeHtml(video.shadow)}</li>
                <li><strong>Texture:</strong> ${escapeHtml(video.texture)}</li>
                <li><strong>Boost Player Contrast:</strong> ${escapeHtml(video.boostPlayerContrast)}</li>
            </ul>
            <pre class="code-block"><code>${escapeHtml(config.autoexec)}</code></pre>
        </div>
    `;
}

function renderProConfigs(configs) {
    const grid = document.getElementById('configs-grid');
    if (!grid) return;

    grid.innerHTML = configs.map(renderProConfigCard).join('');
    refreshFavoriteButtons();
}

function applyConfigFilters(configs) {
    const searchInput = document.getElementById('configs-search');
    const teamFilter = document.getElementById('configs-team');
    const regionFilter = document.getElementById('configs-region');

    if (!searchInput || !teamFilter || !regionFilter) return;

    const searchValue = searchInput.value.trim().toLowerCase();
    const selectedTeam = teamFilter.value;
    const selectedRegion = regionFilter.value;

    const filtered = configs.filter(config => {
        const matchesSearch = config.player.toLowerCase().includes(searchValue);
        const matchesTeam = !selectedTeam || config.team === selectedTeam;
        const matchesRegion = !selectedRegion || config.region === selectedRegion;
        return matchesSearch && matchesTeam && matchesRegion;
    });

    renderProConfigs(filtered);

    const resultText = document.getElementById('configs-result-count');
    if (resultText) {
        resultText.textContent = `${filtered.length} config(s) affichée(s)`;
    }
}

async function loadConfigsPage() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const configs = data.proConfigs || [];

        const teamFilter = document.getElementById('configs-team');
        const regionFilter = document.getElementById('configs-region');

        if (teamFilter) {
            const teams = [...new Set(configs.map(config => config.team))].sort();
            teamFilter.innerHTML = '<option value="">Toutes les équipes</option>' + teams.map(team => `<option value="${team}">${team}</option>`).join('');
        }

        if (regionFilter) {
            const regions = [...new Set(configs.map(config => config.region))].sort();
            regionFilter.innerHTML = '<option value="">Toutes les régions</option>' + regions.map(region => `<option value="${region}">${region}</option>`).join('');
        }

        renderProConfigs(configs);

        ['configs-search', 'configs-team', 'configs-region'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => applyConfigFilters(configs));
                element.addEventListener('change', () => applyConfigFilters(configs));
            }
        });

        applyConfigFilters(configs);
    } catch (error) {
        console.error('Error loading pro configs:', error);
    }
}

function formatCrosshairCommands(settings) {
    return [
        `cl_crosshairstyle ${settings.style}`,
        `cl_crosshairsize ${settings.length}`,
        `cl_crosshairthickness ${settings.thickness}`,
        `cl_crosshairgap ${settings.gap}`,
        `cl_crosshaircolor_r ${settings.r}`,
        `cl_crosshaircolor_g ${settings.g}`,
        `cl_crosshaircolor_b ${settings.b}`,
        `cl_crosshairalpha ${settings.alpha}`,
        `cl_crosshair_drawoutline ${settings.outline}`,
        `cl_crosshair_outlinethickness ${settings.outlineThickness}`,
        `cl_crosshair_recoil ${settings.followRecoil}`,
        `cl_crosshair_t ${settings.tStyle}`,
        `cl_crosshair_dynamic_splitdist ${settings.splitDistance}`
    ].join('\n');
}

function generatePseudoShareCode(settings) {
    const payload = [settings.style, settings.length, settings.thickness, settings.gap, settings.r, settings.g, settings.b, settings.alpha, settings.outline, settings.outlineThickness, settings.followRecoil, settings.tStyle, settings.splitDistance].join('|');
    let hash = 0;

    for (let index = 0; index < payload.length; index += 1) {
        hash = ((hash << 5) - hash) + payload.charCodeAt(index);
        hash |= 0;
    }

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let seed = Math.abs(hash) + 1;
    const groups = [];

    for (let g = 0; g < 5; g += 1) {
        let group = '';
        for (let i = 0; i < 5; i += 1) {
            seed = (seed * 48271) % 0x7fffffff;
            group += alphabet[seed % alphabet.length];
        }
        groups.push(group);
    }

    return `CSGO-${groups.join('-')}`;
}

function readCrosshairSettingsFromForm() {
    const readValue = id => document.getElementById(id)?.value;
    const readChecked = id => document.getElementById(id)?.checked;

    return {
        style: Number(readValue('crosshair-style') || 4),
        length: Number(readValue('crosshair-length') || 2),
        thickness: Number(readValue('crosshair-thickness') || 1),
        gap: Number(readValue('crosshair-gap') || -3),
        r: Number(readValue('crosshair-r') || 0),
        g: Number(readValue('crosshair-g') || 255),
        b: Number(readValue('crosshair-b') || 0),
        alpha: Number(readValue('crosshair-alpha') || 255),
        outline: readChecked('crosshair-outline') ? 1 : 0,
        outlineThickness: Number(readValue('crosshair-outline-thickness') || 1),
        followRecoil: readChecked('crosshair-recoil') ? 1 : 0,
        tStyle: readChecked('crosshair-tstyle') ? 1 : 0,
        splitDistance: Number(readValue('crosshair-split-distance') || 7)
    };
}

function updateCrosshairPreviewAndCode() {
    const preview = document.getElementById('crosshair-preview');
    const codeBox = document.getElementById('crosshair-code-output');
    const shareBox = document.getElementById('crosshair-share-output');
    if (!preview || !codeBox || !shareBox) return;

    const settings = readCrosshairSettingsFromForm();
    const lines = preview.querySelectorAll('.crosshair-line');
    const color = `rgba(${settings.r}, ${settings.g}, ${settings.b}, ${Math.max(0, Math.min(255, settings.alpha)) / 255})`;
    const thickness = Math.max(1, settings.thickness * 2);
    const length = Math.max(1, settings.length * 8);
    const gap = settings.gap * 2;

    preview.style.setProperty('--crosshair-color', color);
    preview.style.setProperty('--crosshair-thickness', `${thickness}px`);
    preview.style.setProperty('--crosshair-length', `${length}px`);
    preview.style.setProperty('--crosshair-gap', `${gap}px`);
    preview.classList.toggle('crosshair-outline-on', settings.outline === 1);

    lines.forEach(line => {
        line.style.display = 'block';
    });

    const bottomLine = preview.querySelector('.crosshair-line.bottom');
    if (bottomLine) {
        bottomLine.style.display = settings.tStyle ? 'none' : 'block';
    }

    codeBox.value = formatCrosshairCommands(settings);
    shareBox.value = generatePseudoShareCode(settings);

    document.querySelectorAll('.crosshair-value').forEach(valueLabel => {
        const sourceId = valueLabel.getAttribute('data-source');
        const source = sourceId ? document.getElementById(sourceId) : null;
        if (source) {
            valueLabel.textContent = source.type === 'checkbox' ? (source.checked ? 'ON' : 'OFF') : source.value;
        }
    });
}

function setCrosshairFormValues(settings) {
    const assignValue = (id, value) => {
        const input = document.getElementById(id);
        if (!input) return;
        if (input.type === 'checkbox') {
            input.checked = Boolean(value);
        } else {
            input.value = value;
        }
    };

    assignValue('crosshair-style', settings.style);
    assignValue('crosshair-length', settings.length);
    assignValue('crosshair-thickness', settings.thickness);
    assignValue('crosshair-gap', settings.gap);
    assignValue('crosshair-r', settings.r);
    assignValue('crosshair-g', settings.g);
    assignValue('crosshair-b', settings.b);
    assignValue('crosshair-alpha', settings.alpha);
    assignValue('crosshair-outline', settings.outline);
    assignValue('crosshair-outline-thickness', settings.outlineThickness);
    assignValue('crosshair-recoil', settings.followRecoil);
    assignValue('crosshair-tstyle', settings.tStyle);
    assignValue('crosshair-split-distance', settings.splitDistance);

    updateCrosshairPreviewAndCode();
}

function renderCrosshairPros(crosshairs) {
    const grid = document.getElementById('crosshair-pros-grid');
    if (!grid) return;

    grid.innerHTML = crosshairs.map(crosshair => `
        <div class="item-card crosshair-pro-card" data-crosshair-id="${crosshair.id}">
            ${createFavoriteButton('crosshairs', crosshair.id)}
            <span class="item-type">${escapeHtml(crosshair.team)}</span>
            <h3>${escapeHtml(crosshair.player)}</h3>
            <p>${escapeHtml(crosshair.description || crosshair.name)}</p>
            <pre class="code-block"><code>${escapeHtml(crosshair.code)}</code></pre>
            <div class="item-links">
                <button class="item-link secondary crosshair-load-btn" type="button" data-crosshair-id="${crosshair.id}">Charger ce réglage</button>
            </div>
        </div>
    `).join('');

    refreshFavoriteButtons();
}

async function loadCrosshairPage() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const crosshairs = data.crosshairs || [];

        renderCrosshairPros(crosshairs);

        const form = document.getElementById('crosshair-form');
        if (form) {
            form.querySelectorAll('input, select').forEach(field => {
                field.addEventListener('input', updateCrosshairPreviewAndCode);
                field.addEventListener('change', updateCrosshairPreviewAndCode);
            });
        }

        const copyCommands = document.getElementById('copy-crosshair-commands');
        if (copyCommands) {
            copyCommands.addEventListener('click', async () => {
                const codeBox = document.getElementById('crosshair-code-output');
                if (!codeBox) return;
                try {
                    await navigator.clipboard.writeText(codeBox.value);
                    copyCommands.textContent = '✅ Copié';
                    setTimeout(() => {
                        copyCommands.textContent = 'Copier le code';
                    }, 1400);
                } catch (error) {
                    console.error('Clipboard copy failed:', error);
                }
            });
        }

        const copyShare = document.getElementById('copy-crosshair-share');
        if (copyShare) {
            copyShare.addEventListener('click', async () => {
                const shareBox = document.getElementById('crosshair-share-output');
                if (!shareBox) return;
                try {
                    await navigator.clipboard.writeText(shareBox.value);
                    copyShare.textContent = '✅ Copié';
                    setTimeout(() => {
                        copyShare.textContent = 'Copier le share code';
                    }, 1400);
                } catch (error) {
                    console.error('Clipboard copy failed:', error);
                }
            });
        }

        document.querySelectorAll('.crosshair-load-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = String(button.getAttribute('data-crosshair-id'));
                const selected = crosshairs.find(crosshair => String(crosshair.id) === id);
                if (selected && selected.settings) {
                    setCrosshairFormValues(selected.settings);
                }
            });
        });

        if (crosshairs[0] && crosshairs[0].settings) {
            setCrosshairFormValues(crosshairs[0].settings);
        } else {
            updateCrosshairPreviewAndCode();
        }
    } catch (error) {
        console.error('Error loading crosshairs:', error);
    }
}

function renderFavoriteCard(type, item) {
    if (type === 'utilities') {
        const videoId = extractYouTubeId(item.videoUrl);
        return `
            <div class="item-card utility-card">
                ${createFavoriteButton(type, item.id)}
                <span class="item-type">${escapeHtml(item.type)}</span>
                <h3>${escapeHtml(item.name)}</h3>
                ${videoId ? `<div class="utility-video"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe></div>` : ''}
                <p>${escapeHtml(item.description)}</p>
                <div class="item-links">
                    ${videoId ? `<a href="https://www.youtube.com/watch?v=${videoId}" class="item-link" target="_blank" rel="noopener noreferrer">📹 Watch Video</a>` : ''}
                </div>
            </div>
        `;
    }

    if (type === 'crosshairs') {
        return `
            <div class="item-card crosshair-pro-card">
                ${createFavoriteButton(type, item.id)}
                <span class="item-type">${escapeHtml(item.team)}</span>
                <h3>${escapeHtml(item.player)}</h3>
                <p>${escapeHtml(item.description || item.name)}</p>
                <pre class="code-block"><code>${escapeHtml(item.code)}</code></pre>
            </div>
        `;
    }

    if (type === 'proConfigs') {
        return renderProConfigCard(item);
    }

    return `
        <div class="item-card">
            ${createFavoriteButton(type, item.id)}
            <span class="item-type">${escapeHtml(item.type)}</span>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <div class="item-links">
                ${(item.links || []).map(link => `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="item-link">${escapeHtml(link.text)}</a>`).join('')}
            </div>
        </div>
    `;
}

function renderFavoritesPage(data) {
    const container = document.getElementById('favorites-content');
    if (!container) return;

    const favorites = getAllFavorites();
    if (!favorites.length) {
        container.innerHTML = '<div class="empty-state">Aucun favori pour le moment. Clique sur ☆ Favori dans une carte pour commencer ✨</div>';
        return;
    }

    const categories = [
        { type: 'callouts', label: 'Callouts', items: data.callouts || [] },
        { type: 'quickutil', label: 'QuickUtil', items: data.quickutil || [] },
        { type: 'prefire', label: 'Prefire', items: data.prefire || [] },
        { type: 'guides', label: 'Guides', items: data.guides || [] },
        { type: 'utilities', label: 'Utility', items: data.utilities || [] },
        { type: 'crosshairs', label: 'Crosshairs', items: data.crosshairs || [] },
        { type: 'proConfigs', label: 'Configs Pro', items: data.proConfigs || [] },
        { type: 'leetifyMatches', label: 'Matchs Leetify', items: getLeetifyFavoriteItems() }
    ];

    const sections = categories.map(category => {
        const matchingFavorites = favorites.filter(favorite => favorite.type === category.type);
        if (!matchingFavorites.length) return '';

        const cards = matchingFavorites.map(favorite => {
            const item = category.items.find(entry => String(entry.id) === String(favorite.id));
            return item ? renderFavoriteCard(category.type, item) : '';
        }).join('');

        if (!cards) return '';

        return `
            <section class="category-section">
                <h2 class="category-title">⭐ ${category.label}</h2>
                <div class="items-grid">
                    ${cards}
                </div>
            </section>
        `;
    }).join('');

    container.innerHTML = sections || '<div class="empty-state">Tes favoris ne correspondent plus aux données actuelles.</div>';
    refreshFavoriteButtons();
}

async function loadFavoritesPage() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        renderFavoritesPage(data);
    } catch (error) {
        console.error('Error loading favorites page:', error);
    }
}

// Load Pro Matches
function loadProMatches() {
    const matchesList = document.getElementById('matches-list');

    if (!matchesList) return;

    const matches = [
        {
            team1: 'Spirit',
            team2: 'Falcons',
            score1: 1,
            score2: 2,
            map: 'Inferno',
            date: 'IEM Cologne 2026',
            event: 'BO3'
        },
        {
            team1: 'Falcons',
            team2: 'Vitality',
            score1: 2,
            score2: 1,
            map: 'Dust 2',
            date: 'IEM Cologne 2026',
            event: 'BO3'
        },
        {
            team1: 'Aurora',
            team2: 'FURIA',
            score1: 0,
            score2: 2,
            map: 'Mirage',
            date: 'IEM Cologne 2026',
            event: 'BO3'
        },
        {
            team1: 'G2',
            team2: 'Spirit',
            score1: 1,
            score2: 2,
            map: 'Ancient',
            date: 'CCT Europe 2026',
            event: 'BO3'
        },
        {
            team1: 'Virtus.pro',
            team2: '100 Thieves',
            score1: 2,
            score2: 0,
            map: 'Nuke',
            date: 'CCT Europe 2026',
            event: 'BO3'
        },
        {
            team1: 'Fire Flux',
            team2: 'NAVI Junior',
            score1: 2,
            score2: 0,
            map: 'Vertigo',
            date: 'ESEA Season 57',
            event: 'BO3'
        }
    ];

    matchesList.innerHTML = matches.map(match => `
        <div class="match-card">
            <div class="match-header">
                <div class="match-teams">
                    <strong>${match.team1}</strong> vs <strong>${match.team2}</strong>
                </div>
                <div class="match-score">${match.score1} - ${match.score2}</div>
            </div>
            <div class="match-info">
                📍 ${match.map} • ${match.event} • ${match.date}
            </div>
        </div>
    `).join('');
}

document.addEventListener('click', event => {
    const favoriteButton = event.target.closest('.favorite-btn');
    if (!favoriteButton) return;

    event.preventDefault();
    event.stopPropagation();

    const type = favoriteButton.getAttribute('data-favorite-type');
    const id = favoriteButton.getAttribute('data-favorite-id');
    if (!type || !id) return;

    toggleFavorite(type, id);
});

// Smooth scroll for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Load everything when page is ready
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    refreshFavoriteButtons();
});

// Refresh matches every 5 minutes
setInterval(loadProMatches, 5 * 60 * 1000);

window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.getAllFavorites = getAllFavorites;
window.loadCrosshairPage = loadCrosshairPage;
window.loadConfigsPage = loadConfigsPage;
window.loadFavoritesPage = loadFavoritesPage;
