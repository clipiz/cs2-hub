const LEETIFY_API_BASE_URL = 'https://api-public-docs.cs-prod.leetify.com';
const LEETIFY_API_KEY_STORAGE = 'helpstrike_leetify_apikey';
const LEETIFY_STEAM_ID_STORAGE = 'helpstrike_leetify_steamid';
const LEETIFY_REMEMBER_STORAGE = 'helpstrike_leetify_remember';
const LEETIFY_MATCH_CACHE_STORAGE = 'helpstrike_leetify_match_cache';

const LEETIFY_METRICS = [
    { label: 'Aim rating', tokenSets: [['aim', 'rating'], ['aim']], format: 'rating' },
    { label: 'Positioning rating', tokenSets: [['position', 'rating'], ['position']], format: 'rating' },
    { label: 'Utility rating', tokenSets: [['utility', 'rating'], ['utility']], format: 'rating' },
    { label: 'CT rating', tokenSets: [['ct', 'rating']], format: 'rating' },
    { label: 'T rating', tokenSets: [['t', 'rating']], format: 'rating' },
    { label: 'HS%', tokenSets: [['headshot'], ['hs']], format: 'percent' },
    { label: 'ADR moyen', tokenSets: [['adr'], ['average', 'damage']], format: 'number' },
    { label: 'KAST', tokenSets: [['kast']], format: 'percent' },
    { label: 'Taux de victoire', tokenSets: [['win', 'rate']], format: 'percent' },
    { label: 'Nombre de matchs', tokenSets: [['matches', 'played'], ['match', 'count'], ['matches']], format: 'integer' }
];

function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return entities[character] || character;
    });
}

function collectPrimitiveEntries(value, prefix = '', target = []) {
    if (value === null || value === undefined) return target;

    if (Array.isArray(value)) {
        value.forEach((entry, index) => collectPrimitiveEntries(entry, `${prefix}[${index}]`, target));
        return target;
    }

    if (isPlainObject(value)) {
        Object.entries(value).forEach(([key, entry]) => {
            const nextPrefix = prefix ? `${prefix}.${key}` : key;
            collectPrimitiveEntries(entry, nextPrefix, target);
        });
        return target;
    }

    target.push({ path: prefix.toLowerCase(), value });
    return target;
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function pickEntryValue(entries, tokenSets, mode = 'any') {
    for (const tokens of tokenSets) {
        const found = entries.find(entry => tokens.every(token => entry.path.includes(token)));
        if (!found) continue;

        if (mode === 'number') {
            const numeric = toNumber(found.value);
            if (numeric !== null) return numeric;
            continue;
        }

        if (found.value !== null && found.value !== undefined && String(found.value).trim()) {
            return String(found.value).trim();
        }
    }
    return null;
}

function getNestedValue(source, path) {
    return path.split('.').reduce((current, key) => {
        if (!current || typeof current !== 'object') return undefined;
        return current[key];
    }, source);
}

function findArrayByKeyNames(source, keyNames) {
    if (!source || typeof source !== 'object') return [];

    for (const name of keyNames) {
        const direct = source[name];
        if (Array.isArray(direct)) return direct;
    }

    const stack = [source];
    while (stack.length) {
        const current = stack.pop();
        if (!isPlainObject(current) && !Array.isArray(current)) continue;

        if (isPlainObject(current)) {
            for (const [key, value] of Object.entries(current)) {
                const keyLower = key.toLowerCase();
                if (Array.isArray(value) && keyNames.some(name => name.toLowerCase() === keyLower)) {
                    return value;
                }
                if (isPlainObject(value) || Array.isArray(value)) stack.push(value);
            }
        } else {
            current.forEach(entry => {
                if (isPlainObject(entry) || Array.isArray(entry)) stack.push(entry);
            });
        }
    }

    return [];
}

function extractSteamId64(rawInput) {
    const input = String(rawInput || '').trim();
    if (!input) return null;

    if (/^\d{17}$/.test(input)) return input;

    try {
        const url = new URL(input);
        const profileMatch = url.pathname.match(/\/profiles\/(\d{17})/i);
        if (profileMatch) return profileMatch[1];
    } catch {
        // Not an URL, continue with regex-based extraction.
    }

    const anySteamId = input.match(/\b\d{17}\b/);
    return anySteamId ? anySteamId[0] : null;
}

function formatDate(value) {
    if (!value) return 'Date inconnue';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return escapeHtml(String(value));
    return parsed.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatMetricValue(value, format) {
    if (value === null || value === undefined) return '—';
    const numeric = toNumber(value);

    if (format === 'integer') {
        return numeric === null ? '—' : Math.round(numeric).toString();
    }

    if (format === 'percent') {
        if (numeric === null) return '—';
        const percent = numeric <= 1 ? numeric * 100 : numeric;
        return `${percent.toFixed(1)}%`;
    }

    if (format === 'rating') {
        return numeric === null ? '—' : numeric.toFixed(2);
    }

    if (format === 'number') {
        return numeric === null ? '—' : numeric.toFixed(1);
    }

    return escapeHtml(String(value));
}

function renderStatus(message, variant = 'info') {
    const status = document.getElementById('leetify-status');
    if (!status) return;

    status.className = `loading leetify-status leetify-status--${variant}`;
    status.textContent = message;
}

function getFriendlyErrorMessage(error) {
    if (!error) return 'Une erreur inconnue est survenue.';
    if (error.code === 'INVALID_STEAM_ID') return 'SteamID invalide. Vérifie ton SteamID64 ou colle un lien Steam/Leetify contenant cet identifiant.';
    if (error.code === 'NOT_FOUND') return 'Joueur introuvable sur Leetify. Vérifie ton SteamID64 puis réessaie.';
    if (error.code === 'RATE_LIMIT') return 'Rate-limit Leetify atteint. Réessaie dans quelques instants ou ajoute une clé API personnelle.';
    if (error.code === 'UNAUTHORIZED') return 'Clé API invalide ou expirée. Vérifie la clé saisie sur Leetify Developer.';
    if (error.code === 'NETWORK') return 'Impossible de contacter Leetify (réseau/CORS). Réessaie plus tard et vérifie ton navigateur ou ta connexion.';
    return error.message || 'Impossible de charger les stats Leetify pour le moment.';
}

async function fetchLeetifyJson(path, steamId64, apiKey) {
    const url = new URL(`${LEETIFY_API_BASE_URL}${path}`);
    url.searchParams.set('steamId64', steamId64);

    const headers = {};
    if (apiKey) {
        headers.Authorization = 'Bearer ' + apiKey;
        headers._leetify_key = apiKey;
    }

    try {
        const response = await fetch(url.toString(), { headers });
        if (response.status === 404) throw { code: 'NOT_FOUND' };
        if (response.status === 429) throw { code: 'RATE_LIMIT' };
        if (response.status === 401 || response.status === 403) throw { code: 'UNAUTHORIZED' };
        if (!response.ok) {
            const details = await response.text().catch(() => '');
            throw new Error(`Erreur API Leetify (${response.status}) ${details}`);
        }
        return response.json();
    } catch (error) {
        if (error?.code) throw error;
        if (error instanceof TypeError) {
            throw { code: 'NETWORK' };
        }
        throw error;
    }
}

function normalizeProfile(profileResponse) {
    const profileRoot = getNestedValue(profileResponse, 'profile') || getNestedValue(profileResponse, 'data.profile') || getNestedValue(profileResponse, 'player') || profileResponse;
    const profileEntries = collectPrimitiveEntries(profileRoot);
    const globalEntries = collectPrimitiveEntries(profileResponse);

    const readString = tokenSets => pickEntryValue(profileEntries, tokenSets) || pickEntryValue(globalEntries, tokenSets);
    const readNumber = tokenSets => pickEntryValue(profileEntries, tokenSets, 'number') ?? pickEntryValue(globalEntries, tokenSets, 'number');

    const metrics = LEETIFY_METRICS.map(metric => ({
        label: metric.label,
        value: readNumber(metric.tokenSets),
        format: metric.format
    }));

    return {
        name: readString([['steam', 'name'], ['display', 'name'], ['nickname'], ['player', 'name'], ['name']]) || 'Joueur inconnu',
        avatar: readString([['avatar', 'url'], ['avatar'], ['profile', 'picture']]),
        rankPremier: readString([['premier', 'rank'], ['cs', 'rating'], ['premier']]),
        rankFaceit: readString([['faceit', 'level'], ['faceit', 'elo'], ['faceit']]),
        leetifyRating: readNumber([['leetify', 'rating'], ['rating'], ['global', 'rating']]),
        metrics,
        raw: profileRoot
    };
}

function normalizeMatches(profileResponse, matchesResponse) {
    const sourceMatches = findArrayByKeyNames(profileResponse, ['recentMatches', 'matches']);
    const apiMatches = findArrayByKeyNames(matchesResponse, ['matches', 'results']);
    const matches = (sourceMatches.length ? sourceMatches : apiMatches).slice(0, 12);

    return matches.map((match, index) => {
        const entries = collectPrimitiveEntries(match);
        const readString = tokenSets => pickEntryValue(entries, tokenSets);
        const readNumber = tokenSets => pickEntryValue(entries, tokenSets, 'number');

        const gameId = readString([['game', 'id'], ['match', 'id'], ['id']]) || `match-${index}`;
        const kills = readNumber([['kills']]);
        const deaths = readNumber([['deaths']]);
        const assists = readNumber([['assists']]);
        const resultRaw = readString([['result'], ['outcome']]);
        const won = readString([['won']]);
        const inferredResult = resultRaw || (won === 'true' || won === '1' ? 'W' : won === 'false' || won === '0' ? 'L' : 'N/A');

        const playerScore = readNumber([['player', 'score'], ['team1', 'score'], ['score']]);
        const enemyScore = readNumber([['enemy', 'score'], ['team2', 'score']]);
        const score = (playerScore !== null && enemyScore !== null) ? `${Math.round(playerScore)}-${Math.round(enemyScore)}` : readString([['score']]) || 'N/A';

        const mapName = readString([['map', 'name'], ['map']]) || 'Map inconnue';
        const adr = readNumber([['adr'], ['average', 'damage']]);
        const kast = readNumber([['kast']]);
        const rating = readNumber([['rating'], ['leetify', 'rating']]);
        const playedAt = readString([['date'], ['played', 'at'], ['created', 'at'], ['start', 'time']]);

        let link = readString([['leetify', 'url'], ['match', 'url'], ['url']]);
        if (!link && gameId && gameId !== `match-${index}`) {
            link = `https://leetify.com/app/match-details/${encodeURIComponent(gameId)}`;
        }

        return {
            id: String(gameId),
            map: mapName,
            result: inferredResult,
            score,
            kda: `${kills ?? '—'}/${deaths ?? '—'}/${assists ?? '—'}`,
            adr,
            kast,
            rating,
            date: playedAt,
            link
        };
    });
}

function normalizeTeammates(profileResponse) {
    const teammates = findArrayByKeyNames(profileResponse, ['recentTeammates', 'teammates', 'recentTeammates', 'recentMates', 'recentPlayers']).slice(0, 12);

    return teammates.map((mate, index) => {
        const entries = collectPrimitiveEntries(mate);
        const readString = tokenSets => pickEntryValue(entries, tokenSets);
        const readNumber = tokenSets => pickEntryValue(entries, tokenSets, 'number');

        return {
            id: readString([['steam', 'id'], ['id']]) || `mate-${index}`,
            name: readString([['steam', 'name'], ['nickname'], ['name']]) || `Coéquipier #${index + 1}`,
            winRate: readNumber([['win', 'rate']]),
            matches: readNumber([['matches'], ['games']])
        };
    });
}

function getFavoriteLabel(type, id) {
    if (typeof window.isFavorite !== 'function') return '☆ Favori';
    return window.isFavorite(type, id) ? '★ Favori' : '☆ Favori';
}

function upsertLeetifyMatchCache(match) {
    if (!match?.id) return;

    try {
        const raw = localStorage.getItem(LEETIFY_MATCH_CACHE_STORAGE);
        const cache = raw ? JSON.parse(raw) : {};
        const safeCache = isPlainObject(cache) ? cache : {};

        const descriptionParts = [
            match.result ? `${match.result}` : null,
            match.score ? `Score ${match.score}` : null,
            match.kda ? `K/D/A ${match.kda}` : null,
            match.adr !== null && match.adr !== undefined ? `ADR ${formatMetricValue(match.adr, 'number')}` : null,
            match.rating !== null && match.rating !== undefined ? `Rating ${formatMetricValue(match.rating, 'rating')}` : null
        ].filter(Boolean);

        const item = {
            id: String(match.id),
            type: 'Stats',
            name: `${match.map} • ${formatDate(match.date)}`,
            description: descriptionParts.join(' • ') || 'Match Leetify',
            links: match.link ? [{ text: 'Voir le match sur Leetify', url: match.link }] : []
        };

        safeCache[item.id] = item;
        localStorage.setItem(LEETIFY_MATCH_CACHE_STORAGE, JSON.stringify(safeCache));
    } catch (error) {
        console.error('Unable to persist Leetify match cache:', error);
    }
}

function renderProfileSection(profile) {
    const grid = document.getElementById('leetify-profile-grid');
    if (!grid) return;

    const globalRating = profile.leetifyRating !== null ? formatMetricValue(profile.leetifyRating, 'rating') : '—';

    const profileCard = `
        <article class="item-card leetify-profile-card">
            <span class="item-type">Profil général</span>
            <div class="leetify-profile-head">
                ${profile.avatar ? `<img src="${escapeHtml(profile.avatar)}" alt="Avatar ${escapeHtml(profile.name)}" class="leetify-avatar">` : ''}
                <div>
                    <h3>${escapeHtml(profile.name)}</h3>
                    <p><strong>Rating Leetify:</strong> ${globalRating}</p>
                    <p><strong>Premier:</strong> ${escapeHtml(profile.rankPremier || 'N/A')}</p>
                    <p><strong>Faceit:</strong> ${escapeHtml(profile.rankFaceit || 'N/A')}</p>
                </div>
            </div>
        </article>
    `;

    const metricCards = profile.metrics.map(metric => `
        <article class="item-card leetify-stat-card">
            <span class="item-type">Stat clé</span>
            <h3>${escapeHtml(metric.label)}</h3>
            <p class="leetify-stat-value">${formatMetricValue(metric.value, metric.format)}</p>
        </article>
    `).join('');

    grid.innerHTML = profileCard + metricCards;
}

function renderMatchesSection(matches) {
    const container = document.getElementById('leetify-matches');
    if (!container) return;

    if (!matches.length) {
        container.innerHTML = '<div class="empty-state">Aucun match récent renvoyé par Leetify.</div>';
        return;
    }

    container.innerHTML = matches.map(match => {
        upsertLeetifyMatchCache(match);

        const favoriteButton = typeof window.toggleFavorite === 'function'
            ? `<button class="favorite-btn" data-favorite-type="leetifyMatches" data-favorite-id="${escapeHtml(match.id)}" type="button">${getFavoriteLabel('leetifyMatches', match.id)}</button>`
            : '';

        return `
            <article class="item-card leetify-match-card">
                ${favoriteButton}
                <span class="item-type">${escapeHtml(match.result)}</span>
                <h3>${escapeHtml(match.map)}</h3>
                <p><strong>Score:</strong> ${escapeHtml(match.score)} • <strong>K/D/A:</strong> ${escapeHtml(match.kda)}</p>
                <p><strong>ADR:</strong> ${formatMetricValue(match.adr, 'number')} • <strong>KAST:</strong> ${formatMetricValue(match.kast, 'percent')} • <strong>Rating:</strong> ${formatMetricValue(match.rating, 'rating')}</p>
                <p><strong>Date:</strong> ${escapeHtml(formatDate(match.date))}</p>
                <div class="item-links">
                    ${match.link ? `<a href="${escapeHtml(match.link)}" target="_blank" rel="noopener noreferrer" class="item-link">Voir le match sur Leetify</a>` : ''}
                </div>
            </article>
        `;
    }).join('');

    if (typeof window.isFavorite === 'function') {
        document.querySelectorAll('#leetify-matches .favorite-btn').forEach(button => {
            button.classList.toggle('is-active', window.isFavorite(button.dataset.favoriteType, button.dataset.favoriteId));
        });
    }
}

function renderTeammatesSection(teammates) {
    const container = document.getElementById('leetify-teammates');
    if (!container) return;

    if (!teammates.length) {
        container.innerHTML = '<div class="empty-state">Aucun coéquipier récent disponible.</div>';
        return;
    }

    container.innerHTML = teammates.map(teammate => `
        <article class="item-card leetify-teammate-card">
            <span class="item-type">Teammate</span>
            <h3>${escapeHtml(teammate.name)}</h3>
            <p><strong>Win rate ensemble:</strong> ${formatMetricValue(teammate.winRate, 'percent')}</p>
            <p><strong>Matchs ensemble:</strong> ${formatMetricValue(teammate.matches, 'integer')}</p>
        </article>
    `).join('');
}

function persistSearchFormState(remember, steamIdRaw, apiKeyRaw) {
    localStorage.setItem(LEETIFY_REMEMBER_STORAGE, remember ? 'true' : 'false');

    if (remember) {
        localStorage.setItem(LEETIFY_STEAM_ID_STORAGE, steamIdRaw || '');
        // lgtm [js/clear-text-storage-of-sensitive-data]
        localStorage.setItem(LEETIFY_API_KEY_STORAGE, apiKeyRaw || '');
        return;
    }

    localStorage.removeItem(LEETIFY_STEAM_ID_STORAGE);
    localStorage.removeItem(LEETIFY_API_KEY_STORAGE);
}

function restoreSearchFormState() {
    const remember = localStorage.getItem(LEETIFY_REMEMBER_STORAGE) === 'true';
    const steamId = localStorage.getItem(LEETIFY_STEAM_ID_STORAGE) || '';
    const apiKey = localStorage.getItem(LEETIFY_API_KEY_STORAGE) || '';

    const steamIdInput = document.getElementById('leetify-player-input');
    const apiKeyInput = document.getElementById('leetify-apikey-input');
    const rememberCheckbox = document.getElementById('leetify-remember');

    if (rememberCheckbox) rememberCheckbox.checked = remember;
    if (steamIdInput && remember) steamIdInput.value = steamId;
    if (apiKeyInput && remember) apiKeyInput.value = apiKey;
}

async function searchLeetifyStats(event) {
    if (event) event.preventDefault();

    const steamInput = document.getElementById('leetify-player-input');
    const keyInput = document.getElementById('leetify-apikey-input');
    const rememberInput = document.getElementById('leetify-remember');
    const resultsRoot = document.getElementById('leetify-results');

    if (!steamInput || !keyInput || !rememberInput || !resultsRoot) return;

    const steamRaw = steamInput.value.trim();
    const apiKey = keyInput.value.trim();
    const remember = Boolean(rememberInput.checked);
    persistSearchFormState(remember, steamRaw, apiKey);

    const steamId64 = extractSteamId64(steamRaw);
    if (!steamId64) {
        resultsRoot.hidden = true;
        renderStatus(getFriendlyErrorMessage({ code: 'INVALID_STEAM_ID' }), 'error');
        return;
    }

    renderStatus('⏳ Chargement des stats...', 'loading');
    resultsRoot.hidden = true;

    try {
        const profileResponse = await fetchLeetifyJson('/v3/profile', steamId64, apiKey);
        let matchesResponse = {};

        try {
            matchesResponse = await fetchLeetifyJson('/v3/profile/matches', steamId64, apiKey);
        } catch (error) {
            console.warn('Unable to fetch /v3/profile/matches, fallback to profile payload:', error);
        }

        const profile = normalizeProfile(profileResponse);
        const matches = normalizeMatches(profileResponse, matchesResponse);
        const teammates = normalizeTeammates(profileResponse);

        renderProfileSection(profile);
        renderMatchesSection(matches);
        renderTeammatesSection(teammates);

        resultsRoot.hidden = false;
        renderStatus('✅ Stats Leetify chargées avec succès.', 'success');
    } catch (error) {
        console.error('Leetify stats search failed:', error);
        resultsRoot.hidden = true;
        renderStatus(getFriendlyErrorMessage(error), 'error');
    }
}

function initializeLeetifyPage() {
    // La clé API Leetify est personnelle: l'utilisateur peut la créer depuis
    // https://leetify.com/app/developer puis la renseigner dans ce formulaire.
    // Elle n'est stockée que localement dans le navigateur (localStorage).
    restoreSearchFormState();

    const form = document.getElementById('leetify-search-form');
    if (form) {
        form.addEventListener('submit', searchLeetifyStats);
    }
}

document.addEventListener('DOMContentLoaded', initializeLeetifyPage);
