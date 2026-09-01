const TOKEN = process.env.BRAWL_API_TOKEN;
const TAG = process.env.PLAYER_TAG || "GRPCRQVQ";

if (!TOKEN) {
  console.error("Falta la variable BRAWL_API_TOKEN");
  process.exit(1);
}

// Usamos el proxy de RoyaleAPI porque los runners de GitHub Actions
// no tienen una IP fija que se pueda poner en la whitelist de la API oficial.
const url = `https://bsproxy.royaleapi.dev/v1/players/%23${TAG}`;

const res = await fetch(url, {
  headers: { Authorization: `Bearer ${TOKEN}` }
});

if (!res.ok) {
  console.error("Error consultando la API:", res.status, await res.text());
  process.exit(1);
}

const player = await res.json();
const bestBrawler = [...player.brawlers].sort((a, b) => b.trophies - a.trophies)[0];

const stats = {
  updatedAt: new Date().toISOString(),
  trophies: player.trophies,
  highestTrophies: player.highestTrophies,
  expLevel: player.expLevel,
  victories3v3: player["3vs3Victories"],
  soloVictories: player.soloVictories,
  duoVictories: player.duoVictories,
  club: player.club ? player.club.name : null,
  bestBrawler: bestBrawler ? { name: bestBrawler.name, trophies: bestBrawler.trophies } : null
};

const fs = await import("node:fs/promises");
await fs.writeFile("stats.json", JSON.stringify(stats, null, 2) + "\n");
console.log("stats.json actualizado:", stats);
