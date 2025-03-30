export const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vue's runtime
    "'unsafe-eval'",   // Required for Vue's runtime
    "https://*.firebaseapp.com",
    "https://*.firebaseio.com",
    "https://*.googleapis.com"
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Font Awesome
    "https://fonts.googleapis.com"
  ],
  'img-src': [
    "'self'",
    "data:",
    "https://*.firebaseapp.com",
    "https://*.firebaseio.com",
    "https://*.googleapis.com"
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com"
  ],
  'connect-src': [
    "'self'",
    "https://*.firebaseapp.com",
    "https://*.firebaseio.com",
    "https://*.googleapis.com"
  ],
  'frame-src': [
    "'self'",
    "https://*.firebaseapp.com"
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
}

export const generateCSPHeader = () => {
  return Object.entries(cspDirectives)
    .map(([key, values]) => {
      if (values.length === 0) return key
      return `${key} ${values.join(' ')}`
    })
    .join('; ')
} 