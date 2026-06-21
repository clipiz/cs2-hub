// Load and render items from data.json
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        renderItems('utilities', data.utilities);
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
    
    grid.innerHTML = items.map(item => `
        <div class="item-card">
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
    `).join('');
}

// Render pro teams
function renderTeams(teams) {
    const teamsList = document.getElementById('teams-list');
    
    teamsList.innerHTML = teams.map((team, index) => `
        <div class="team-item">
            <div>
                <div class="team-name">#${index + 1} ${team.name}</div>
                <div style="font-size: 0.8em; color: #95a5a6;">${team.region}</div>
            </div>
            <div class="team-rating">${team.rating}</div>
        </div>
    `).join('');
}

// Load Pro Matches (simulated data - can be replaced with real API)
function loadProMatches() {
    const matchesList = document.getElementById('matches-list');
    
    // Simulated matches data
    const matches = [
        {
            team1: 'FaZe Clan',
            team2: 'G2 Esports',
            score1: 2,
            score2: 0,
            map: 'Mirage',
            date: 'Today'
        },
        {
            team1: 'Natus Vincere',
            team2: 'Vitality',
            score1: 1,
            score2: 2,
            map: 'Inferno',
            date: 'Today'
        },
        {
            team1: 'Liquid',
            team2: 'FaZe Clan',
            score1: 0,
            score2: 2,
            map: 'Ancient',
            date: 'Yesterday'
        },
        {
            team1: 'G2 Esports',
            team2: 'Imperial Esports',
            score1: 2,
            score2: 1,
            map: 'Dust2',
            date: 'Yesterday'
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
                📍 ${match.map} • ${match.date}
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
