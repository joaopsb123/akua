const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

const loginBtn = document.getElementById("loginBtn");
const guildsDiv = document.getElementById("guilds");
const channelsDiv = document.getElementById("channels");
const rolesDiv = document.getElementById("roles");
const userBox = document.getElementById("userBox");

document.getElementById("addBotBtn").href =
  "https://discord.com/oauth2/authorize?client_id=1403419829435760662&scope=bot%20applications.commands&permissions=8";

// LOGIN URL (com email agora)
loginBtn.href =
  `https://discord.com/oauth2/authorize?client_id=1447995914290594056&response_type=code&redirect_uri=https%3A%2F%2Fakua-lake.vercel.app%2F&scope=identify+email+guilds` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token&scope=identify email guilds`;

// TOKEN
function getToken() {
  const hash = window.location.hash;
  if (!hash) return null;
  return new URLSearchParams(hash.substring(1)).get("access_token");
}

// LOGOUT
function logout() {
  window.location.hash = "";
  location.reload();
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

// MOCK (simulação dinâmica)
function loadMockData(guildName) {
  channelsDiv.innerHTML = "";
  rolesDiv.innerHTML = "";

  const fakeChannels = [
    "#geral",
    "#comandos",
    "#logs-" + guildName.toLowerCase()
  ];

  const fakeRoles = [
    "Admin",
    "Mod",
    "Membro",
    guildName + " Team"
  ];

  fakeChannels.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = c;
    channelsDiv.appendChild(div);
  });

  fakeRoles.forEach(r => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = r;
    rolesDiv.appendChild(div);
  });
}

// INIT
async function init() {
  const token = getToken();
  if (!token) return;

  loginBtn.style.display = "none";

  const user = await getUser(token);
  const guilds = await getGuilds(token);

  // USER UI (avatar + nome + email + logout)
  userBox.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;justify-content:flex-end;">
      <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" 
           width="40" style="border-radius:50%">
      <div style="text-align:left;">
        <div>${user.username}</div>
        <small>${user.email || "sem email"}</small>
      </div>
      <button onclick="logout()" style="
        margin-left:10px;
        padding:6px 10px;
        border:none;
        border-radius:6px;
        background:#ff4d4d;
        color:white;
        cursor:pointer;
      ">Sair</button>
    </div>
  `;

  const owned = guilds.filter(g => g.owner);

  owned.forEach(g => {
    const div = document.createElement("div");
    div.className = "card";
    div.style.cursor = "pointer";

    // ICON ou fallback
    const icon = g.icon
      ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
      : "https://cdn-icons-png.flaticon.com/512/5968/5968756.png";

    div.innerHTML = `
      <img src="${icon}">
      <p>${g.name}</p>
    `;

    // CLICK → carregar canais/cargos
    div.onclick = () => loadMockData(g.name);

    guildsDiv.appendChild(div);
  });
}

init();
