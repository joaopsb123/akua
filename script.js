const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = window.location.origin;

const discordAuthURL =
  `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;

document.getElementById("loginBtn").href = discordAuthURL;
