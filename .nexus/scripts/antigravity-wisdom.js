const fs = require('fs');
const path = require('path');

/**
 * 🧠 ANTIGRAVITY WISDOM API v1.0
 * Goal: Search and retrieve historical implementation patterns.
 * Usage: node scripts/antigravity-wisdom.js "refactor"
 */

const REPO_ROOT = path.resolve(__dirname, '..');
const WISDOM_PATH = path.join(REPO_ROOT, '.antigravity/intelligence/lessons.json');

function queryWisdom(query) {
    if (!fs.existsSync(WISDOM_PATH)) {
        console.error('❌ Wisdom base introuvable. Crée `.antigravity/intelligence/lessons.json`.');
        process.exit(1);
    }

    const wisdom = JSON.parse(fs.readFileSync(WISDOM_PATH, 'utf8'));
    const results = [];

    // Search in lessons
    wisdom.lessons.forEach(lesson => {
        const matchesQuery = lesson.summary.toLowerCase().includes(query.toLowerCase()) || 
                             lesson.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        if (matchesQuery) {
            results.push(lesson);
        }
    });

    if (results.length === 0) {
        console.log(`📭 Aucune sagesse trouvée pour : "${query}"`);
    } else {
        console.log(`🧠 Sagesse identifiée [${results.length} résultats] :`);
        console.log(JSON.stringify(results, null, 2));
    }
}

const userQuery = process.argv[2];
if (!userQuery) {
    console.log('Usage: node scripts/antigravity-wisdom.js <query>');
    process.exit(1);
}

queryWisdom(userQuery);
