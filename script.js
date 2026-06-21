// Load and render items from data.json
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        renderItems('callouts', data.callouts);
        renderItems('guides', data.guides);
        renderUtilities(data.utilities);
        renderItems('tutorials', data.tutorials);
        renderTeams(data.teams);
        loadProMatches();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

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
    'Yprac': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/ypraclogo.png'
};

// Extract map name from item name (handles both "MapName" and "Map Name" formats)
function getMapName(itemName) {
    // Check for Yprac first
    if (itemName.includes('Yprac')) return 'Yprac';
    
    // Check for two-word maps
    if (itemName.includes('Dust 2')) return 'Dust 2';
    
    // Otherwise, get the first word
    return itemName.split(' ')[0];
}

// Render items in grid
function renderItems(category, items) {
    const gridId = `${category}-grid`;
    const grid = document.getElementById(gridId);
    
    if (!grid) return;
    
    grid.innerHTML = items.map(item => {
        const mapName = getMapName(item.name);
        const logoUrl = (category === 'callouts' || category === 'widgets') ? mapLogosImages[mapName] : '';
        
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
                    <a href="${utility.videoUrl}" target="_blank" rel="noopener noreferrer" class="item-link">
                        📹 Watch Video
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
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

// Load Pro Matches from HLTV-inspired data (June 2026)
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
document.addEventListener('DOMContentLoaded', loadData);

// Optional: Refresh matches every 5 minutes
setInterval(loadProMatches, 5 * 60 * 1000);
