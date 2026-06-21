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
        initializeSidebarNavigation();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Map logo image paths
const mapLogosImages = {
    'Mirage': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/mirage.png',
    'Inferno': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/inferno.png',
    'Dust2': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/dust2.png',
    'Ancient': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/ancient.png',
    'Nuke': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/nuke.png',
    'Vertigo': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/vertigo.png',
    'Train': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/train.png',
    'Overpass': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/overpass.png',
    'Anubis': 'https://raw.githubusercontent.com/clipiz/cs2-hub/main/images/anubis.png'
};

// Render items in grid
function renderItems(category, items) {
    const gridId = `${category}-grid`;
    const grid = document.getElementById(gridId);
    
    if (!grid) return;
    
    grid.innerHTML = items.map(item => {
        const mapName = item.name.split(' ')[0];
        const logoUrl = category === 'callouts' ? mapLogosImages[mapName] : '';
        
        return `
            <div class="item-card">
                ${category === 'callouts' ? `<div class="map-logo" style="background-image: url('${logoUrl}')"></div>` : ''}
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
        const mapName = utility.name.split(' ')[0];
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

// Initialize sidebar navigation
function initializeSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    // Set home as active by default
    document.querySelector('[data-section="home"]')?.classList.add('active');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Smooth scroll to section
            const section = link.getAttribute('data-section');
            const element = document.getElementById(section);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Update active link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('.category-section, #home');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    });
}

// Load everything when page is ready
document.addEventListener('DOMContentLoaded', loadData);

// Optional: Refresh matches every 5 minutes
setInterval(loadProMatches, 5 * 60 * 1000);
