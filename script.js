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
const goDashboardBtn = document.getElementById("goDashboardBtn");

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
const saveWelcome = document.getElementById("saveWelcome");

const goodbyeToggle = document.getElementById("goodbyeToggle");
const goodbyeChannel = document.getElementById("goodbyeChannel");
const goodbyeMsg = document.getElementById("goodbyeMsg");
const saveGoodbye = document.getElementById("saveGoodbye");

const autoroleToggle = document.getElementById("autoroleToggle");
const autoroleRole = document.getElementById("autoroleRole");
const saveAutorole = document.getElementById("saveAutorole");

const antilinkToggle = document.getElementById("antilinkToggle");
const saveAntiLink = document.getElementById("saveAntiLink");

const claimDailyBtn = document.getElementById("claimDailyBtn");

const TOKEN_KEY = "aqua_discord_token";
const SELECTED_GUILD_KEY = "aqua_selected_guild_id";

let currentGuildId = null;
let currentChannels = [];
let currentRoles = [];

addBotBtn.href = ADD_BOT_URL;
loginBtn.href =
  `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}` +
  `&response_type=token` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent("identify email guilds")}`;

goDashboardBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const token = getToken();
  if (token) {
    showDashboard();
    initDashboard(token);
  } else {
    loginBtn.click();
  }
});

function showLanding() {
  landing.classList.remove("hidden");
  dashboard.classList.add("hidden");
}

function showDashboard() {
  landing.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

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
  showLanding();
}

logoutBtn.addEventListener("click", logout);

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
  if (!target) return;
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
  if (!userBox) return;

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

function typeLabel(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("text")) return "Texto";
  if (t.includes("voice")) return "Voz";
  if (t.includes("category")) return "Categoria";
  if (t.includes("announcement")) return "Anúncios";
  if (t.includes("forum")) return "Fórum";
  if (t.includes("stage")) return "Stage";
  return "Outro";
}

function fillChannelSelect(selectEl, channels, selectedId) {
  if (!selectEl) return;

  selectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleciona um canal";
  selectEl.appendChild(placeholder);

  const usableChannels = [...(channels || [])]
    .filter((c) => !String(c.type || "").toLowerCase().includes("voice"))
    .sort((a, b) => {
      const pa = Number.isFinite(a.position) ? a.position : 0;
      const pb = Number.isFinite(b.position) ? b.position : 0;
      return pa - pb;
    });

  for (const channel of usableChannels) {
    const option = document.createElement("option");
    option.value = channel.id;
    option.textContent = `# ${channel.name || "Sem nome"}`;
    if (String(channel.id) === String(selectedId)) {
      option.selected = true;
    }
    selectEl.appendChild(option);
  }
}

function fillRoleSelect(selectEl, roles, selectedId) {
  if (!selectEl) return;

  selectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleciona um cargo";
  selectEl.appendChild(placeholder);

  const usableRoles = [...(roles || [])]
    .filter((r) => r.name !== "@everyone")
    .sort((a, b) => {
      const pa = Number.isFinite(a.position) ? a.position : 0;
      const pb = Number.isFinite(b.position) ? b.position : 0;
      return pb - pa;
    });

  for (const role of usableRoles) {
    const option = document.createElement("option");
    option.value = role.id;
    option.textContent = role.name || "Sem nome";
    if (String(role.id) === String(selectedId)) {
      option.selected = true;
    }
    selectEl.appendChild(option);
  }
}

function renderChannels(channels) {
  if (!channelsDiv) return;

  channelsDiv.innerHTML = "";
  currentChannels = Array.isArray(channels) ? channels : [];

  if (!currentChannels.length) {
    emptyState(channelsDiv, "Sem canais guardados neste servidor.");
    return;
  }

  const sorted = [...currentChannels].sort((a, b) => {
    const pa = Number.isFinite(a.position) ? a.position : 0;
    const pb = Number.isFinite(b.position) ? b.position : 0;
    return pa - pb;
  });

  for (const channel of sorted) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="list-icon">#</div>
      <div>
        <div class="list-title">${escapeHtml(channel.name || "Sem nome")}</div>
        <div class="list-sub">Tipo: ${escapeHtml(typeLabel(channel.type))} · ID: ${escapeHtml(channel.id || "")}</div>
      </div>
    `;
    channelsDiv.appendChild(item);
  }
}

function renderRoles(roles) {
  if (!rolesDiv) return;

  rolesDiv.innerHTML = "";
  currentRoles = Array.isArray(roles) ? roles : [];

  if (!currentRoles.length) {
    emptyState(rolesDiv, "Sem cargos guardados neste servidor.");
    return;
  }

  const sorted = [...currentRoles].sort((a, b) => {
    const pa = Number.isFinite(a.position) ? a.position : 0;
    const pb = Number.isFinite(b.position) ? b.position : 0;
    return pb - pa;
  });

  for (const role of sorted) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="list-icon">@</div>
      <div>
        <div class="list-title">${escapeHtml(role.name || "Sem nome")}</div>
        <div class="list-sub">Permissões: ${escapeHtml(role.permissions || "0")} · ID: ${escapeHtml(role.id || "")}</div>
      </div>
    `;
    rolesDiv.appendChild(item);
  }
}

function setSelectedGuildCard(guildId) {
  document.querySelectorAll(".guild-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.guildId === guildId);
  });
}

async function loadGuildFromFirebase(guild) {
  currentGuildId = guild.id;
  if (selectedGuildName) selectedGuildName.textContent = guild.name;
  if (selectedGuildId) selectedGuildId.textContent = guild.id;
  if (syncedState) syncedState.textContent = "A ler dados do Firebase...";

  if (channelsDiv) channelsDiv.innerHTML = `<div class="empty">A carregar canais...</div>`;
  if (rolesDiv) rolesDiv.innerHTML = `<div class="empty">A carregar cargos...</div>`;

  try {
    const snap = await getDoc(doc(db, "guilds", String(guild.id).trim()));

    if (!snap.exists()) {
      if (syncedState) syncedState.textContent = "Este servidor ainda não foi sincronizado pelo bot.";
      emptyState(channelsDiv, "Ainda não há canais guardados.");
      emptyState(rolesDiv, "Ainda não há cargos guardados.");
      fillChannelSelect(welcomeChannel, [], "");
      fillChannelSelect(goodbyeChannel, [], "");
      fillRoleSelect(autoroleRole, [], "");
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

    if (syncedState) syncedState.textContent = `Última sincronização: ${updatedAt}`;

    const welcome = data.config?.welcome || {};
    const goodbye = data.config?.goodbye || {};
    const autorole = data.config?.autorole || {};
    const antilink = data.config?.antilink || {};

    if (welcomeToggle) welcomeToggle.checked = Boolean(welcome.enabled);
    if (welcomeChannel) fillChannelSelect(welcomeChannel, channels, welcome.channelId || "");
    if (welcomeMsg) welcomeMsg.value = welcome.message || "Bem-vindo {mention} ao {server}!";

    if (goodbyeToggle) goodbyeToggle.checked = Boolean(goodbye.enabled);
    if (goodbyeChannel) fillChannelSelect(goodbyeChannel, channels, goodbye.channelId || "");
    if (goodbyeMsg) goodbyeMsg.value = goodbye.message || "Até logo {user}, volta sempre!";

    if (autoroleToggle) autoroleToggle.checked = Boolean(autorole.enabled);
    if (autoroleRole) fillRoleSelect(autoroleRole, roles, autorole.roleId || "");

    if (antilinkToggle) antilinkToggle.checked = Boolean(antilink.enabled);

    currentChannels = channels;
    currentRoles = roles;
  } catch (error) {
    console.error(error);
    if (syncedState) syncedState.textContent = "Erro ao carregar o Firebase.";
    emptyState(channelsDiv, "Erro ao carregar canais.");
    emptyState(rolesDiv, "Erro ao carregar cargos.");
  }
}

function renderGuilds(guilds) {
  if (!guildsDiv) return;

  guildsDiv.innerHTML = "";

  if (!Array.isArray(guilds) || guilds.length === 0) {
    if (guildCount) guildCount.textContent = "0";
    emptyState(guildsDiv, "Não encontrei servidores com a conta ligada.");
    return;
  }

  if (guildCount) guildCount.textContent = `${guilds.length}`;

  for (const guild of guilds) {
    const card = document.createElement("div");
    card.className = "guild-card";
    card.dataset.guildId = guild.id;

    card.innerHTML = `
      <img src="${guildIconUrl(guild)}" alt="Ícone de ${escapeHtml(guild.name)}">
      <div class="guild-info">
        <div class="guild-name">${escapeHtml(guild.name)}</div>
        <div class="guild-id">${escapeHtml(guild.id)}</div>
      </div>
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
  const payload = { config: {} };

  if (section === "welcome") {
    payload.config.welcome = {
      enabled: welcomeToggle?.checked || false,
      channelId: welcomeChannel?.value || "",
      message: welcomeMsg?.value || "",
      useEmbed: true
    };
  }

  if (section === "goodbye") {
    payload.config.goodbye = {
      enabled: goodbyeToggle?.checked || false,
      channelId: goodbyeChannel?.value || "",
      message: goodbyeMsg?.value || "",
      useEmbed: true
    };
  }

  if (section === "autorole") {
    payload.config.autorole = {
      enabled: autoroleToggle?.checked || false,
      roleId: autoroleRole?.value || ""
    };
  }

  if (section === "antilink") {
    payload.config.antilink = {
      enabled: antilinkToggle?.checked || false
    };
  }

  await setDoc(ref, payload, { merge: true });
  await loadGuildFromFirebase({
    id: currentGuildId,
    name: selectedGuildName?.textContent || "Servidor"
  });

  alert("Guardado com sucesso.");
}

if (saveWelcome) saveWelcome.addEventListener("click", () => saveConfig("welcome"));
if (saveGoodbye) saveGoodbye.addEventListener("click", () => saveConfig("goodbye"));
if (saveAutorole) saveAutorole.addEventListener("click", () => saveConfig("autorole"));
if (saveAntiLink) saveAntiLink.addEventListener("click", () => saveConfig("antilink"));

/* DAILY */

if (claimDailyBtn) {
  claimDailyBtn.onclick = async () => {
    const token = getToken();

    if (!token) {
      alert("Faz login primeiro.");
      return;
    }

    try {
      const user = await getUser(token);
      const dailyRef = doc(db, "economy", user.id);
      const dailySnap = await getDoc(dailyRef);

      let coins = 0;
      let lastDaily = 0;

      if (dailySnap.exists()) {
        coins = dailySnap.data().coins || 0;
        lastDaily = dailySnap.data().lastDaily || 0;
      }

      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;

      if (now - lastDaily < cooldown) {
        const left = cooldown - (now - lastDaily);
        const hours = Math.floor(left / 1000 / 60 / 60);
        const minutes = Math.floor((left % (1000 * 60 * 60)) / 1000 / 60);
        alert(`Já pegaste o daily.\nVolta em ${hours}h ${minutes}m`);
        return;
      }

      coins += 500;

      await setDoc(dailyRef, {
        coins,
        lastDaily: now
      }, { merge: true });

      alert("Recebeste 500 moedas.");
    } catch (err) {
      console.error(err);
      alert("Erro ao pegar daily.");
    }
  };
}

/* AUTH / INIT */

async function initDashboard(token) {
  showDashboard();

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
      if (selectedGuildName) selectedGuildName.textContent = "Nenhum servidor encontrado";
      if (selectedGuildId) selectedGuildId.textContent = "-";
      emptyState(channelsDiv, "Sem servidores.");
      emptyState(rolesDiv, "Sem servidores.");
      if (syncedState) syncedState.textContent = "Sem servidores para mostrar.";
    }
  } catch (error) {
    console.error(error);
    localStorage.removeItem(TOKEN_KEY);
    showLanding();
  }
}

async function init() {
  const token = getToken();

  if (!token) {
    showLanding();
    return;
  }

  await initDashboard(token);
}

if (goDashboardBtn) {
  goDashboardBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const token = getToken();
    if (token) {
      showDashboard();
      initDashboard(token);
    } else if (loginBtn) {
      loginBtn.click();
    }
  });
}

init();
