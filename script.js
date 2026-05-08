
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =========================
   CONFIG
========================= */

const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

const ADD_BOT_URL =
  "https://discord.com/oauth2/authorize?client_id=1403419829435760662&scope=bot%20applications.commands&permissions=8";

const LOGIN_SCOPE = "identify email guilds";

const TOKEN_KEY = "aqua_token";
const SELECTED_GUILD_KEY = "aqua_selected_guild";

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

const landingPage = document.getElementById("landingPage");
const dashboardPage = document.getElementById("dashboardPage");

const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const guildsDiv = document.getElementById("guilds");

const selectedGuildName = document.getElementById("selectedGuildName");
const selectedGuildId = document.getElementById("selectedGuildId");

const channelsDiv = document.getElementById("channels");
const rolesDiv = document.getElementById("roles");

const welcomeChannel = document.getElementById("welcomeChannel");
const leaveChannel = document.getElementById("leaveChannel");

const saveWelcomeBtn = document.getElementById("saveWelcomeBtn");
const saveLeaveBtn = document.getElementById("saveLeaveBtn");

const welcomeMessage = document.getElementById("welcomeMessage");
const leaveMessage = document.getElementById("leaveMessage");

const saveMessagesBtn = document.getElementById("saveMessagesBtn");

const autoRoleSelect = document.getElementById("autoRoleSelect");
const saveAutoRoleBtn = document.getElementById("saveAutoRoleBtn");

const antiLinkToggle = document.getElementById("antiLinkToggle");
const saveAntiLinkBtn = document.getElementById("saveAntiLinkBtn");

/* =========================
   LOGIN
========================= */

const discordLoginURL =
  `https://discord.com/oauth2/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&response_type=token` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(LOGIN_SCOPE)}`;

loginBtn.href = discordLoginURL;
addBotBtn.href = ADD_BOT_URL;

/* =========================
   UTILS
========================= */

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getTokenFromHash() {
  const hash = window.location.hash;

  if (!hash.includes("access_token")) return null;

  const params = new URLSearchParams(hash.substring(1));

  return params.get("access_token");
}

function getToken() {
  const hashToken = getTokenFromHash();

  if (hashToken) {
    localStorage.setItem(TOKEN_KEY, hashToken);

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    return hashToken;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SELECTED_GUILD_KEY);

  location.reload();
}

logoutBtn.addEventListener("click", logout);

/* =========================
   DISCORD API
========================= */

async function discordApi(path, token) {
  const response = await fetch(`https://discord.com/api${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Erro Discord API");
  }

  return response.json();
}

async function getUser(token) {
  return discordApi("/users/@me", token);
}

async function getGuilds(token) {
  return discordApi("/users/@me/guilds", token);
}

/* =========================
   USER
========================= */

function renderUser(user) {
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  userAvatar.src = avatar;
  userName.textContent = user.username;
  userEmail.textContent = user.email || "Sem email";
}

/* =========================
   GUILDS
========================= */

function guildIcon(guild) {
  if (guild.icon) {
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
  }

  return "https://cdn-icons-png.flaticon.com/512/5968/5968756.png";
}

function renderGuilds(guilds) {
  guildsDiv.innerHTML = "";

  guilds.forEach((guild) => {
    const div = document.createElement("div");

    div.className = "guild-card";

    div.innerHTML = `
      <img src="${guildIcon(guild)}">
      <div class="guild-info">
        <h3>${escapeHtml(guild.name)}</h3>
        <p>${guild.id}</p>
      </div>
    `;

    div.onclick = async () => {
      localStorage.setItem(SELECTED_GUILD_KEY, guild.id);

      await loadGuild(guild);
    };

    guildsDiv.appendChild(div);
  });
}

/* =========================
   LOAD GUILD
========================= */

async function loadGuild(guild) {
  selectedGuildName.textContent = guild.name;
  selectedGuildId.textContent = guild.id;

  channelsDiv.innerHTML = "A carregar...";
  rolesDiv.innerHTML = "A carregar...";

  try {
    const guildRef = doc(db, "guilds", guild.id);

    const snap = await getDoc(guildRef);

    if (!snap.exists()) {
      channelsDiv.innerHTML = "Bot ainda não sincronizou.";
      rolesDiv.innerHTML = "Bot ainda não sincronizou.";
      return;
    }

    const data = snap.data();

    renderChannels(data.channels || []);
    renderRoles(data.roles || []);

    loadSettings(data);

  } catch (err) {
    console.error(err);

    channelsDiv.innerHTML = "Erro ao carregar.";
    rolesDiv.innerHTML = "Erro ao carregar.";
  }
}

/* =========================
   CHANNELS
========================= */

function renderChannels(channels) {
  channelsDiv.innerHTML = "";

  welcomeChannel.innerHTML = "";
  leaveChannel.innerHTML = "";

  channels.forEach((channel) => {
    const div = document.createElement("div");

    div.className = "channel-item";

    div.innerHTML = `
      <span># ${escapeHtml(channel.name)}</span>
    `;

    channelsDiv.appendChild(div);

    const opt1 = document.createElement("option");
    opt1.value = channel.id;
    opt1.textContent = channel.name;

    const opt2 = document.createElement("option");
    opt2.value = channel.id;
    opt2.textContent = channel.name;

    welcomeChannel.appendChild(opt1);
    leaveChannel.appendChild(opt2);
  });
}

/* =========================
   ROLES
========================= */

function renderRoles(roles) {
  rolesDiv.innerHTML = "";
  autoRoleSelect.innerHTML = "";

  roles.forEach((role) => {
    const div = document.createElement("div");

    div.className = "role-item";

    div.innerHTML = `
      <span>@ ${escapeHtml(role.name)}</span>
    `;

    rolesDiv.appendChild(div);

    const option = document.createElement("option");

    option.value = role.id;
    option.textContent = role.name;

    autoRoleSelect.appendChild(option);
  });
}

/* =========================
   SETTINGS
========================= */

function loadSettings(data) {
  if (data.welcomeChannel) {
    welcomeChannel.value = data.welcomeChannel;
  }

  if (data.leaveChannel) {
    leaveChannel.value = data.leaveChannel;
  }

  if (data.autoRole) {
    autoRoleSelect.value = data.autoRole;
  }

  if (data.welcomeMessage) {
    welcomeMessage.value = data.welcomeMessage;
  }

  if (data.leaveMessage) {
    leaveMessage.value = data.leaveMessage;
  }

  antiLinkToggle.checked = data.antiLink || false;
}

/* =========================
   SAVE CONFIG
========================= */

async function updateGuildData(data) {
  const guildId = localStorage.getItem(SELECTED_GUILD_KEY);

  if (!guildId) return;

  const guildRef = doc(db, "guilds", guildId);

  await updateDoc(guildRef, data);
}

saveWelcomeBtn.onclick = async () => {
  await updateGuildData({
    welcomeChannel: welcomeChannel.value
  });

  alert("Canal de boas-vindas salvo.");
};

saveLeaveBtn.onclick = async () => {
  await updateGuildData({
    leaveChannel: leaveChannel.value
  });

  alert("Canal de saída salvo.");
};

saveMessagesBtn.onclick = async () => {
  await updateGuildData({
    welcomeMessage: welcomeMessage.value,
    leaveMessage: leaveMessage.value
  });

  alert("Mensagens salvas.");
};

saveAutoRoleBtn.onclick = async () => {
  await updateGuildData({
    autoRole: autoRoleSelect.value
  });

  alert("Autorole salva.");
};

saveAntiLinkBtn.onclick = async () => {
  await updateGuildData({
    antiLink: antiLinkToggle.checked
  });

  alert("Anti-link atualizado.");
};

/* =========================
   INIT
========================= */

async function init() {
  const token = getToken();

  if (!token) {
    landingPage.style.display = "flex";
    dashboardPage.style.display = "none";
    return;
  }

  landingPage.style.display = "none";
  dashboardPage.style.display = "block";

  try {
    const user = await getUser(token);

    renderUser(user);

    const guilds = await getGuilds(token);

    const ownedGuilds = guilds.filter((g) => g.owner);

    renderGuilds(ownedGuilds);

    const savedGuild = localStorage.getItem(SELECTED_GUILD_KEY);

    let firstGuild = ownedGuilds[0];

    if (savedGuild) {
      const found = ownedGuilds.find((g) => g.id === savedGuild);

      if (found) {
        firstGuild = found;
      }
    }

    if (firstGuild) {
      await loadGuild(firstGuild);
    }

  } catch (err) {
    console.error(err);

    logout();
  }
}

init();
