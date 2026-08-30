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
        return `
            <a class="map-menu-item quickutil-widget" href="${widgetUrl}" target="_blank" rel="noopener noreferrer" data-map="${mapName}" aria-label="View QuickUtil for ${mapName}">
                <div class="map-menu-bg" style="background-image: url('${imgUrl}')"></div>
                <div class="map-menu-overlay">${mapName}</div>
                <div class="metallic-shine"></div>
            </a>
        `;
    }).join('');
}

// Render Prefire map selection menu
function renderPrefireMapMenu(items) {
    const menuGrid = document.getElementById('prefire-map-menu');
    if (!menuGrid) return;

    const mapOrder = ['Dust 2', 'Mirage', 'Inferno', 'Nuke', 'Ancient', 'Train', 'Cache', 'Anubis', 'Overpass', 'Vertigo'];

    menuGrid.innerHTML = mapOrder.map(mapName => {
        const imgUrl = prefireImages[mapName] || '';
        const widgetUrl = prefireURLs[mapName] || '#';
        return `
            <a class="map-menu-item prefire-widget" href="${widgetUrl}" target="_blank" rel="noopener noreferrer" data-map="${mapName}" aria-label="View Prefire for ${mapName}">
                <div class="map-menu-bg" style="background-image: url('${imgUrl}')"></div>
                <div class="map-menu-overlay">${mapName}</div>
                <div class="metallic-shine"></div>
            </a>
        `;
    }).join('');
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
    const grid = document.getElementById('utilities-grid');
    
    if (!grid) return;
    
    grid.innerHTML = utilities.map(utility => {
        const mapName = getMapName(utility.name);
        const logoUrl = mapLogosImages[mapName] || '';
        const videoId = extractYouTubeId(utility.videoUrl);
        
        return `
            <div class="item-card utility-card">
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
});

// Refresh matches every 5 minutes
setInterval(loadProMatches, 5 * 60 * 1000);
