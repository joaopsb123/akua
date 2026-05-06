const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

const loginBtn = document.getElementById("loginBtn");
const userBox = document.getElementById("userBox");
const guildsDiv = document.getElementById("guilds");
const addBotBtn = document.getElementById("addBotBtn");

// 👉 LOGIN
const authURL =
  `https://discord.com/oauth2/authorize?client_id=1447995914290594056&response_type=code&redirect_uri=https%3A%2F%2Fakua-lake.vercel.app%2F&scope=identify` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token` +
  `&scope=identify guilds`;

loginBtn.href = authURL;

// 👉 ADD BOT
addBotBtn.href = "https://discord.com/oauth2/authorize?client_id=1403419829435760662&scope=bot%20applications.commands&permissions=8";

// TOKEN
function getToken() {
  const hash = window.location.hash;
  if (!hash) return null;
  return new URLSearchParams(hash.substring(1)).get("access_token");
}

// USER
async function getUser(token) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

// GUILDS
async function getGuilds(token) {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function init() {
  const token = getToken();
  if (!token) return;

  loginBtn.style.display = "none";

  const user = await getUser(token);
  const guilds = await getGuilds(token);

  userBox.innerHTML = `
    <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" width="40" style="border-radius:50%">
  `;

  // 👉 mostrar só servidores onde és dono
  const owned = guilds.filter(g => (g.owner));

  owned.forEach(g => {
    const div = document.createElement("div");
    div.className = "guild";

    const icon = g.icon
      ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
      : "https://via.placeholder.com/60";

    div.innerHTML = `
      <img src="${icon}">
      <p>${g.name}</p>
    `;

    guildsDiv.appendChild(div);
  });
}

init();
