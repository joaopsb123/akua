const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = "https://akua-lake.vercel.app/";

const loginBtn = document.getElementById("loginBtn");

// URL de login (AGORA com token)
const discordAuthURL =
  `https://discord.com/oauth2/authorize?client_id=1447995914290594056&response_type=code&redirect_uri=https%3A%2F%2Fakua-lake.vercel.app%2F&scope=identify` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=token` +
  `&scope=identify`;

loginBtn.href = discordAuthURL;

// 👉 função para obter token da URL (#access_token)
function getToken() {
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.substring(1));
  return params.get("access_token");
}

// 👉 buscar dados do utilizador
async function getUser(token) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return await res.json();
}

// 👉 mostrar user no site
async function init() {
  const token = getToken();
  if (!token) return;

  const user = await getUser(token);

  // esconder botão
  loginBtn.style.display = "none";

  // criar UI do user
  const container = document.createElement("div");

  const avatar = document.createElement("img");
  avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  avatar.style.width = "100px";
  avatar.style.borderRadius = "50%";

  const name = document.createElement("h2");
  name.innerText = `${user.username}`;

  container.appendChild(avatar);
  container.appendChild(name);

  document.body.appendChild(container);
}

init();
