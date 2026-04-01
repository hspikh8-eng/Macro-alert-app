// Hämta hemliga nycklar från GitHub
const { NEWS_API_KEY, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;

// --- robot.js ---
const SUPABASE_TABLE_NAME = "alerts";

async function runRobot() {
console.log("🤖 Roboten vaknar...");

// 1. Hämta en toppnyhet inom business från NewsAPI
const newsRes = await fetch(`https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=1&apiKey=${NEWS_API_KEY}`);
const newsData = await newsRes.json();

if (!newsData.articles || newsData.articles.length === 0) {
console.log("Inga nyheter hittades.");
return;
}

const article = newsData.articles[0];
console.log(`📰 Hittade nyhet: ${article.title}`);

// 2. Be OpenAI analysera nyheten (Simpel test-prompt)
console.log("🧠 Skickar till OpenAI för analys...");
const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${OPENAI_API_KEY}`
},
body: JSON.stringify({
model: "gpt-4o-mini", // Billig och snabb modell
messages: [
{ role: "system", content: "Du är en finansiell AI. Läs rubriken. Svara ENDAST med ett nummer mellan 1-100 som visar hur mycket denna nyhet påverkar aktiemarknaden." },
{ role: "user", content: article.title }
]
})
});

const aiData = await aiRes.json();

console.log("AI DATA:", JSON.stringify(aiData, null, 2));

if (!aiData.choices || !aiData.choices[0]) {
throw new Error("OpenAI svarade inte korrekt");
}

const impactScore = aiData.choices[0].message.content.trim();
console.log(`🔥 Impact Score från AI: ${impactScore}`);

// 3. Spara direkt i din Supabase-databas
console.log("💾 Sparar till Supabase...");
const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}`, {
method: 'POST',
headers: {
'apikey': SUPABASE_KEY,
'Authorization': `Bearer ${SUPABASE_KEY}`,
'Content-Type': 'application/json',
'Prefer': 'return=minimal' // Behöver inget svar tillbaka
},
// Här bestämmer du vilka kolumner datan ska hamna i.
// Måste matcha exakt vad kolumnerna heter i din Supabase-tabell!
body: JSON.stringify({
event: analysis.event,
impact_score: parseInt(analysis.impact_score) || 0,
assets: Array.isArray(analysis.assets) ? analysis.assets.join(", ") : (analysis.assets || "Inga"),
reaction: analysis.reaction,
confidence: analysis.confidence,
source: article.source.name || "Unknown",
url: article.url
})


if (dbRes.ok) {
console.log("✅ Succé! Nyheten är analyserad och sparad i databasen.");
} else {
console.error("❌ Fel vid sparning till databasen:", await dbRes.text());
}
}

// Starta roboten
runRobot();
