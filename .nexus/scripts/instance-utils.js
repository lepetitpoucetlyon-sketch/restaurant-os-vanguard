const fs = require('fs');
const path = require('path');

const ENV_KEY_ORDER = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_TAGLINE',
  'NEXT_PUBLIC_APP_DESCRIPTION',
  'NEXT_PUBLIC_SUPPORT_EMAIL',
  'NEXT_PUBLIC_SUPPORT_PHONE',
  'NEXT_PUBLIC_DEFAULT_DOMAIN',
  'NEXT_PUBLIC_RESTAURANT_NAME',
  'NEXT_PUBLIC_RESTAURANT_SLOGAN',
  'NEXT_PUBLIC_RESTAURANT_CUISINE',
  'NEXT_PUBLIC_RESTAURANT_CATEGORY',
  'NEXT_PUBLIC_RESTAURANT_SHORT_DESCRIPTION',
  'NEXT_PUBLIC_RESTAURANT_LONG_DESCRIPTION',
  'NEXT_PUBLIC_RESTAURANT_HEAD_CHEF',
  'NEXT_PUBLIC_RESTAURANT_OWNER',
  'NEXT_PUBLIC_RESTAURANT_LOGO',
  'NEXT_PUBLIC_PRIMARY_COLOR',
  'NEXT_PUBLIC_SECONDARY_COLOR',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_ENABLE_PROFILE_SWITCHER',
];

const REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_DEFAULT_DOMAIN',
  'NEXT_PUBLIC_RESTAURANT_NAME',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
];

const DEFAULT_PLACEHOLDER_VALUES = new Map([
  ['NEXT_PUBLIC_APP_NAME', ['PLACEHOLDER_APP_NAME']],
  ['NEXT_PUBLIC_APP_TAGLINE', ['PLACEHOLDER_TAGLINE']],
  ['NEXT_PUBLIC_SUPPORT_EMAIL', ['placeholder@example.com']],
  ['NEXT_PUBLIC_DEFAULT_DOMAIN', ['placeholder.local']],
  ['NEXT_PUBLIC_RESTAURANT_NAME', ['PLACEHOLDER_RESTAURANT_NAME']],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', ['your-firebase-project-id', 'PLACEHOLDER_PROJECT_ID']],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', ['your-firebase-app-id']],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', ['your-firebase-storage-bucket', 'PLACEHOLDER_BUCKET']],
  ['NEXT_PUBLIC_FIREBASE_API_KEY', ['your-firebase-api-key', 'PLACEHOLDER_KEY']],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', ['your-firebase-auth-domain', 'PLACEHOLDER_DOMAIN']],
  ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', ['your-firebase-messaging-sender-id', 'PLACEHOLDER_SENDER']],
  ['GEMINI_API_KEY', ['your-gemini-api-key', 'PLACEHOLDER_AI_KEY']],
]);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function coalesce(...values) {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function normalizeDomain(value) {
  return normalizeString(value)
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/g, '');
}

function toBooleanString(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return 'true';
    }
    if (normalized === 'false') {
      return 'false';
    }
  }

  return fallback ? 'true' : 'false';
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath}`);
  }
}

function readJsonFile(filePath) {
  ensureFileExists(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function buildEnvMapFromClientConfig(rawConfig) {
  const config = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
  const app = config.app && typeof config.app === 'object' ? config.app : {};
  const restaurant = config.restaurant && typeof config.restaurant === 'object'
    ? config.restaurant
    : {};
  const firebase = config.firebase && typeof config.firebase === 'object' ? config.firebase : {};
  const ai = config.ai && typeof config.ai === 'object' ? config.ai : {};
  const features = config.features && typeof config.features === 'object' ? config.features : {};

  const defaultDomain = normalizeDomain(
    coalesce(app.defaultDomain, app.domain, restaurant.domain),
  );

  const projectId = coalesce(firebase.projectId);
  const storageBucket = coalesce(
    firebase.storageBucket,
    projectId ? `${projectId}.firebasestorage.app` : '',
  );
  const authDomain = normalizeDomain(
    coalesce(firebase.authDomain, projectId ? `${projectId}.firebaseapp.com` : ''),
  );
  const appName = coalesce(app.name, restaurant.name, 'Restaurant OS');
  const restaurantName = coalesce(restaurant.name, appName, 'Restaurant OS');

  const envMap = {
    NEXT_PUBLIC_APP_NAME: appName,
    NEXT_PUBLIC_APP_TAGLINE: coalesce(app.tagline, 'Premium Intelligence'),
    NEXT_PUBLIC_APP_DESCRIPTION: coalesce(
      app.description,
      'The next generation operating system for modern restaurants',
    ),
    NEXT_PUBLIC_SUPPORT_EMAIL: coalesce(
      app.supportEmail,
      defaultDomain ? `contact@${defaultDomain}` : '',
    ),
    NEXT_PUBLIC_SUPPORT_PHONE: coalesce(app.supportPhone, ''),
    NEXT_PUBLIC_DEFAULT_DOMAIN: defaultDomain,
    NEXT_PUBLIC_RESTAURANT_NAME: restaurantName,
    NEXT_PUBLIC_RESTAURANT_SLOGAN: coalesce(restaurant.slogan, ''),
    NEXT_PUBLIC_RESTAURANT_CUISINE: coalesce(restaurant.cuisine, 'Francaise'),
    NEXT_PUBLIC_RESTAURANT_CATEGORY: coalesce(restaurant.category, 'bistrot'),
    NEXT_PUBLIC_RESTAURANT_SHORT_DESCRIPTION: coalesce(restaurant.shortDescription, ''),
    NEXT_PUBLIC_RESTAURANT_LONG_DESCRIPTION: coalesce(restaurant.longDescription, ''),
    NEXT_PUBLIC_RESTAURANT_HEAD_CHEF: coalesce(restaurant.headChef, ''),
    NEXT_PUBLIC_RESTAURANT_OWNER: coalesce(restaurant.owner, ''),
    NEXT_PUBLIC_RESTAURANT_LOGO: coalesce(restaurant.logo, ''),
    NEXT_PUBLIC_PRIMARY_COLOR: coalesce(config.theme?.primaryColor, '#C5A059'),
    NEXT_PUBLIC_SECONDARY_COLOR: coalesce(config.theme?.secondaryColor, '#1C1C1C'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NEXT_PUBLIC_FIREBASE_APP_ID: coalesce(firebase.appId, ''),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: storageBucket,
    NEXT_PUBLIC_FIREBASE_API_KEY: coalesce(firebase.apiKey, ''),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: coalesce(firebase.messagingSenderId, ''),
    GEMINI_API_KEY: coalesce(ai.geminiApiKey, ''),
    NEXT_PUBLIC_ENABLE_PROFILE_SWITCHER: toBooleanString(features.enableProfileSwitcher, false),
  };

  return Object.fromEntries(
    ENV_KEY_ORDER.map((key) => [key, envMap[key] ?? '']),
  );
}

function parseDotEnv(content) {
  const env = {};

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function serializeEnvValue(value) {
  const normalized = String(value ?? '');
  if (!normalized) {
    return '';
  }

  return /^[A-Za-z0-9_./:@+-]+$/u.test(normalized)
    ? normalized
    : JSON.stringify(normalized);
}

function formatEnvFile(envMap) {
  return ENV_KEY_ORDER
    .map((key) => `${key}=${serializeEnvValue(envMap[key] ?? '')}`)
    .join('\n') + '\n';
}

function isPlaceholderValue(key, value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return false;
  }

  const placeholders = DEFAULT_PLACEHOLDER_VALUES.get(key) || [];
  if (placeholders.includes(normalized)) {
    return true;
  }

  return normalized.startsWith('your-');
}

function validateEnvMap(envMap) {
  const errors = [];
  const warnings = [];

  for (const key of REQUIRED_ENV_KEYS) {
    if (!normalizeString(envMap[key])) {
      errors.push(`${key} est requis.`);
    }
  }

  for (const [key, value] of Object.entries(envMap)) {
    if (isPlaceholderValue(key, value)) {
      errors.push(`${key} utilise encore une valeur de placeholder.`);
    }
  }

  const domain = normalizeDomain(envMap.NEXT_PUBLIC_DEFAULT_DOMAIN);
  if (domain !== normalizeString(envMap.NEXT_PUBLIC_DEFAULT_DOMAIN)) {
    warnings.push('NEXT_PUBLIC_DEFAULT_DOMAIN devrait etre renseigne sans protocole.');
  }

  if (domain && !domain.includes('.')) {
    warnings.push('NEXT_PUBLIC_DEFAULT_DOMAIN semble incomplet.');
  }

  if (!normalizeString(envMap.NEXT_PUBLIC_SUPPORT_EMAIL)) {
    warnings.push('NEXT_PUBLIC_SUPPORT_EMAIL est vide.');
  }

  if (!normalizeString(envMap.NEXT_PUBLIC_SUPPORT_PHONE)) {
    warnings.push('NEXT_PUBLIC_SUPPORT_PHONE est vide.');
  }

  if (!normalizeString(envMap.GEMINI_API_KEY)) {
    warnings.push('GEMINI_API_KEY est vide. L’assistant IA ne fonctionnera pas.');
  }

  if (normalizeString(envMap.NEXT_PUBLIC_ENABLE_PROFILE_SWITCHER) === 'true') {
    warnings.push('NEXT_PUBLIC_ENABLE_PROFILE_SWITCHER=true est reserve aux cas de support admin.');
  }

  return { errors, warnings };
}

function loadConfigInput(inputPath) {
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  const extension = path.extname(resolvedPath).toLowerCase();

  if (extension === '.json') {
    const config = readJsonFile(resolvedPath);
    return {
      resolvedPath,
      inputType: 'json',
      envMap: buildEnvMapFromClientConfig(config),
    };
  }

  ensureFileExists(resolvedPath);
  return {
    resolvedPath,
    inputType: 'env',
    envMap: parseDotEnv(fs.readFileSync(resolvedPath, 'utf8')),
  };
}

module.exports = {
  buildEnvMapFromClientConfig,
  ENV_KEY_ORDER,
  formatEnvFile,
  loadConfigInput,
  normalizeDomain,
  parseDotEnv,
  readJsonFile,
  serializeEnvValue,
  validateEnvMap,
};
