const HLTV_API_BASE_URL = 'https://api.csapi.de';
const HLTV_API_ENDPOINTS = {
    live: '/matches/?limit=30&offset=0',
    upcoming: '/matches/?limit=30&offset=0',
    results: '/matches/latest?limit=30&offset=0',
    rankings: '/rankings/'
};
const HLTV_REQUEST_TIMEOUT_MS = 12000;
const HLTV_LIVE_REFRESH_MS = 90 * 1000;
const HLTV_MAX_MATCHES = 9;
const HLTV_MAX_TEAMS = 8;

// Current default source: CSAPI (api.csapi.de), last verified from public docs on 2026-09-10.
// Community HLTV-derived APIs can change or disappear, so keep base URL and endpoints above swappable.
// If the live source is unreachable or blocked (network/CORS/rate-limit), curated fallbacks below keep UI usable.
const CURATED_FALLBACK_MATCHES = [
    {
        id: 'fallback-upcoming-hltv',
        status: 'upcoming',
        badge: '🕒 À VENIR',
        team1: { name: 'Top Tier CS2', logo: '' },
        team2: { name: 'Calendrier HLTV', logo: '' },
        score: '',
        event: 'Prochains matchs compétitifs',
        time: '',
        format: '',
        extra: 'Consulte la liste complète directement sur HLTV',
        sourceUrl: 'https://www.hltv.org/matches'
    },
    {
        id: 'fallback-results-hltv',
        status: 'completed',
        badge: '✅ TERMINÉ',
        team1: { name: 'Derniers matchs', logo: '' },
        team2: { name: 'Résultats HLTV', logo: '' },
        score: '',
        event: 'Résultats récents de la scène pro',
        time: '',
        format: '',
        extra: 'Voir tous les résultats mis à jour',
        sourceUrl: 'https://www.hltv.org/results'
    }
];

const CURATED_FALLBACK_RANKINGS = [
    { id: 'fallback-team-vitality', name: 'Vitality', ranking: 1, logo: '', subtitle: 'Fallback local' },
    { id: 'fallback-team-faze', name: 'FaZe', ranking: 2, logo: '', subtitle: 'Fallback local' },
    { id: 'fallback-team-navi', name: 'NAVI', ranking: 3, logo: '', subtitle: 'Fallback local' },
    { id: 'fallback-team-spirit', name: 'Spirit', ranking: 4, logo: '', subtitle: 'Fallback local' },
    { id: 'fallback-team-g2', name: 'G2', ranking: 5, logo: '', subtitle: 'Fallback local' }
];

let matchesRefreshIntervalId = null;
let matchesLiveCount = 0;
let matchesRefreshInFlight = null;
let matchesPageInitialized = false;
let currentNonLiveMatches = [];
let pendingFullRefresh = false;

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return entities[character] || character;
    });
}

function buildHltvUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return `${HLTV_API_BASE_URL.replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`;
}

function createMatchError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function getFriendlyMatchErrorMessage(error) {
    if (!error) return 'Impossible de charger les matchs pour le moment.';
    if (error.code === 'RATE_LIMIT') return 'Le service de matchs est temporairement limité (HTTP 429). Réessaie dans quelques instants.';
    if (error.code === 'NETWORK') return 'Impossible de contacter le proxy HLTV (réseau/CORS/timeout). Réessaie plus tard.';
    if (error.code === 'EMPTY') return 'Aucune donnée de match n’a été renvoyée pour le moment.';
    return error.message || 'Impossible de charger les matchs pour le moment.';
}

function formatDateTime(value) {
    if (!value) return 'Horaire inconnu';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return escapeHtml(String(value));
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(parsed);
}

function parseDateValue(value) {
    if (!value) return 0;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function hasDefinedScore(team1Score, team2Score) {
    return [team1Score, team2Score].every(value => value !== undefined && value !== null && value !== '');
}

function setMatchesFeedback(message, variant = '') {
    const feedback = document.getElementById('matches-feedback');
    if (!feedback) return;

    feedback.className = variant ? `esport-feedback esport-feedback--${variant}` : 'esport-feedback';
    feedback.textContent = message || '';
    feedback.hidden = !message;
}

function setLastUpdatedLabel(date = new Date(), messagePrefix = 'Dernière mise à jour') {
    const label = document.getElementById('matches-updated-at');
    if (!label) return;

    label.hidden = false;
    label.textContent = `${messagePrefix} : ${new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date)}`;
}

function setRefreshButtonState(isLoading) {
    const button = document.getElementById('matches-refresh-btn');
    if (!button) return;

    button.disabled = isLoading;
    button.textContent = isLoading ? '⏳ Actualisation...' : '🔄 Actualiser';
}

async function fetchHltvJson(path, { optional = false } = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HLTV_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(buildHltvUrl(path), { signal: controller.signal });

        if (optional && response.status === 404) return [];
        if (response.status === 429) throw createMatchError('RATE_LIMIT');
        if (!response.ok) {
            throw createMatchError('HTTP_ERROR', `Erreur API HLTV (${response.status}).`);
        }

        const payload = await response.json();
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.matches)) return payload.matches;
        if (Array.isArray(payload?.results)) return payload.results;
        if (Array.isArray(payload?.teams)) return payload.teams;
        if (Array.isArray(payload?.rankings)) return payload.rankings;
        return [];
    } catch (error) {
        if (error?.code) throw error;
        if (error?.name === 'AbortError' || error instanceof TypeError) {
            throw createMatchError('NETWORK');
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function dedupeMatches(matches) {
    const seen = new Set();
    return matches.filter(match => {
        const hasGeneratedId = /^(upcoming|live|result)-\d+$/.test(String(match.id || ''));
        const key = hasGeneratedId
            ? `${match.team1.name}:${match.team2.name}:${match.time}:${match.event}`
            : String(match.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getTeamsFromMatch(match) {
    if (Array.isArray(match?.teams) && match.teams.length >= 2) {
        return match.teams;
    }

    const rawTeam1 = match?.team1;
    const rawTeam2 = match?.team2;
    const team1 = rawTeam1
        ? (typeof rawTeam1 === 'object'
            ? { name: rawTeam1.name || rawTeam1.team || '', logo: rawTeam1.logo || rawTeam1.image || '', result: rawTeam1.score ?? rawTeam1.result ?? match.score1 }
            : { name: rawTeam1, logo: match.team1Logo, result: match.score1 })
        : null;
    const team2 = rawTeam2
        ? (typeof rawTeam2 === 'object'
            ? { name: rawTeam2.name || rawTeam2.team || '', logo: rawTeam2.logo || rawTeam2.image || '', result: rawTeam2.score ?? rawTeam2.result ?? match.score2 }
            : { name: rawTeam2, logo: match.team2Logo, result: match.score2 })
        : null;
    return [team1, team2].filter(Boolean);
}

function hasMatchResult(match, teams) {
    return hasDefinedScore(
        teams[0]?.result ?? match?.score1 ?? match?.team1?.score,
        teams[1]?.result ?? match?.score2 ?? match?.team2?.score
    );
}

function getMatchState(match, teams) {
    const rawStatus = String(match?.status || match?.state || '').toLowerCase();
    const hasResult = hasMatchResult(match, teams);
    const isCompletedStatus = ['completed', 'finished', 'final', 'closed', 'ended', 'over'].some(keyword => rawStatus.includes(keyword));
    const isLiveStatus = ['live', 'ongoing', 'in_progress', 'running'].some(keyword => rawStatus.includes(keyword));

    if (isCompletedStatus) return 'completed';
    if (isLiveStatus) return 'live';
    if (hasResult) return 'completed';
    return 'upcoming';
}

function normalizeUpcomingMatches(matches) {
    return matches.map((match, index) => {
        const teams = getTeamsFromMatch(match);
        return {
            id: match.id || match.matchId || `upcoming-${index}`,
            status: 'upcoming',
            badge: '🕒 À VENIR',
            team1: teams[0] || { name: 'TBD', logo: '' },
            team2: teams[1] || { name: 'TBD', logo: '' },
            score: '',
            event: match?.event?.name || match?.event || 'Événement HLTV',
            time: match.time || match.startTime || match.date || match.datetime || '',
            format: match.maps || match.format || match.bestOf || match.best_of || '',
            extra: '',
            derivedState: getMatchState(match, teams)
        };
    }).filter(match => (match.team1.name || match.team2.name) && match.derivedState === 'upcoming')
        .map(({ derivedState: _derivedState, ...match }) => match);
}

function normalizeLiveMatches(matches) {
    return matches.map((match, index) => {
        const teams = getTeamsFromMatch(match);
        const score = match.score || (hasDefinedScore(teams[0]?.result, teams[1]?.result)
            ? `${teams[0]?.result} - ${teams[1]?.result}`
            : '');

        return {
            id: match.id || match.matchId || `live-${index}`,
            status: 'live',
            badge: '🔴 EN DIRECT',
            team1: teams[0] || { name: match.team1 || 'TBD', logo: '' },
            team2: teams[1] || { name: match.team2 || 'TBD', logo: '' },
            score,
            event: match?.event?.name || match?.event || 'Live HLTV',
            time: match.time || match.startedAt || match.startTime || match.date || '',
            format: match.maps || match.map || match.format || match.bestOf || match.best_of || '',
            extra: match.series || '',
            derivedState: getMatchState(match, teams)
        };
    }).filter(match => (match.team1.name || match.team2.name) && match.derivedState === 'live')
        .map(({ derivedState: _derivedState, ...match }) => match);
}

function normalizeResults(matches) {
    return matches.map((match, index) => {
        const teams = getTeamsFromMatch(match);
        const score = hasDefinedScore(teams[0]?.result, teams[1]?.result)
            ? `${teams[0]?.result} - ${teams[1]?.result}`
            : '';

        return {
            id: match.id || match.matchId || `result-${index}`,
            status: 'completed',
            badge: '✅ TERMINÉ',
            team1: teams[0] || { name: 'TBD', logo: '' },
            team2: teams[1] || { name: 'TBD', logo: '' },
            score,
            event: match?.event?.name || match?.event || 'Résultat HLTV',
            time: match.time || match.date || match.startedAt || '',
            format: match.maps || match.format || match.bestOf || match.best_of || '',
            extra: '',
            derivedState: getMatchState(match, teams)
        };
    }).filter(match => (match.team1.name || match.team2.name) && match.derivedState === 'completed')
        .map(({ derivedState: _derivedState, ...match }) => match);
}

function renderTeamLine(team) {
    return `
        <span class="match-team">
            ${team?.logo ? `<img src="${escapeHtml(team.logo)}" alt="" class="match-team-logo" loading="lazy" referrerpolicy="no-referrer">` : ''}
            <span>${escapeHtml(team?.name || 'TBD')}</span>
        </span>
    `;
}

function renderMatchesList(matches) {
    const matchesList = document.getElementById('matches-list');
    if (!matchesList) return;

    if (!matches.length) {
        matchesList.innerHTML = '<div class="empty-state">Aucun match live, à venir ou récent n’est disponible pour le moment.</div>';
        return;
    }

    matchesList.innerHTML = matches.map(match => `
        ${renderMatchCardHtml(match)}
    `).join('');
}

function renderMatchCardHtml(match) {
    return `
        <article class="match-card match-card--${match.status}">
            <div class="match-header">
                <span class="match-badge match-badge--${match.status}">${match.badge}</span>
                ${match.score ? `<div class="match-score">${escapeHtml(match.score)}</div>` : ''}
            </div>
            <div class="match-teams">
                ${renderTeamLine(match.team1)}
                <span class="match-versus">vs</span>
                ${renderTeamLine(match.team2)}
            </div>
            <div class="match-info">${escapeHtml(match.event)}${match.format ? ` • ${escapeHtml(match.format)}` : ''}</div>
            <div class="match-info">${escapeHtml(formatDateTime(match.time))}${match.extra ? ` • ${escapeHtml(match.extra)}` : ''}</div>
            ${match.sourceUrl ? `<div class="match-info"><a href="${escapeHtml(match.sourceUrl)}" target="_blank" rel="noopener noreferrer">Voir sur HLTV.org ↗</a></div>` : ''}
        </article>
    `;
}

function normalizeRankings(teams) {
    return teams.map((team, index) => ({
        id: team.id || `team-${index}`,
        name: team.name || team.team || `Équipe #${index + 1}`,
        ranking: Number(team.ranking || team.rank || index + 1),
        logo: team.logo || team.image || '',
        subtitle: Array.isArray(team.players) && team.players.length
            ? `${team.players.slice(0, 3).map(player => player.nickname || player.name).filter(Boolean).join(', ')}`
            : 'Classement HLTV'
    })).filter(team => team.name);
}

function renderRankings(teams) {
    const teamsList = document.getElementById('teams-list');
    if (!teamsList) return;

    if (!teams.length) {
        const hasRenderedTeams = Boolean(teamsList.querySelector('.team-item'));
        const stillLoading = /Chargement du classement/i.test(teamsList.textContent || '');
        if (!hasRenderedTeams && stillLoading) {
            teamsList.innerHTML = '<div class="empty-state">Classement HLTV indisponible pour le moment.</div>';
        }
        return;
    }

    teamsList.innerHTML = teams.slice(0, HLTV_MAX_TEAMS).map(team => `
        <div class="team-item">
            <div class="team-summary">
                ${team.logo ? `<img src="${escapeHtml(team.logo)}" alt="" class="team-logo" loading="lazy" referrerpolicy="no-referrer">` : ''}
                <div>
                    <div class="team-name">#${escapeHtml(team.ranking)} ${escapeHtml(team.name)}</div>
                    <div class="team-subtitle">${escapeHtml(team.subtitle)}</div>
                </div>
            </div>
            <div class="team-rating">Top ${escapeHtml(team.ranking)}</div>
        </div>
    `).join('');
}

function ensureFallbackRankings() {
    const teamsList = document.getElementById('teams-list');
    if (!teamsList) return;
    if (teamsList.querySelector('.team-item')) return;
    renderRankings(CURATED_FALLBACK_RANKINGS);
}

function stopLiveRefresh() {
    if (matchesRefreshIntervalId) {
        window.clearInterval(matchesRefreshIntervalId);
        matchesRefreshIntervalId = null;
    }
}

function refreshLiveMatchesOnly() {
    loadEsportMatches({ refreshLiveOnly: true }).catch(error => {
        console.warn('Live refresh failed:', error);
    });
}

function syncLiveRefreshState() {
    if (document.hidden || matchesLiveCount === 0) {
        stopLiveRefresh();
        return;
    }

    if (!matchesRefreshIntervalId) {
        matchesRefreshIntervalId = window.setInterval(refreshLiveMatchesOnly, HLTV_LIVE_REFRESH_MS);
    }
}

async function loadEsportMatches({ refreshLiveOnly = false } = {}) {
    if (matchesRefreshInFlight) {
        if (!refreshLiveOnly) {
            pendingFullRefresh = true;
            return matchesRefreshInFlight.finally(() => {
                if (!pendingFullRefresh || matchesRefreshInFlight) return undefined;
                pendingFullRefresh = false;
                return loadEsportMatches();
            });
        }
        return matchesRefreshInFlight;
    }

    const matchesList = document.getElementById('matches-list');
    if (!matchesList) return Promise.resolve();

    setRefreshButtonState(true);
    if (!refreshLiveOnly) {
        matchesList.innerHTML = '<div class="loading">⏳ Chargement des matchs HLTV...</div>';
        setMatchesFeedback('');
    }

    matchesRefreshInFlight = (async () => {
        try {
            if (refreshLiveOnly) {
                const liveMatchesRaw = await fetchHltvJson(HLTV_API_ENDPOINTS.live);
                const liveMatches = normalizeLiveMatches(liveMatchesRaw);
                matchesLiveCount = liveMatches.length;
                renderMatchesList(dedupeMatches([...liveMatches, ...currentNonLiveMatches]).slice(0, HLTV_MAX_MATCHES));

                setLastUpdatedLabel(new Date(), liveMatches.length ? 'Scores live actualisés' : 'Vérification live');
                syncLiveRefreshState();
                return;
            }

            const liveRequest = fetchHltvJson(HLTV_API_ENDPOINTS.live);
            const upcomingRequest = HLTV_API_ENDPOINTS.upcoming === HLTV_API_ENDPOINTS.live
                ? liveRequest
                : fetchHltvJson(HLTV_API_ENDPOINTS.upcoming);
            const [liveResult, upcomingResult, resultsResult, rankingsResult] = await Promise.allSettled([
                liveRequest,
                upcomingRequest,
                fetchHltvJson(HLTV_API_ENDPOINTS.results),
                fetchHltvJson(HLTV_API_ENDPOINTS.rankings, { optional: true })
            ]);

            const liveMatches = normalizeLiveMatches(liveResult.status === 'fulfilled' ? liveResult.value : []);
            matchesLiveCount = liveMatches.length;

            const upcomingMatches = normalizeUpcomingMatches(upcomingResult.status === 'fulfilled' ? upcomingResult.value : [])
                .sort((a, b) => parseDateValue(a.time) - parseDateValue(b.time));
            const completedMatches = normalizeResults(resultsResult.status === 'fulfilled' ? resultsResult.value : [])
                .sort((a, b) => parseDateValue(b.time) - parseDateValue(a.time));

            currentNonLiveMatches = dedupeMatches([
                ...upcomingMatches,
                ...completedMatches
            ]);
            const combinedMatches = dedupeMatches([
                ...liveMatches,
                ...currentNonLiveMatches
            ]).slice(0, HLTV_MAX_MATCHES);

            if (!combinedMatches.length) {
                const matchSourceResults = [liveResult, upcomingResult, resultsResult];
                const allMatchSourcesFailed = matchSourceResults.every(result => result.status === 'rejected');
                if (allMatchSourcesFailed) {
                    renderMatchesList(CURATED_FALLBACK_MATCHES);
                    if (rankingsResult.status === 'fulfilled') {
                        const normalizedRankings = normalizeRankings(rankingsResult.value);
                        if (normalizedRankings.length) {
                            renderRankings(normalizedRankings);
                        } else {
                            ensureFallbackRankings();
                        }
                    } else {
                        ensureFallbackRankings();
                    }
                    setMatchesFeedback('Flux HLTV indisponible pour le moment — fallback activé. Consulte aussi HLTV.org pour le live.', 'error');
                    setLastUpdatedLabel(new Date(), 'Fallback local');
                    syncLiveRefreshState();
                    return;
                }

                renderMatchesList([]);
                if (rankingsResult.status === 'fulfilled') {
                    const normalizedRankings = normalizeRankings(rankingsResult.value);
                    if (normalizedRankings.length) {
                        renderRankings(normalizedRankings);
                    } else {
                        ensureFallbackRankings();
                    }
                } else {
                    ensureFallbackRankings();
                }
                setMatchesFeedback('Aucun match n’est disponible pour le moment sur la source HLTV.');
                setLastUpdatedLabel();
                syncLiveRefreshState();
                return;
            }

            renderMatchesList(combinedMatches);

            if (rankingsResult.status === 'fulfilled') {
                const normalizedRankings = normalizeRankings(rankingsResult.value);
                if (normalizedRankings.length) {
                    renderRankings(normalizedRankings);
                } else {
                    ensureFallbackRankings();
                }
            } else {
                ensureFallbackRankings();
            }

            setMatchesFeedback(
                [liveResult, upcomingResult, resultsResult].some(result => result.status === 'rejected')
                    ? 'Certaines données HLTV n’ont pas pu être chargées, mais l’affichage partiel reste disponible.'
                    : liveMatches.length
                        ? `Mise à jour auto activée toutes les ${Math.round(HLTV_LIVE_REFRESH_MS / 1000)}s pendant les matchs en direct.`
                        : 'Aucun match en direct pour le moment — utilise Actualiser pour recharger manuellement.'
            );
            setLastUpdatedLabel();
            syncLiveRefreshState();
        } catch (error) {
            console.error('Unable to load HLTV matches:', error);
            stopLiveRefresh();
            matchesLiveCount = 0;
            if (!refreshLiveOnly) {
                renderMatchesList(CURATED_FALLBACK_MATCHES);
                ensureFallbackRankings();
            }
            setMatchesFeedback(
                refreshLiveOnly
                    ? 'Le rafraîchissement live a échoué ; les derniers scores affichés ont été conservés.'
                    : `${getFriendlyMatchErrorMessage(error)} Fallback activé : consulte aussi HLTV.org.`,
                'error'
            );
            if (!refreshLiveOnly) {
                setLastUpdatedLabel(new Date(), 'Fallback local');
            }
        } finally {
            setRefreshButtonState(false);
            matchesRefreshInFlight = null;
        }
    })();

    return matchesRefreshInFlight;
}

function initializeMatchesPage() {
    if (!document.getElementById('matches-list') || matchesPageInitialized) return;
    matchesPageInitialized = true;

    const refreshButton = document.getElementById('matches-refresh-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            loadEsportMatches().catch(error => {
                console.error('Manual HLTV refresh failed:', error);
            });
        });
    }

    document.addEventListener('visibilitychange', syncLiveRefreshState);
    window.addEventListener('pagehide', stopLiveRefresh);
    window.addEventListener('pageshow', syncLiveRefreshState);
    window.addEventListener('beforeunload', stopLiveRefresh);

    loadEsportMatches().catch(error => {
        console.error('Initial HLTV load failed:', error);
    });
}

document.addEventListener('DOMContentLoaded', initializeMatchesPage);
