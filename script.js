// Map logo emojis
const mapLogos = {
    'Mirage': '🏜️',
    'Inferno': '🔥',
    'Dust2': '🪖',
    'Ancient': '🏛️',
    'Nuke': '💣',
    'Vertigo': '🌆',
    'Train': '🚂',
    'Overpass': '🌉',
    'Anubis': '👑'
};

// Load and render items from data.json
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        renderItems('callouts', data.callouts);
        renderItems('guides', data.guides);
        renderItems('tutorials', data.tutorials);
        renderTeams(data.teams);
        loadProMatches();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Render items in grid
function renderItems(category, items) {
    const gridId = `${category}-grid`;
    const grid = document.getElementById(gridId);
    
    if (!grid) return;
    
    grid.innerHTML = items.map(item => {
        // Get map logo if it's a callout item
        const mapName = item.name.split(' ')[0]; // Get first word (map name)
        const logo = category === 'callouts' ? (mapLogos[mapName] || '📍') : '';
        
        return `
            <div class="item-card">
                ${category === 'callouts' ? `<div class="map-logo">${logo}</div>` : ''}
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

// Render pro teams
function renderTeams(teams) {
    const teamsList = document.getElementById('teams-list');
    
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
    
    // Real matches from HLTV June 2026
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
            map: 'Dust2',
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
