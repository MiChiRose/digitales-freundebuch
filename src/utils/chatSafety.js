import AsyncStorage from '@react-native-async-storage/async-storage';

const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

const CHARACTER_MAP = {
  '@': 'a',
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '$': 's',
  а: 'a',
  в: 'b',
  е: 'e',
  ё: 'e',
  з: 'z',
  и: 'i',
  к: 'k',
  м: 'm',
  н: 'h',
  о: 'o',
  р: 'p',
  с: 'c',
  т: 't',
  у: 'y',
  х: 'x',
};

const BLOCKED_TERMS = [
  'fuck',
  'fck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'cunt',
  'slut',
  'whore',
  'scheisse',
  'scheiße',
  'arschloch',
  'fick',
  'wichser',
  'fotze',
  'hurensohn',
  'miststueck',
  'miststück',
  'сука',
  'бля',
  'бляд',
  'хуй',
  'хуе',
  'хуё',
  'пизд',
  'еба',
  'ёба',
  'ебл',
  'ёбл',
  'мудак',
  'говн',
  'дерьм',
  'жоп',
];

const RISKY_CONTENT_TERMS = [
  'drug',
  'drugs',
  'weed',
  'cocaine',
  'weapon',
  'bomb',
  'hack',
  'наркот',
  'оруж',
  'бомб',
  'взлом',
  'drogen',
  'waffe',
  'bombe',
];

const URL_REGEX = /(https?:\/\/|www\.|[\w-]+\.(com|net|org|ru|de|io|gg|me|app)\b)/i;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX = /(?:\+?\d[\s().-]*){7,}/;

export const normalizeModerationText = (text = '') => {
  const lower = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(ZERO_WIDTH_REGEX, '');

  const mapped = Array.from(lower)
    .map((char) => CHARACTER_MAP[char] || char)
    .join('');

  return mapped.replace(/(.)\1{2,}/g, '$1$1');
};

const compactText = (text) => normalizeModerationText(text).replace(/[^a-zа-яё0-9]+/gi, '');

const normalizeTerm = (term) => compactText(term);

const hasBlockedTerm = (text, extraTerms = []) => {
  const compact = compactText(text);
  const terms = [...BLOCKED_TERMS, ...extraTerms].map(normalizeTerm).filter(Boolean);

  return terms.some((term) => compact.includes(term));
};

const hasRiskyContentTerm = (text) => {
  const compact = compactText(text);
  return RISKY_CONTENT_TERMS.map(normalizeTerm).some((term) => compact.includes(term));
};

export const checkMessageSafety = (text, moderationConfig = {}) => {
  const trimmed = text.trim();
  const chat = moderationConfig.chat || {};
  const filters = moderationConfig.filters || {};
  const maxLength = chat.maxMessageLength || 300;

  if (!chat.enabled) {
    return { allowed: false, reason: 'chat_disabled' };
  }

  if (!trimmed) {
    return { allowed: false, reason: 'empty' };
  }

  if (trimmed.length > maxLength) {
    return { allowed: false, reason: 'too_long', maxLength };
  }

  if (!filters.enabled) {
    return { allowed: true, text: trimmed };
  }

  if (filters.blockUrls && URL_REGEX.test(trimmed)) {
    return { allowed: false, reason: 'personal_info' };
  }

  if (filters.blockEmails && EMAIL_REGEX.test(trimmed)) {
    return { allowed: false, reason: 'personal_info' };
  }

  if (filters.blockPhoneNumbers && PHONE_REGEX.test(trimmed)) {
    return { allowed: false, reason: 'personal_info' };
  }

  if (hasBlockedTerm(trimmed, filters.blockedTerms || [])) {
    return { allowed: false, reason: 'kind_words' };
  }

  if (hasRiskyContentTerm(trimmed)) {
    return { allowed: false, reason: 'unsafe_topic' };
  }

  return { allowed: true, text: trimmed };
};

const safetyStateKey = (roomCode, userId) => `chat_safety_${roomCode}_${userId || 'anonymous'}`;

const readSafetyState = async (roomCode, userId) => {
  try {
    const raw = await AsyncStorage.getItem(safetyStateKey(roomCode, userId));
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const writeSafetyState = async (roomCode, userId, state) => {
  try {
    await AsyncStorage.setItem(safetyStateKey(roomCode, userId), JSON.stringify(state));
  } catch (error) {
    // If storage fails, keep the current in-memory screen state.
  }
};

export const getActiveSafetyLock = async (roomCode, userId) => {
  const state = await readSafetyState(roomCode, userId);
  const lockedUntil = Number(state.lockedUntil || 0);

  if (lockedUntil > Date.now()) {
    return lockedUntil;
  }

  if (lockedUntil) {
    await writeSafetyState(roomCode, userId, { ...state, lockedUntil: 0 });
  }

  return 0;
};

export const registerBlockedMessage = async (roomCode, userId, moderationConfig = {}) => {
  const chat = moderationConfig.chat || {};
  const now = Date.now();
  const blockedWindowMs = chat.blockedWindowMs || 120000;
  const repeatBlockThreshold = chat.repeatBlockThreshold || 3;
  const repeatedBlockMs = chat.repeatedBlockMs || 60000;
  const current = await readSafetyState(roomCode, userId);

  const windowStartedAt = Number(current.windowStartedAt || 0);
  const windowExpired = !windowStartedAt || now - windowStartedAt > blockedWindowMs;
  const blockedCount = (windowExpired ? 0 : Number(current.blockedCount || 0)) + 1;
  const nextState = {
    windowStartedAt: windowExpired ? now : windowStartedAt,
    blockedCount,
    lockedUntil: Number(current.lockedUntil || 0),
  };

  if (blockedCount >= repeatBlockThreshold) {
    nextState.blockedCount = 0;
    nextState.windowStartedAt = now;
    nextState.lockedUntil = now + repeatedBlockMs;
  }

  await writeSafetyState(roomCode, userId, nextState);
  return nextState.lockedUntil || 0;
};

export const getRemainingSeconds = (until) => Math.max(0, Math.ceil((until - Date.now()) / 1000));
