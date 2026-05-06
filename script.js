import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

const landing = document.getElementById("landing");
const dashboard = document.getElementById("dashboard");

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
const lastSync = document.getElementById("lastSync");

const welcomeToggle = document.getElementById("welcomeToggle");
const welcomeChannel = document.getElementById("welcomeChannel");
const welcomeMsg = document.getElementById("welcomeMsg");
const saveWelcome = document.getElementById("saveWelcome");
const welcomePreview = document.getElementById("welcomePreview");
const welcomeState = document.getElementById("welcomeState");

const goodbyeToggle = document.getElementById("goodbyeToggle");
const goodbyeChannel = document.getElementById("goodbyeChannel");
const goodbyeMsg = document.getElementById("goodbyeMsg");
const saveGoodbye = document.getElementById("saveGoodbye");
const goodbyePreview = document.getElementById("goodbyePreview");
const goodbyeState = document.getElementById("goodbyeState");

const TOKEN_KEY = "aqua_discord_token";
const SELECTED_GUILD_KEY = "aqua_selected_guild_id";

let currentGuildId = null;
let currentGuildChannels = [];

addBotBtn.href = ADD_BOT_URL;
loginBtn.href =
  `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token` +
  `&scope=identify%20email%20guilds`;

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
  location.reload();
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

const getUser = (token) => api("/users/@me", token);
const getGuilds = (token) => api("/users/@me/guilds", token);

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

function renderChannels(channels) {
  channelsDiv.innerHTML = "";
  currentGuildChannels = Array.isArray(channels) ? channels : [];

  if (!currentGuildChannels.length) {
    emptyState(channelsDiv, "Sem canais guardados neste servidor.");
    return;
  }

  const sorted = [...currentGuildChannels].sort((a, b) => {
    const pa = Number.isFinite(a.position) ? a.position : 0;
    const pb = Number.isFinite(b.position) ? b.position : 0;
    return pa - pb;
  });

  for (const channel of sorted) {
    const item = document.createElement("div");
    item.className = "list-item";

    const typeLabel = String(channel.type || "desconhecido")
      .replace("GuildText", "Texto")
      .replace("GuildVoice", "Voz")
      .replace("GuildCategory", "Categoria")
      .replace("GuildAnnouncement", "Anúncios")
      .replace("GuildForum", "Fórum");

    item.innerHTML = `
      <div class="icon">#</div>
      <div>
        <div class="title">${escapeHtml(channel.name || "Sem nome")}</div>
        <div class="sub">Tipo: ${escapeHtml(typeLabel)} · ID: ${escapeHtml(channel.id || "")}</div>
      </div>
    `;

    channelsDiv.appendChild(item);
  }
}

function renderRoles(roles) {
  rolesDiv.innerHTML = "";

  if (!Array.isArray(roles) || roles.length === 0) {
    emptyState(rolesDiv, "Sem cargos guardados neste servidor.");
    return;
  }

  const sorted = [...roles].sort((a, b) => {
    const pa = Number.isFinite(a.position) ? a.position : 0;
    const pb = Number.isFinite(b.position) ? b.position : 0;
    return pb - pa;
  });

  for (const role of sorted) {
    const item = document.createElement("div");
    item.className = "list-item";

    item.innerHTML = `
      <div class="icon">@</div>
      <div>
        <div class="title">${escapeHtml(role.name || "Sem nome")}</div>
        <div class="sub">Permissões: ${escapeHtml(role.permissions || "0")} · ID: ${escapeHtml(role.id || "")}</div>
      </div>
    `;

    rolesDiv.appendChild(item);
  }
}

function fillChannelSelect(selectEl, channels, selectedId) {
  selectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleciona um canal";
  selectEl.appendChild(placeholder);

  const textChannels = channels
    .filter(c => !String(c.type).toLowerCase().includes("voice"))
    .sort((a, b) => {
      const pa = Number.isFinite(a.position) ? a.position : 0;
      const pb = Number.isFinite(b.position) ? b.position : 0;
      return pa - pb;
    });

  for (const channel of textChannels) {
    const option = document.createElement("option");
    option.value = channel.id;
    option.textContent = `# ${channel.name || "Sem nome"}`;
    if (String(channel.id) === String(selectedId)) {
      option.selected = true;
    }
    selectEl.appendChild(option);
  }
}

function setSelectedGuildCard(guildId) {
  document.querySelectorAll(".guild-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.guildId === guildId);
  });
}

async function loadGuildFromFirebase(guild) {
  currentGuildId = guild.id;
  selectedGuildName.textContent = guild.name;
  selectedGuildId.textContent = guild.id;
  syncedState.textContent = "A ler dados do Firebase...";
  lastSync.textContent = "A carregar...";

  channelsDiv.innerHTML = `<div class="empty">A carregar canais...</div>`;
  rolesDiv.innerHTML = `<div class="empty">A carregar cargos...</div>`;

  try {
    const snap = await getDoc(doc(db, "guilds", String(guild.id).trim()));

    if (!snap.exists()) {
      syncedState.textContent = "Este servidor ainda não foi sincronizado pelo bot.";
      lastSync.textContent = "Sem dados";
      emptyState(channelsDiv, "Ainda não há canais guardados.");
      emptyState(rolesDiv, "Ainda não há cargos guardados.");
      fillChannelSelect(welcomeChannel, [], "");
      fillChannelSelect(goodbyeChannel, [], "");
      welcomePreview.textContent = "Nenhum";
      goodbyePreview.textContent = "Nenhum";
      welcomeState.textContent = "-";
      goodbyeState.textContent = "-";
      return;
    }

    const data = snap.data();

    const channels = Array.isArray(data.channels) ? data.channels : [];
    const roles = Array.isArray(data.roles) ? data.roles : [];

    renderChannels(channels);
    renderRoles(roles);

    const updatedAt = data.updatedAt
      ? new Date(data.updatedAt).toLocaleString("pt-PT")
      : "sem data";

    syncedState.textContent = `Última sincronização: ${updatedAt}`;
    lastSync.textContent = updatedAt;

    const welcome = data.config?.welcome || {};
    const goodbye = data.config?.goodbye || {};

    welcomeToggle.checked = Boolean(welcome.enabled);
    welcomeMsg.value = welcome.message || "Bem-vindo {mention} ao {server}!";
    goodbyeToggle.checked = Boolean(goodbye.enabled);
    goodbyeMsg.value = goodbye.message || "Até logo {user}, volta sempre!";

    fillChannelSelect(welcomeChannel, channels, welcome.channelId || "");
    fillChannelSelect(goodbyeChannel, channels, goodbye.channelId || "");

    welcomePreview.textContent =
      channels.find(c => String(c.id) === String(welcome.channelId))?.name || "Nenhum";

    goodbyePreview.textContent =
      channels.find(c => String(c.id) === String(goodbye.channelId))?.name || "Nenhum";

    welcomeState.textContent = welcome.channelId || "-";
    goodbyeState.textContent = goodbye.channelId || "-";

    currentGuildChannels = channels;
  } catch (error) {
    console.error(error);
    syncedState.textContent = "Erro ao carregar o Firebase.";
    lastSync.textContent = "Erro";
    emptyState(channelsDiv, "Erro ao carregar canais.");
    emptyState(rolesDiv, "Erro ao carregar cargos.");
  }
}

function renderGuilds(guilds) {
  guildsDiv.innerHTML = "";

  if (!Array.isArray(guilds) || guilds.length === 0) {
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

async function saveConfig(section) {
  if (!currentGuildId) {
    alert("Seleciona primeiro um servidor.");
    return;
  }

  const ref = doc(db, "guilds", String(currentGuildId));

  const current = {
    config: {}
  };

  if (section === "welcome") {
    current.config.welcome = {
      enabled: welcomeToggle.checked,
      channelId: welcomeChannel.value,
      message: welcomeMsg.value.trim()
    };
  }

  if (section === "goodbye") {
    current.config.goodbye = {
      enabled: goodbyeToggle.checked,
      channelId: goodbyeChannel.value,
      message: goodbyeMsg.value.trim()
    };
  }

  await setDoc(ref, current, { merge: true });
  await loadGuildFromFirebase({
    id: currentGuildId,
    name: selectedGuildName.textContent || "Servidor"
  });

  alert("Guardado com sucesso.");
}

saveWelcome.addEventListener("click", () => saveConfig("welcome"));
saveGoodbye.addEventListener("click", () => saveConfig("goodbye"));

async function init() {
  const token = getToken();

  if (!token) {
    landing.classList.remove("hidden");
    dashboard.classList.add("hidden");
    loginBtn.style.display = "inline-flex";
    logoutBtn && (logoutBtn.style.display = "none");
    return;
  }

  landing.classList.add("hidden");
  dashboard.classList.remove("hidden");

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
      selectedGuildId.textContent = "-";
      emptyState(channelsDiv, "Sem servidores.");
      emptyState(rolesDiv, "Sem servidores.");
      welcomePreview.textContent = "Nenhum";
      goodbyePreview.textContent = "Nenhum";
      welcomeState.textContent = "-";
      goodbyeState.textContent = "-";
      lastSync.textContent = "Sem dados";
    }
  } catch (error) {
    console.error(error);
    localStorage.removeItem(TOKEN_KEY);
    landing.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
}

logoutBtn.addEventListener("click", logout);

init();
