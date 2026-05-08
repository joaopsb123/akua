import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

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
const welcomeEmbedToggle = document.getElementById("welcomeEmbedToggle");
const welcomeChannel = document.getElementById("welcomeChannel");
const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeMsg = document.getElementById("welcomeMsg");
const welcomeColor = document.getElementById("welcomeColor");
const welcomeFooter = document.getElementById("welcomeFooter");
const welcomeThumbnail = document.getElementById("welcomeThumbnail");
const saveWelcome = document.getElementById("saveWelcome");

const goodbyeToggle = document.getElementById("goodbyeToggle");
const goodbyeEmbedToggle = document.getElementById("goodbyeEmbedToggle");
const goodbyeChannel = document.getElementById("goodbyeChannel");
const goodbyeTitle = document.getElementById("goodbyeTitle");
const goodbyeMsg = document.getElementById("goodbyeMsg");
const goodbyeColor = document.getElementById("goodbyeColor");
const goodbyeFooter = document.getElementById("goodbyeFooter");
const goodbyeThumbnail = document.getElementById("goodbyeThumbnail");
const saveGoodbye = document.getElementById("saveGoodbye");

const autoroleToggle = document.getElementById("autoroleToggle");
const autoroleRole = document.getElementById("autoroleRole");
const saveAutorole = document.getElementById("saveAutorole");

const dailyToggle = document.getElementById("dailyToggle");
const dailyMin = document.getElementById("dailyMin");
const dailyMax = document.getElementById("dailyMax");
const dailyCooldown = document.getElementById("dailyCooldown");
const saveDaily = document.getElementById("saveDaily");

const embedToggle = document.getElementById("embedToggle");
const embedChannel = document.getElementById("embedChannel");
const embedTitle = document.getElementById("embedTitle");
const embedDescription = document.getElementById("embedDescription");
const embedColor = document.getElementById("embedColor");
const embedFooter = document.getElementById("embedFooter");
const embedThumbnail = document.getElementById("embedThumbnail");
const embedImage = document.getElementById("embedImage");
const embedTimestamp = document.getElementById("embedTimestamp");
const saveEmbed = document.getElementById("saveEmbed");

const ticketToggle = document.getElementById("ticketToggle");
const ticketCategory = document.getElementById("ticketCategory");
const ticketSupportRole = document.getElementById("ticketSupportRole");
const ticketPanelChannel = document.getElementById("ticketPanelChannel");
const ticketMessage = document.getElementById("ticketMessage");
const saveTicket = document.getElementById("saveTicket");

const antilinkToggle = document.getElementById("antilinkToggle");
const antilinkWarnToggle = document.getElementById("antilinkWarnToggle");
const antilinkWarnMsg = document.getElementById("antilinkWarnMsg");
const antilinkTimeout = document.getElementById("antilinkTimeout");
const saveAntiLink = document.getElementById("saveAntiLink");

const logsToggle = document.getElementById("logsToggle");
const logsChannel = document.getElementById("logsChannel");
const saveLogs = document.getElementById("saveLogs");

const levelsToggle = document.getElementById("levelsToggle");
const levelsMin = document.getElementById("levelsMin");
const levelsMax = document.getElementById("levelsMax");
const levelsCooldown = document.getElementById("levelsCooldown");
const levelsChannel = document.getElementById("levelsChannel");
const levelsMessage = document.getElementById("levelsMessage");
const levelsRole = document.getElementById("levelsRole");
const saveLevels = document.getElementById("saveLevels");

const TOKEN_KEY = "aqua_discord_token";
const SELECTED_GUILD_KEY = "aqua_selected_guild_id";

let currentGuildId = null;
let currentChannels = [];
let currentRoles = [];

addBotBtn.href = "https://discord.com/oauth2/authorize?client_id=1403419829435760662&scope=bot%20applications.commands&permissions=8";
loginBtn.href =
  `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token` +
  `&scope=identify%20email%20guilds`;

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

function renderChannels(channels) {
  channelsDiv.innerHTML = "";
  currentChannels = Array.isArray(channels) ? channels : [];

  if (!currentChannels.length) {
    emptyState(channelsDiv, "Sem canais guardados neste servidor.");
    return;
  }

  const sorted = [...currentChannels].sort((a, b) => (a.position || 0) - (b.position || 0));

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
  rolesDiv.innerHTML = "";
  currentRoles = Array.isArray(roles) ? roles : [];

  if (!currentRoles.length) {
    emptyState(rolesDiv, "Sem cargos guardados neste servidor.");
    return;
  }

  const sorted = [...currentRoles].sort((a, b) => (b.position || 0) - (a.position || 0));

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

function fillChannelSelect(selectEl, channels, selectedId, mode = "text") {
  selectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleciona um canal";
  selectEl.appendChild(placeholder);

  const filtered = (channels || []).filter((c) => {
    const t = String(c.type || "").toLowerCase();
    if (mode === "category") return t.includes("category");
    if (mode === "text") return !t.includes("voice") && !t.includes("category");
    return true;
  });

  for (const channel of filtered) {
    const option = document.createElement("option");
    option.value = channel.id;
    option.textContent = mode === "category" ? channel.name || "Sem nome" : `# ${channel.name || "Sem nome"}`;
    if (String(channel.id) === String(selectedId)) option.selected = true;
    selectEl.appendChild(option);
  }
}

function fillRoleSelect(selectEl, roles, selectedId) {
  selectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleciona um cargo";
  selectEl.appendChild(placeholder);

  const filtered = (roles || []).filter((r) => r.name !== "@everyone");

  for (const role of filtered) {
    const option = document.createElement("option");
    option.value = role.id;
    option.textContent = role.name || "Sem nome";
    if (String(role.id) === String(selectedId)) option.selected = true;
    selectEl.appendChild(option);
  }
}

function setSelectedGuildCard(guildId) {
  document.querySelectorAll(".guild-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.guildId === guildId);
  });
}

async function saveSection(payload) {
  if (!currentGuildId) {
    alert("Seleciona primeiro um servidor.");
    return;
  }

  await setDoc(doc(db, "guilds", String(currentGuildId)), payload, { merge: true });
  alert("Guardado com sucesso.");
  await loadGuildFromFirebase({
    id: currentGuildId,
    name: selectedGuildName.textContent || "Servidor"
  });
}

async function loadGuildFromFirebase(guild) {
  currentGuildId = guild.id;
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
      fillChannelSelect(welcomeChannel, [], "", "text");
      fillChannelSelect(goodbyeChannel, [], "", "text");
      fillChannelSelect(embedChannel, [], "", "text");
      fillChannelSelect(ticketPanelChannel, [], "", "text");
      fillChannelSelect(logsChannel, [], "", "text");
      fillChannelSelect(levelsChannel, [], "", "text");
      fillChannelSelect(ticketCategory, [], "", "category");
      fillRoleSelect(autoroleRole, [], "");
      fillRoleSelect(ticketSupportRole, [], "");
      fillRoleSelect(levelsRole, [], "");
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

    const welcome = data.config?.welcome || {};
    welcomeToggle.checked = Boolean(welcome.enabled);
    welcomeEmbedToggle.checked = Boolean(welcome.useEmbed);
    fillChannelSelect(welcomeChannel, channels, welcome.channelId || "", "text");
    welcomeTitle.value = welcome.title || "Bem-vindo!";
    welcomeMsg.value = welcome.message || "Bem-vindo {mention} ao {server}!";
    welcomeColor.value = welcome.color || "57f287";
    welcomeFooter.value = welcome.footer || "AQUA";
    welcomeThumbnail.value = welcome.thumbnail || "";

    const goodbye = data.config?.goodbye || {};
    goodbyeToggle.checked = Boolean(goodbye.enabled);
    goodbyeEmbedToggle.checked = Boolean(goodbye.useEmbed);
    fillChannelSelect(goodbyeChannel, channels, goodbye.channelId || "", "text");
    goodbyeTitle.value = goodbye.title || "Até já!";
    goodbyeMsg.value = goodbye.message || "Até logo {user}, volta sempre!";
    goodbyeColor.value = goodbye.color || "ff5a6a";
    goodbyeFooter.value = goodbye.footer || "AQUA";
    goodbyeThumbnail.value = goodbye.thumbnail || "";

    const autorole = data.config?.autorole || {};
    autoroleToggle.checked = Boolean(autorole.enabled);
    fillRoleSelect(autoroleRole, roles, autorole.roleId || "");

    const daily = data.config?.daily || {};
    dailyToggle.checked = Boolean(daily.enabled);
    dailyMin.value = daily.min ?? 50;
    dailyMax.value = daily.max ?? 150;
    dailyCooldown.value = daily.cooldownHours ?? 24;

    const customEmbed = data.config?.embeds?.custom || {};
    embedToggle.checked = Boolean(customEmbed.enabled);
    fillChannelSelect(embedChannel, channels, customEmbed.channelId || "", "text");
    embedTitle.value = customEmbed.title || "";
    embedDescription.value = customEmbed.description || "";
    embedColor.value = customEmbed.color || "5865f2";
    embedFooter.value = customEmbed.footer || "";
    embedThumbnail.value = customEmbed.thumbnail || "";
    embedImage.value = customEmbed.image || "";
    embedTimestamp.checked = Boolean(customEmbed.timestamp);

    const ticket = data.config?.ticket || {};
    ticketToggle.checked = Boolean(ticket.enabled);
    fillChannelSelect(ticketPanelChannel, channels, ticket.panelChannelId || "", "text");
    fillChannelSelect(ticketCategory, channels, ticket.categoryId || "", "category");
    fillRoleSelect(ticketSupportRole, roles, ticket.supportRoleId || "");
    ticketMessage.value = ticket.message || "Abre um ticket para falar connosco!";

    const antiLink = data.config?.antilink || {};
    antilinkToggle.checked = Boolean(antiLink.enabled);
    antilinkWarnToggle.checked = Boolean(antiLink.warn);
    antilinkWarnMsg.value = antiLink.warnMessage || "Links não são permitidos aqui, {mention}.";
    antilinkTimeout.value = antiLink.timeoutSeconds ?? 0;

    const logs = data.config?.logs || {};
    logsToggle.checked = Boolean(logs.enabled);
    fillChannelSelect(logsChannel, channels, logs.channelId || "", "text");

    const levels = data.config?.levels || {};
    levelsToggle.checked = Boolean(levels.enabled);
    levelsMin.value = levels.xpMin ?? 5;
    levelsMax.value = levels.xpMax ?? 15;
    levelsCooldown.value = levels.cooldownSeconds ?? 60;
    fillChannelSelect(levelsChannel, channels, levels.levelUpChannelId || "", "text");
    levelsMessage.value = levels.levelUpMessage || "Parabéns {user}, subiste para o nível {level}!";
    fillRoleSelect(levelsRole, roles, levels.roleRewardId || "");

  } catch (error) {
    console.error(error);
    syncedState.textContent = "Erro ao carregar o Firebase.";
    emptyState(channelsDiv, "Erro ao carregar canais.");
    emptyState(rolesDiv, "Erro ao carregar cargos.");
  }
}

function renderGuilds(guilds) {
  guildsDiv.innerHTML = "";

  if (!Array.isArray(guilds) || guilds.length === 0) {
    guildCount.textContent = "0";
    emptyState(guildsDiv, "Não encontrei servidores com a conta ligada.");
    return;
  }

  guildCount.textContent = `${guilds.length}`;

  for (const guild of guilds) {
    const card = document.createElement("div");
    card.className = "guild-card";
    card.dataset.guildId = guild.id;

    card.innerHTML = `
      <img class="guild-icon" src="${guildIconUrl(guild)}" alt="Ícone de ${escapeHtml(guild.name)}">
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

saveWelcome.addEventListener("click", async () => {
  await saveSection({
    config: {
      welcome: {
        enabled: welcomeToggle.checked,
        useEmbed: welcomeEmbedToggle.checked,
        channelId: welcomeChannel.value,
        title: welcomeTitle.value.trim(),
        message: welcomeMsg.value.trim(),
        color: welcomeColor.value.trim(),
        footer: welcomeFooter.value.trim(),
        thumbnail: welcomeThumbnail.value.trim()
      }
    }
  });
});

saveGoodbye.addEventListener("click", async () => {
  await saveSection({
    config: {
      goodbye: {
        enabled: goodbyeToggle.checked,
        useEmbed: goodbyeEmbedToggle.checked,
        channelId: goodbyeChannel.value,
        title: goodbyeTitle.value.trim(),
        message: goodbyeMsg.value.trim(),
        color: goodbyeColor.value.trim(),
        footer: goodbyeFooter.value.trim(),
        thumbnail: goodbyeThumbnail.value.trim()
      }
    }
  });
});

saveAutorole.addEventListener("click", async () => {
  await saveSection({
    config: {
      autorole: {
        enabled: autoroleToggle.checked,
        roleId: autoroleRole.value
      }
    }
  });
});

saveDaily.addEventListener("click", async () => {
  await saveSection({
    config: {
      daily: {
        enabled: dailyToggle.checked,
        min: Number(dailyMin
