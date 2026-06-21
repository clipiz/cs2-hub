# CS2 Hub - Counter-Strike 2 Resource Center

A modern, responsive website for Counter-Strike 2 players to access utilities, guides, callouts, tutorials, and pro team information.

## 🎮 Features

- **Utilities Section** - Essential tools for CS2 gameplay
- **Callouts** - Interactive map callouts and positioning guides
- **Guides** - Comprehensive gameplay guides and strategies
- **Tutorials** - Video tutorials from content creators
- **Pro Teams & Matches** - Follow professional scene results and team standings
- **Modern Design** - Clean, dark-themed UI optimized for desktop
- **Fast & Lightweight** - No backend required, fully static HTML/CSS/JS
- **Easy Customization** - Simple JSON data structure for content management

## 📁 Project Structure

```
cs2-hub/
├── index.html      # Main HTML structure
├── styles.css      # Complete styling with responsive design
├── script.js       # JavaScript for loading and rendering content
├── data.json       # Content data for all categories
└── README.md       # This file
```

## 🚀 Quick Start

### Option 1: Local Development
1. Clone this repository
2. Open `index.html` in your web browser
3. That's it! No server required

### Option 2: Deploy Online (GitHub Pages) ⭐ Recommended
1. Go to your repository Settings
2. Scroll to "GitHub Pages"
3. Select `main` branch as source
4. Your site will be available at `https://clipiz.github.io/cs2-hub`

### Option 3: Deploy with Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Vercel will automatically deploy on push

## 📝 How to Edit Content

All content is stored in `data.json`. To add or modify items:

### Add a new utility:
```json
{
  "id": 7,
  "name": "Tool Name",
  "type": "Tool",
  "description": "Description of what this tool does",
  "links": [
    { "text": "Visit", "url": "https://example.com" }
  ]
}
```

### Add a new match result:
Edit the `loadProMatches()` function in `script.js`:
```javascript
{
    team1: 'Team Name',
    team2: 'Team Name',
    score1: 2,
    score2: 0,
    map: 'Mirage',
    date: 'Today'
}
```

## 🎨 Customization

### Change Colors
Edit the `:root` variables in `styles.css`:
- `--primary-color` - Main background
- `--accent-color` - Highlight/button color
- `--light-accent` - Secondary highlight

### Change Logo
Edit the `.logo h1` text in `index.html`:
```html
<h1>YOUR SITE NAME</h1>
```

### Add/Remove Categories
1. Add/remove section in `index.html`
2. Add corresponding data in `data.json`
3. Add rendering call in `script.js`

## 📱 Performance

- **Page Load:** < 1s
- **File Size:** ~100KB total (uncompressed)
- **Zero Dependencies:** No frameworks, no npm packages
- **SEO Optimized:** Semantic HTML structure

## 🔗 Useful Links for CS2

Replace placeholder URLs in `data.json` with real links:
- [ESEA](https://www.esea.net/)
- [FaceIt](https://www.faceit.com/)
- [Leetify](https://leetify.com/)
- [HLTV.org](https://www.hltv.org/)
- [Steam CS2](https://store.steampowered.com/app/730/CounterStrike_2/)

## 🛠️ Development Tips

### Add External API Integration
To use real match data, modify `loadProMatches()` to fetch from an API:
```javascript
async function loadProMatches() {
    const response = await fetch('https://api.example.com/matches');
    const matches = await response.json();
    // ... render matches
}
```

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

This project is free to use and modify. Feel free to adapt it for your own community or learning purposes.

## 🤝 Contributing

To improve this project:
1. Add useful resources and links
2. Improve the design
3. Add new features
4. Fix bugs

---

**Made for the CS2 Community** ❤️
