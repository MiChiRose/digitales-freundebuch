import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../context/firebaseConfig';

const CONFIG_CACHE_KEY = 'runtime_config_v1';

export const DEFAULT_RUNTIME_CONFIG = {
  featureFlags: {
    secretChatEnabled: true,
    localCatEasterEggEnabled: true,
    seasonalEasterEgg: {
      enabled: false,
      id: 'six_seven',
      value: '67',
      triggerTapCount: 7,
      maxRunsPerDay: 1,
      durationMs: 1800,
      locales: ['de', 'en', 'ru'],
      startsAt: null,
      endsAt: null,
    },
  },
  moderation: {
    chat: {
      enabled: true,
      maxMessageLength: 300,
      minSecondsBetweenMessages: 2,
      repeatBlockThreshold: 3,
      repeatedBlockMs: 60000,
      blockedWindowMs: 120000,
    },
    filters: {
      enabled: true,
      blockUrls: true,
      blockEmails: true,
      blockPhoneNumbers: true,
      blockedTerms: [],
    },
  },
};

const isPlainObject = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const compactObject = (value) => {
  if (!isPlainObject(value)) return value;

  return Object.entries(value).reduce((result, [key, entry]) => {
    if (entry === undefined) return result;
    result[key] = isPlainObject(entry) ? compactObject(entry) : entry;
    return result;
  }, {});
};

const mergeConfig = (base, override) => {
  if (!isPlainObject(override)) return base;

  return Object.entries(override).reduce((result, [key, value]) => {
    if (value === undefined) return result;

    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeConfig(result[key], value);
    } else {
      result[key] = value;
    }

    return result;
  }, { ...base });
};

const normalizeFeatureFlags = (data = {}) => {
  const seasonal = data.seasonal_easter_egg || data.seasonalEasterEgg || {};
  const asset = seasonal.asset || {};
  const animation = seasonal.animation || {};

  return compactObject({
    secretChatEnabled: data.secret_chat_enabled ?? data.secretChatEnabled,
    localCatEasterEggEnabled: data.local_cat_easter_egg_enabled ?? data.localCatEasterEggEnabled,
    seasonalEasterEgg: {
      enabled: seasonal.enabled,
      id: seasonal.id,
      value: seasonal.value ?? asset.value,
      triggerTapCount: seasonal.trigger_tap_count ?? seasonal.triggerTapCount,
      maxRunsPerDay: seasonal.max_runs_per_day ?? seasonal.maxRunsPerDay,
      durationMs: animation.duration_ms ?? seasonal.duration_ms ?? seasonal.durationMs,
      locales: seasonal.locales,
      startsAt: seasonal.starts_at ?? seasonal.startsAt,
      endsAt: seasonal.ends_at ?? seasonal.endsAt,
    },
  });
};

const normalizeModeration = (data = {}) => {
  const chat = data.chat || {};
  const filters = data.filters || {};

  return compactObject({
    chat: {
      enabled: chat.enabled,
      maxMessageLength: chat.max_message_length ?? chat.maxMessageLength,
      minSecondsBetweenMessages: chat.min_seconds_between_messages ?? chat.minSecondsBetweenMessages,
      repeatBlockThreshold: chat.repeat_block_threshold ?? chat.repeatBlockThreshold,
      repeatedBlockMs: chat.repeated_block_ms ?? chat.repeatedBlockMs,
      blockedWindowMs: chat.blocked_window_ms ?? chat.blockedWindowMs,
    },
    filters: {
      enabled: filters.enabled,
      blockUrls: filters.block_urls ?? filters.blockUrls,
      blockEmails: filters.block_emails ?? filters.blockEmails,
      blockPhoneNumbers: filters.block_phone_numbers ?? filters.blockPhoneNumbers,
      blockedTerms: filters.blocked_terms ?? filters.blockedTerms,
    },
  });
};

const readCachedConfig = async () => {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const saveCachedConfig = async (config) => {
  try {
    await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch (error) {
    // Runtime config is nice-to-have; the built-in defaults remain safe.
  }
};

export const loadRuntimeConfig = async () => {
  let config = mergeConfig(DEFAULT_RUNTIME_CONFIG, await readCachedConfig());

  if (!db) return config;

  try {
    const [featureFlagsSnap, moderationSnap] = await Promise.all([
      getDoc(doc(db, 'config', 'feature_flags')),
      getDoc(doc(db, 'config', 'moderation')),
    ]);

    if (featureFlagsSnap.exists()) {
      config = mergeConfig(config, {
        featureFlags: normalizeFeatureFlags(featureFlagsSnap.data()),
      });
    }

    if (moderationSnap.exists()) {
      config = mergeConfig(config, {
        moderation: normalizeModeration(moderationSnap.data()),
      });
    }

    await saveCachedConfig(config);
  } catch (error) {
    // Stay quiet for children: offline/missing config should never block the app.
  }

  return config;
};

const getTime = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const isSeasonalEasterEggActive = (config, language) => {
  const egg = config?.featureFlags?.seasonalEasterEgg;
  if (!egg?.enabled) return false;

  const languageCode = (language || 'de').split('-')[0];
  if (Array.isArray(egg.locales) && egg.locales.length > 0 && !egg.locales.includes(languageCode)) {
    return false;
  }

  const now = Date.now();
  const startsAt = getTime(egg.startsAt);
  const endsAt = getTime(egg.endsAt);

  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;

  return true;
};

export const getSeasonalEggRunKey = (egg) => {
  const today = new Date().toISOString().slice(0, 10);
  return `seasonal_egg_runs_${egg?.id || 'default'}_${today}`;
};
