const CLIENT_ID = "1447995914290594056";
const REDIRECT_URI = window.location.origin;

const discordAuthURL =
  `https://discord.com/oauth2/authorize?client_id=1447995914290594056&response_type=code&redirect_uri=https%3A%2F%2Fakua-lake.vercel.app%2F&scope=identify`;

document.getElementById("loginBtn").href = discordAuthURL;
