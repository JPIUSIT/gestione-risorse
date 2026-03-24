export const msalConfig = {
  auth: {
    clientId: "3bfedb30-8ce5-44d1-b303-0ed3ed46e07c",
    authority: "https://login.microsoftonline.com/273b2264-8794-4248-aa86-f772d50456e6",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read", "profile", "email", "openid"],
};

export const graphRequest = {
  scopes: ["Sites.Read.All"],
};

export const getRuoloFromAccount = (account) => {
  if (!account) return null
  const roles = account.idTokenClaims?.roles || []
  if (roles.includes('Admin')) return 'Admin'
  if (roles.includes('Coordinatore')) return 'Coordinatore'
  if (roles.includes('Membro')) return 'Membro'
  return null
}