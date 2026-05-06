import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =========================
   CONFIG
========================= */

const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

const ADD_BOT_URL =
  "https://discord.com/oauth2/authorize?client_id=1403419829435760662&scope=bot%20applications.commands&permissions=8";

/* 🔥 FIREBASE (corrigido: NÃO uses URL aqui) */
const firebaseConfig = {
  apiKey: "AIzaSyDJ_FRnNVJYOPbKUQZpx43WgYmqA-u-CB0",
  authDomain: "bot-discord-4d74d.firebaseapp.com",
  projectId: "bot-discord-4d74d",
  storageBucket: "bot-discord-4d74d.appspot.com",
  messagingSenderId: "514594475218",
  appId: "1:514594475218:web:e0bb790ab1cea3b4ef310b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   ELEMENTOS
========================= */

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const addBotBtn = document.getElementById("addBotBtn");

const userBox = document.getElementById("userBox");
const guildsDiv = document.getElementById("guilds");
const guildCount = document.getElementById("guildCount");

const channelsDiv = document.getElementById("channels");
const rolesDiv = document.getElementById("roles");

const selectedGuildName = document.getElementById("selectedGuildName");
const selectedGuildId = document.getElementById("selectedGuildId");
const syncedState = document.getElementById("syncedState");

/* =========================
   AUTH
========================= */

const TOKEN_KEY = "aqua_token";
const SELECTED_GUILD_KEY = "aqua_guild";

/* LOGIN URL (corrigido) */
loginBtn.href =
  `https://discord.com/oauth2/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token` +
  `&scope=identify%20email%20guilds`;

addBotBtn.href = ADD_BOT_URL;

/* =========================
   TOKEN
========================= */

function getToken() {
  const hash = window.location.hash;
  if (hash.includes("access_token=")) {
    const token = new URLSearchParams(hash.slice(1)).get("access_token");
    localStorage.setItem(TOKEN_KEY, token);
    window.location.hash = "";
    return token;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SELECTED_GUILD_KEY);
  location.reload();
}

window.logout = logout;

/* =========================
   DISCORD API
========================= */

async function api(path, token) {
  const res = await fetch(`https://discord.com/api${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Discord API error");
  return res.json();
}

const getUser = (t) => api("/users/@me", t);
const getGuilds = (t) => api("/users/@me/guilds", t);

/* =========================
   UI HELPERS
========================= */

function escapeHtml(v) {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function empty(el, text) {
  el.innerHTML = `<div class="empty">${escapeHtml(text)}</div>`;
}

function guildIcon(g) {
  return g.icon
    ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
    : "https://cdn-icons-png.flaticon.com/512/2111/2111370.png";
}

/* =========================
   FIREBASE LOAD
========================= */

async function loadGuild(guild) {
  selectedGuildName.textContent = guild.name;
  selectedGuildId.textContent = guild.id;
  syncedState.textContent = "A carregar...";

  empty(channelsDiv, "A carregar canais...");
  empty(rolesDiv, "A carregar cargos...");

  try {
    const snap = await getDoc(doc(db, "guilds", String(guild.id)));

    if (!snap.exists()) {
      syncedState.textContent = "Servidor ainda não sincronizado pelo bot";
      empty(channelsDiv, "Sem dados");
      empty(rolesDiv, "Sem dados");
      return;
    }

    const data = snap.data();

    renderChannels(data.channels || []);
    renderRoles(data.roles || []);

    syncedState.textContent =
      "Atualizado: " +
      new Date(data.updatedAt || Date.now()).toLocaleString("pt-PT");

  } catch (err) {
    console.error(err);
    syncedState.textContent = "Erro ao carregar Firebase";
  }
}

/* =========================
   RENDER CHANNELS / ROLES
========================= */

function renderChannels(ch) {
  channelsDiv.innerHTML = "";

  if (!ch.length) return empty(channelsDiv, "Sem canais");

  ch.forEach(c => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <div class="icon">#</div>
      <div>
        <div class="title">${escapeHtml(c.name)}</div>
        <div class="sub">${c.id}</div>
      </div>
    `;
    channelsDiv.appendChild(div);
  });
}

function renderRoles(r) {
  rolesDiv.innerHTML = "";

  if (!r.length) return empty(rolesDiv, "Sem cargos");

  r.forEach(role => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <div class="icon">@</div>
      <div>
        <div class="title">${escapeHtml(role.name)}</div>
        <div class="sub">${role.permissions}</div>
      </div>
    `;
    rolesDiv.appendChild(div);
  });
}

/* =========================
   GUILDS
========================= */

function renderGuilds(guilds) {
  guildsDiv.innerHTML = "";

  if (!guilds.length) {
    guildCount.textContent = "0 servidores";
    return empty(guildsDiv, "Sem servidores");
  }

  guildCount.textContent = `${guilds.length} servidores`;

  guilds.forEach(g => {
    const card = document.createElement("div");
    card.className = "guild-card";
    card.dataset.id = g.id;

    card.innerHTML = `
      <img class="guild-icon" src="${guildIcon(g)}">
      <div>${escapeHtml(g.name)}</div>
    `;

    card.onclick = () => {
      localStorage.setItem(SELECTED_GUILD_KEY, g.id);
      document.querySelectorAll(".guild-card")
        .forEach(c => c.classList.remove("selected"));

      card.classList.add("selected");

      loadGuild(g);
    };

    guildsDiv.appendChild(card);
  });
}

/* =========================
   INIT
========================= */

async function init() {
  const token = getToken();

  if (!token) {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    empty(guildsDiv, "Faz login primeiro");
    empty(channelsDiv, "Seleciona servidor");
    empty(rolesDiv, "Seleciona servidor");
    return;
  }

  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";

  try {
    const user = await getUser(token);
    const guilds = await getGuilds(token);

    userBox.innerHTML = `
      <div>${user.username}</div>
      <small>${user.email || "sem email"}</small>
    `;

    const owned = guilds.filter(g => g.owner);

    renderGuilds(owned);

    const last = localStorage.getItem(SELECTED_GUILD_KEY);
    const first = owned.find(g => g.id === last) || owned[0];

    if (first) loadGuild(first);

  } catch (e) {
    console.error(e);
  }
}

logoutBtn.onclick = logout;

init();
