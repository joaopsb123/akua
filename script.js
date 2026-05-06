const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

const loginBtn = document.getElementById("loginBtn");
const userBox = document.getElementById("userBox");

const discordAuthURL =
  `https://discord.com/oauth2/authorize?client_id=1447995914290594056&response_type=code&redirect_uri=https%3A%2F%2Fakua-lake.vercel.app%2F&scope=identify` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token` +
  `&scope=identify`;

loginBtn.href = discordAuthURL;

function getToken() {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  return params.get("access_token");
}

async function getUser(token) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
}

async function init() {
  const token = getToken();
  if (!token) return;

  const user = await getUser(token);

  loginBtn.style.display = "none";

  userBox.innerHTML = `
    <img class="user-avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png">
    <div class="username">${user.username}</div>
  `;
}

init();
