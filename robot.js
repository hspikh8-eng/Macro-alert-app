// Hämta hemliga nycklar från GitHub
const { NEWS_API_KEY, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;

// --- Tabellnamn i Supabase ---
const SUPABASE_TABLE_NAME = "alerts";

async function runRobot() {
console.log("🤖 Roboten vaknar...");

// 1. Hämta en toppnyhet
const newsRes = await fetch(`https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=1&apiKey=${NEWS_API_KEY}`);
const newsData = await newsRes.json();

if (!newsData.articles || newsData.articles.length === 0) {
console.log("Inga nyheter hittades.");
return;
}

const article = newsData.articles[0];
console.log(`📰 Hittade nyhet: ${article.title}`);

// 2. Skicka till OpenAI
console.log("🧠 Skickar till OpenAI...");
const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${OPENAI_API_KEY}`
},
body: JSON.stringify({
model: "gpt-4o-mini",
messages: [
{ role: "system", content: "Return ONLY a number between 1-100. No text." },
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
console.log(`🔥 Impact Score: ${impactScore}`);

// 3. Spara i Supabase
console.log("💾 Sparar till Supabase...");
const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}`, {
method: 'POST',
headers: {
'apikey': SUPABASE_KEY,
'Authorization': `Bearer ${SUPABASE_KEY}`,
'Content-Type': 'application/json',
'Prefer': 'return=minimal'
},
body: JSON.stringify({
title: article.title,
source: article.source.name || "Unknown",
impact: parseInt(impactScore) || 0,
url: article.url,
created_at: new Date().toISOString()
})
});

if (dbRes.ok) {
console.log("✅ Sparat i databasen!");
} else {
console.error("❌ Fel vid Supabase:", await dbRes.text());
}
}

// Starta roboten
runRobot();
