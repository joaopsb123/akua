const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

const loginBtn = document.getElementById("loginBtn");
const guildsDiv = document.getElementById("guilds");
const channelsDiv = document.getElementById("channels");
const rolesDiv = document.getElementById("roles");
const userBox = document.getElementById("userBox");

document.getElementById("addBotBtn").href =
  "https://discord.com/oauth2/authorize?client_id=1403419829435760662&scope=bot%20applications.commands&permissions=8";

loginBtn.href =
  `https://discord.com/oauth2/authorize?client_id=1447995914290594056&response_type=code&redirect_uri=https%3A%2F%2Fakua-lake.vercel.app%2F&scope=identify` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token&scope=identify guilds`;

function getToken() {
  const hash = window.location.hash;
  if (!hash) return null;
  return new URLSearchParams(hash.substring(1)).get("access_token");
}

async function getUser(token) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

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

  const owned = guilds.filter(g => g.owner);

  owned.forEach(g => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `<p>${g.name}</p>`;
    guildsDiv.appendChild(div);
  });

  // 🔥 MOCK DATA (simulação)
  const fakeChannels = ["#geral", "#comandos", "#logs"];
  const fakeRoles = ["Admin", "Mod", "Membro"];

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

init();
