import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =========================
   CONFIG
========================= */

const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

const ADD_BOT_URL =
  "https://discord.com/oauth2/authorize?client_id=1403419829435760662&scope=bot%20applications.commands&permissions=8";

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

const welcomeToggle = document.getElementById("welcomeToggle");
const welcomeChannel = document.getElementById("welcomeChannel");
const welcomeMsg = document.getElementById("welcomeMsg");
const saveWelcomeBtn = document.getElementById("saveWelcome");

/* =========================
   STORAGE
========================= */

const TOKEN_KEY = "aqua_discord_token";
const SELECTED_GUILD_KEY = "aqua_selected_guild_id";

let currentGuildId = null;
let currentGuildName = null;

/* =========================
   LINKS
========================= */

addBotBtn.href = ADD_BOT_URL;

loginBtn.href =
  `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token` +
  `&scope=identify%20email%20guilds`;

/* =========================
   HELPERS
========================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTokenFromHash() {
  const hash = window.location.hash;
  if (!hash || !hash.includes("access_token=")) return null;

  const params = new URLSearchParams(hash.slice(1));
  return params.get("access_token");
}

function getToken() {
  const fromHash = getTokenFromHash();

  if (fromHash) {
    localStorage.setItem(TOKEN_KEY, fromHash);
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return fromHash;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SELECTED_GUILD_KEY);
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  window.location.reload();
}

window.logout = logout;

function defaultUserAvatar(user) {
  const discriminator = Number(user?.discriminator || 0);
  return `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
}

function guildIconUrl(guild) {
  if (guild?.icon) {
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  }

  return "https://cdn-icons-png.flaticon.com/512/2111/2111370.png";
}

function emptyState(target, text) {
  target.innerHTML = `<div class="empty">${escapeHtml(text)}</div>`;
}

/* =========================
   DISCORD API
========================= */

async function api(path, token) {
  const response = await fetch(`https://discord.com/api${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Discord API respondeu com ${response.status}`);
  }

  return response.json();
}

async function getUser(token) {
  return api("/users/@me", token);
}

async function getGuilds(token) {
  return api("/users/@me/guilds", token);
}

/* =========================
   RENDER USER
========================= */

function renderUser(user) {
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : defaultUserAvatar(user);

  userBox.innerHTML = `
    <img src="${avatar}" alt="Avatar do utilizador">
    <div class="user-meta">
      <div class="user-name">${escapeHtml(user.username)}</div>
      <div class="user-email">${escapeHtml(user.email || "Sem email")}</div>
    </div>
  `;
}

/* =========================
   RENDER CHANNELS / ROLES
========================= */

function renderChannels(channels) {
  channelsDiv.innerHTML = "";

  if (!channels || channels.length === 0) {
    emptyState(channelsDiv, "Sem canais guardados neste servidor.");
    return;
  }

  for (const channel of channels) {
    const item = document.createElement("div");
    item.className = "list-item";

    item.innerHTML = `
      <div class="icon">#</div>
      <div class="content">
        <div class="title">${escapeHtml(channel.name || "Sem nome")}</div>
        <div class="sub">
          Tipo: ${escapeHtml(channel.type || "desconhecido")} ·
          ID: ${escapeHtml(channel.id || "")}
        </div>
      </div>
    `;

    channelsDiv.appendChild(item);
  }
}

function renderRoles(roles) {
  rolesDiv.innerHTML = "";

  if (!roles || roles.length === 0) {
    emptyState(rolesDiv, "Sem cargos guardados neste servidor.");
    return;
  }

  for (const role of roles) {
    const item = document.createElement("div");
    item.className = "list-item";

    item.innerHTML = `
      <div class="icon">@</div>
      <div class="content">
        <div class="title">${escapeHtml(role.name || "Sem nome")}</div>
        <div class="sub">
          Permissões: ${escapeHtml(role.permissions || "0")} ·
          ID: ${escapeHtml(role.id || "")}
        </div>
      </div>
    `;

    rolesDiv.appendChild(item);
  }
}

/* =========================
   FIREBASE LOAD
========================= */

async function loadGuildFromFirebase(guild) {
  currentGuildId = guild.id;
  currentGuildName = guild.name;

  selectedGuildName.textContent = guild.name;
  selectedGuildId.textContent = guild.id;
  syncedState.textContent = "A ler dados do Firebase...";

  channelsDiv.innerHTML = `<div class="empty">A carregar canais...</div>`;
  rolesDiv.innerHTML = `<div class="empty">A carregar cargos...</div>`;

  try {
    const snap = await getDoc(doc(db, "guilds", String(guild.id).trim()));

    if (!snap.exists()) {
      syncedState.textContent = "Este servidor ainda não foi sincronizado pelo bot.";
      emptyState(channelsDiv, "Ainda não há canais guardados.");
      emptyState(rolesDiv, "Ainda não há cargos guardados.");
      return;
    }

    const data = snap.data();

    renderChannels(Array.isArray(data.channels) ? data.channels : []);
    renderRoles(Array.isArray(data.roles) ? data.roles : []);

    const updatedAt = data.updatedAt
      ? new Date(data.updatedAt).toLocaleString("pt-PT")
      : "sem data";

    syncedState.textContent = `Última atualização: ${updatedAt}`;

    const welcome = data.config?.welcome || {};
    welcomeToggle.checked = Boolean(welcome.enabled);
    welcomeChannel.value = welcome.channelId || "";
    welcomeMsg.value = welcome.message || "";
  } catch (error) {
    console.error(error);
    syncedState.textContent = "Erro ao carregar o Firebase.";
    emptyState(channelsDiv, "Erro ao carregar canais.");
    emptyState(rolesDiv, "Erro ao carregar cargos.");
  }
}

/* =========================
   GUILD CARDS
========================= */

function setSelectedGuildCard(guildId) {
  document.querySelectorAll(".guild-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.guildId === guildId);
  });
}

function renderGuilds(guilds) {
  guildsDiv.innerHTML = "";

  if (!guilds || guilds.length === 0) {
    guildCount.textContent = "0 servidores";
    emptyState(guildsDiv, "Não encontrei servidores com a conta ligada.");
    return;
  }

  guildCount.textContent = `${guilds.length} servidor${guilds.length === 1 ? "" : "es"}`;

  for (const guild of guilds) {
    const card = document.createElement("div");
    card.className = "guild-card";
    card.dataset.guildId = guild.id;

    card.innerHTML = `
      <img class="guild-icon" src="${guildIconUrl(guild)}" alt="Ícone de ${escapeHtml(guild.name)}">
      <div class="guild-name">${escapeHtml(guild.name)}</div>
      <div class="guild-id">${escapeHtml(guild.id)}</div>
    `;

    card.addEventListener("click", async () => {
      localStorage.setItem(SELECTED_GUILD_KEY, guild.id);
      setSelectedGuildCard(guild.id);
      await loadGuildFromFirebase(guild);
    });

    guildsDiv.appendChild(card);
  }
}

/* =========================
   GUARDAR CONFIG WELCOME
========================= */

saveWelcomeBtn.addEventListener("click", async () => {
  if (!currentGuildId) {
    alert("Seleciona primeiro um servidor.");
    return;
  }

  try {
    const ref = doc(db, "guilds", String(currentGuildId));

    const payload = {
      config: {
        welcome: {
          enabled: welcomeToggle.checked,
          channelId: welcomeChannel.value.trim(),
          message: welcomeMsg.value.trim()
        }
      }
    };

    await setDoc(ref, payload, { merge: true });

    syncedState.textContent = "Configuração de boas-vindas guardada.";
    alert("Configuração guardada com sucesso!");
  } catch (error) {
    console.error(error);
    alert("Erro ao guardar a configuração.");
  }
});

/* =========================
   INIT
========================= */

async function init() {
  const token = getToken();

  if (!token) {
    loginBtn.style.display = "inline-flex";
    logoutBtn.style.display = "none";

    emptyState(guildsDiv, "Faz login para carregar os teus servidores.");
    emptyState(channelsDiv, "Seleciona um servidor para ver os canais.");
    emptyState(rolesDiv, "Seleciona um servidor para ver os cargos.");
    return;
  }

  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-flex";

  try {
    const user = await getUser(token);
    renderUser(user);

    const guilds = await getGuilds(token);
    const ownedGuilds = guilds.filter((guild) => guild.owner);

    renderGuilds(ownedGuilds);

    const lastGuildId = localStorage.getItem(SELECTED_GUILD_KEY);
    const initialGuild =
      ownedGuilds.find((guild) => guild.id === lastGuildId) || ownedGuilds[0];

    if (initialGuild) {
      setSelectedGuildCard(initialGuild.id);
      await loadGuildFromFirebase(initialGuild);
    } else {
      selectedGuildName.textContent = "Nenhum servidor encontrado";
      selectedGuildId.textContent = "";
      emptyState(channelsDiv, "Sem servidores.");
      emptyState(rolesDiv, "Sem servidores.");
      syncedState.textContent = "Sem servidores para mostrar.";
    }
  } catch (error) {
    console.error(error);
    localStorage.removeItem(TOKEN_KEY);

    emptyState(guildsDiv, "Falha a ligar à conta Discord.");
    emptyState(channelsDiv, "Não foi possível carregar dados.");
    emptyState(rolesDiv, "Não foi possível carregar dados.");

    loginBtn.style.display = "inline-flex";
    logoutBtn.style.display = "none";
  }
}

logoutBtn.addEventListener("click", logout);

init();
