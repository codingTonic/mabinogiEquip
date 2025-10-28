// js/main.js
// UI 로직과 이벤트 바인딩을 담당하는 ES 모듈

import {
  jobs,
  equipmentTypes,
  baseRunes,
  weaponRuneGroups,
  weaponSeasons,
  armorRuneGroups,
  armorSeasons,
  emblemRuneGroups,
  emblemSeasons,
  DEFAULT_RUNE_MESSAGE,
  getAllowedRunesForJob,
  getRuneDetails
} from './data.js';

import {
  getCharacters,
  addCharacter,
  removeCharacter,
  getSelectedCharIndex,
  setSelectedCharIndex,
  getCurrentEditingChar,
  setCurrentEditingChar,
  getActiveEquipKey,
  setActiveEquipKey,
  getRuneSelectionDraft,
  setRuneSelectionDraft,
  resetRuneSelectionDraft,
  getRuneGradeDraft,
  setRuneGradeDraft,
  resetRuneGradeDraft,
  getActiveWeaponRuneSeason,
  setActiveWeaponRuneSeason,
  resetActiveWeaponRuneSeason,
  getActiveArmorRuneSeason,
  setActiveArmorRuneSeason,
  resetActiveArmorRuneSeason,
  getActiveEmblemRuneSeason,
  setActiveEmblemRuneSeason,
  resetActiveEmblemRuneSeason,
  getShowGemOptions,
  setShowGemOptions
} from './state.js';

const characterListEl = document.getElementById('characterList');
const addCharacterBtn = document.getElementById('addCharacterBtn');
const charEditorSection = document.getElementById('character-editor');
const charNameInput = document.getElementById('charNameInput');
const charJobSelect = document.getElementById('charJobSelect');
const toggleGemOptionsCheckbox = document.getElementById('toggleGemOptions');
const equipmentSection = document.getElementById('equipmentSection');
const saveCharacterBtn = document.getElementById('saveCharacterBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const deleteCharacterBtn = document.getElementById('deleteCharacterBtn');
const runeInfoPanel = document.getElementById('runeInfoPanel');
const runeInfoMessage = document.getElementById('runeInfoMessage');
const runeListEl = document.getElementById('runeList');
const backToEquipmentBtn = document.getElementById('backToEquipmentBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const runeSummaryModal = document.getElementById('runeSummaryModal');
const runeSummaryContent = document.getElementById('runeSummaryContent');
const openSummaryBtn = document.getElementById('openSummaryBtn');
const copySummaryBtn = document.getElementById('copySummaryBtn');
const gemSummaryList = document.getElementById('gemSummaryList');
const summaryCloseButtons = document.querySelectorAll('[data-action="close-summary"]');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const openStatsCalcBtn = document.getElementById('openStatsCalcBtn');
const toggleFavoritesOnlyCheckbox = document.getElementById('toggleFavoritesOnly');

const THEME_STORAGE_KEY = 'mabinogiTheme';
const CHARACTERS_STORAGE_KEY = 'mabinogiCharacters';
const FAVORITE_RUNES_STORAGE_KEY = 'mabinogiFavoriteRunes';
const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
let currentTheme = 'light';
const SUMMARY_COPY_LABEL_DEFAULT = copySummaryBtn?.textContent?.trim() || '📋 복사';
const SUMMARY_COPY_LABEL_SUCCESS = '✅ 복사됨';
const SUMMARY_COPY_LABEL_ERROR = '⚠️ 복사 실패';
let summaryCopyFeedbackTimer = null;
let favoriteRunes = new Set();
let showFavoritesOnly = false;

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('로컬 저장소에 접근할 수 없습니다.', error);
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('테마를 저장할 수 없습니다.', error);
  }
}

function saveCharactersToStorage() {
  try {
    const characters = getCharacters();
    const showGem = getShowGemOptions();
    const data = {
      version: '1.0',
      characters,
      showGemOptions: showGem,
      timestamp: Date.now()
    };
    localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('캐릭터 데이터를 저장할 수 없습니다.', error);
  }
}

function loadCharactersFromStorage() {
  try {
    const stored = localStorage.getItem(CHARACTERS_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data.characters || !Array.isArray(data.characters)) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn('저장된 캐릭터 데이터를 불러올 수 없습니다.', error);
    return null;
  }
}

function loadFavoriteRunes() {
  try {
    const stored = localStorage.getItem(FAVORITE_RUNES_STORAGE_KEY);
    if (!stored) return new Set();
    const arr = JSON.parse(stored);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (error) {
    console.warn('즐겨찾기 룬 데이터를 불러올 수 없습니다.', error);
    return new Set();
  }
}

function saveFavoriteRunes() {
  try {
    localStorage.setItem(FAVORITE_RUNES_STORAGE_KEY, JSON.stringify([...favoriteRunes]));
  } catch (error) {
    console.warn('즐겨찾기 룬을 저장할 수 없습니다.', error);
  }
}

function toggleFavoriteRune(runeName) {
  if (favoriteRunes.has(runeName)) {
    favoriteRunes.delete(runeName);
  } else {
    favoriteRunes.add(runeName);
  }
  saveFavoriteRunes();
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('theme-dark', isDark);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = isDark ? '☀️ 라이트 모드' : '🌙 다크 모드';
  }
  currentTheme = theme;
}

const storedTheme = getStoredTheme();
if (storedTheme) {
  applyTheme(storedTheme);
} else {
  applyTheme(prefersDarkQuery.matches ? 'dark' : 'light');
}

const handlePrefersChange = (event) => {
  if (!getStoredTheme()) {
    applyTheme(event.matches ? 'dark' : 'light');
  }
};

if (typeof prefersDarkQuery.addEventListener === 'function') {
  prefersDarkQuery.addEventListener('change', handlePrefersChange);
} else if (typeof prefersDarkQuery.addListener === 'function') {
  prefersDarkQuery.addListener(handlePrefersChange);
}

const RARITY_CLASS_MAP = {
  '엘리트': 'elite',
  '전설': 'legendary',
  '에픽': 'epic',
  '신화': 'mythic',
  'NEW': 'new'
};

const BASE_RARITIES = ['엘리트', '에픽', '전설', '신화'];

const GEM_OPTION_TYPES = ['생존', '방해', '강타', '보조', '이동', '연타', '소환', '원소'];
const GEM_OPTION_VARIANTS = ['데미지 증가', '재사용 대기시간 감소'];
const GEM_OPTION_CHOICES = GEM_OPTION_TYPES.flatMap((type) =>
  GEM_OPTION_VARIANTS.map((variant) => ({
    value: `${type} - ${variant}`,
    label: `${type} - ${variant}`
  }))
);

const RUNE_BONUS_GROUPS = {
  defense: ['피해 감소', '급소 회피', '회복력'],
  offense: [
    '빠른 스킬',
    '스킬 위력',
    '치명타',
    '추가타',
    '궁극기',
    '브레이크',
    '연타 강화',
    '강타 강화',
    '콤보 강화',
    '광역 강화',
    '빠른 공격'
  ]
};

const GEM_BASE_STATS = [
  { key: 'allStats', label: '모든 능력치', perSelection: 44 },
  { key: 'hp', label: '최대 체력', perSelection: 420 }
];

const GEM_VARIANT_STATS = {
  '데미지 증가': {
    valuePerGem: 2.10,
    formatter: (type, total) => `#${type} 데미지 ${formatStatValue(total)}% 증가`
  },
  '재사용 대기시간 감소': {
    valuePerGem: 0.70,
    formatter: (type, total) => `#${type} 재사용 대기시간 ${formatStatValue(total)}% 감소`
  }
};

const GEM_BASE_ATTRIBUTE_DETAILS = [
  { label: '힘', base: 1239, incrementKey: 'allStats' },
  { label: '솜씨', base: 1239, incrementKey: 'allStats' },
  { label: '지력', base: 1239, incrementKey: 'allStats' },
  { label: '의지', base: 1239, incrementKey: 'allStats' },
  { label: '행운', base: 1239, incrementKey: 'allStats' },
  { label: '공격력', base: 1626 },
  { label: '방어력', base: 2710 },
  { label: '브레이크', base: 342 },
  { label: '강타 강화', base: 342 },
  { label: '콤보 강화', base: 335 },
  { label: '스킬 위력', base: 348 },
  { label: '광역 강화', base: 348 },
  { label: '회복력', base: 350 },
  { label: '급소 회피', base: 81.8, decimals: 1 },
  { label: '추가타', base: 342 },
  { label: '피해 감소', base: 342 },
  { label: '빠른 공격', base: 335 },
  { label: '연타 강화', base: 335 },
  { label: '빠른 스킬', base: 348 },
  { label: '추가 체력', base: 1094, incrementKey: 'hp' },
  { label: '궁극기', base: 350 },
  { label: '치명타', base: 342 },
  { label: '궁극기 (추가)', base: 358 },
  { label: '치명타 (추가)', base: 349.5, decimals: 1 }
];

const ADDITIONAL_BONUS_SOURCES = [
  'rune',
  'gem',
  'pet',
  'levelUpCards',
  'titles',
  'other',
  'manual'
];

const additionalStatBonuses = ADDITIONAL_BONUS_SOURCES.reduce((acc, key) => {
  acc[key] = {};
  return acc;
}, {});

const additionalEffectBonuses = ADDITIONAL_BONUS_SOURCES.reduce((acc, key) => {
  acc[key] = [];
  return acc;
}, {});

const EQUIP_KEYS_WITH_RUNE_BONUS = {
  weapon: { primaryGroup: 'offense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  necklace: { primaryGroup: 'offense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  ring1: { primaryGroup: 'offense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  ring2: { primaryGroup: 'offense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  hat: { primaryGroup: 'defense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  top: { primaryGroup: 'defense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  bottom: { primaryGroup: 'defense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  gloves: { primaryGroup: 'defense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  shoes: { primaryGroup: 'defense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' },
  emblem: { primaryGroup: 'defense', secondaryGroup: 'offense', primaryLabel: '보조 옵션 1', secondaryLabel: '보조 옵션 2' }
};

function resolveRarityClass(label) {
  if (!label) return null;
  const trimmed = label.trim();
  if (RARITY_CLASS_MAP[trimmed]) {
    return RARITY_CLASS_MAP[trimmed];
  }
  const base = Object.keys(RARITY_CLASS_MAP).find((key) => trimmed.startsWith(key));
  return base ? RARITY_CLASS_MAP[base] : null;
}

function normalizeRarityLabel(label) {
  if (!label) return null;
  const trimmed = label.trim();
  if (BASE_RARITIES.includes(trimmed)) {
    return trimmed;
  }
  const base = BASE_RARITIES.find((candidate) => trimmed.startsWith(candidate));
  return base || null;
}

function formatNumber(value, decimals = 0) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatStatValue(value, digits = 2) {
  return parseFloat(value.toFixed(digits)).toString();
}

function createBaseTotals() {
  const totals = {};
  GEM_BASE_STATS.forEach((stat) => {
    totals[stat.key] = 0;
  });
  return totals;
}

function createGemOptionSelect(eqKey, slotIndex, optIndex, initialValue) {
  const select = document.createElement('select');
  select.className = 'gem-option-select';
  select.dataset.gemInput = 'true';
  select.dataset.equipKey = eqKey;
  select.dataset.slotIndex = slotIndex;
  select.dataset.optIndex = optIndex;

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = `옵션 ${optIndex + 1}`;
  select.appendChild(placeholderOption);

  GEM_OPTION_CHOICES.forEach((choice) => {
    const option = document.createElement('option');
    option.value = choice.value;
    option.textContent = choice.label;
    select.appendChild(option);
  });

  if (initialValue) {
    select.value = initialValue;
    if (select.value !== initialValue) {
      const customOption = document.createElement('option');
      customOption.value = initialValue;
      customOption.textContent = initialValue;
      customOption.selected = true;
      customOption.dataset.custom = 'true';
      select.appendChild(customOption);
    }
  }

  return select;
}

function createRuneBonusSelect(eqKey, bonusIndex, config, initialValue) {
  if (!config) return null;
  const select = document.createElement('select');
  select.className = 'rune-bonus-select';
  select.dataset.runeBonusInput = 'true';
  select.dataset.equipKey = eqKey;
  select.dataset.bonusIndex = bonusIndex;

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = bonusIndex === 0
    ? (config.primaryLabel || '보조 옵션 1')
    : (config.secondaryLabel || '보조 옵션 2');
  select.appendChild(placeholder);

  const groupKey = bonusIndex === 0 ? config.primaryGroup : config.secondaryGroup;
  const optionsSource = RUNE_BONUS_GROUPS[groupKey] || [];
  optionsSource.forEach((label) => {
    const option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    select.appendChild(option);
  });

  if (initialValue) {
    select.value = initialValue;
    if (select.value !== initialValue) {
      const custom = document.createElement('option');
      custom.value = initialValue;
      custom.textContent = initialValue;
      custom.selected = true;
      custom.dataset.custom = 'true';
      select.appendChild(custom);
    }
  }

  return select;
}

function getRuneOptionDisplay(value) {
  return value && value.trim() ? value : '없음';
}

function buildRuneSummaryRows(char) {
  const rows = [];
  if (!char || !char.equipment) return rows;
  equipmentTypes.forEach((eq) => {
    const eqData = char.equipment[eq.key] || {};
    const runeName = eqData.rune && eqData.rune.trim() ? eqData.rune : '없음';
    const bonusConfig = EQUIP_KEYS_WITH_RUNE_BONUS[eq.key];
    let bonus1 = '—';
    let bonus2 = '—';
    if (bonusConfig) {
      const options = Array.isArray(eqData.runeOptions) ? eqData.runeOptions : [];
      bonus1 = getRuneOptionDisplay(options[0] || '');
      bonus2 = getRuneOptionDisplay(options[1] || '');
    }
    rows.push({
      equipment: eq.name,
      rune: runeName,
      grade: eqData.runeGrade || null,
      bonus1,
      bonus2,
      hasBonus: Boolean(bonusConfig)
    });
  });
  return rows;
}

function collectGemStatTotals(char) {
  const baseTotals = createBaseTotals();
  const variantTotals = new Map();
  if (!char || !char.equipment) {
    return { baseTotals, variantEntries: [] };
  }

  equipmentTypes.forEach((eq) => {
    const eqData = char.equipment[eq.key];
    if (!eqData || !Array.isArray(eqData.gemOptions)) return;
    eqData.gemOptions.forEach((slot) => {
      if (!Array.isArray(slot)) return;
      slot.forEach((selection) => {
        if (!selection || typeof selection !== 'string') return;
        const [rawType, rawVariant] = selection.split(' - ');
        if (!rawVariant) return;
        const type = rawType.trim();
        const variant = rawVariant.trim();
        if (!type || !variant) return;

        GEM_BASE_STATS.forEach((stat) => {
          baseTotals[stat.key] += stat.perSelection;
        });

        const variantInfo = GEM_VARIANT_STATS[variant];
        if (variantInfo) {
          const key = `${type}|${variant}`;
          const entry = variantTotals.get(key) || { type, variant, count: 0 };
          entry.count += 1;
          variantTotals.set(key, entry);
        }
      });
    });
  });

  return { baseTotals, variantEntries: Array.from(variantTotals.values()) };
}

function buildCharacterStatSummary(char) {
  const { baseTotals } = collectGemStatTotals(char);
  return GEM_BASE_ATTRIBUTE_DETAILS.map((entry) => {
    const decimals = entry.decimals !== undefined ? entry.decimals : 0;
    const baseValue = entry.base;
    const extraFromGems = entry.incrementKey ? (baseTotals[entry.incrementKey] || 0) : 0;
    const extraFromExternal = getAdditionalStatBonus(entry.label);
    const extra = extraFromGems + extraFromExternal;
    const total = baseValue + extra;
    return {
      label: entry.label,
      base: baseValue,
      extra,
      total,
      decimals
    };
  });
}

function buildGemEffectLines(char) {
  const { variantEntries } = collectGemStatTotals(char);
  const lines = variantEntries.map((entry) => {
    const variantInfo = GEM_VARIANT_STATS[entry.variant];
    if (!variantInfo) {
      return `#${entry.type} ${entry.variant} ×${entry.count}`;
    }
    const totalValue = variantInfo.valuePerGem * entry.count;
    return variantInfo.formatter(entry.type, totalValue);
  });
  return lines;
}

const BONUS_SOURCE_ALIASES = {
  pets: 'pet',
  pet: 'pet',
  gems: 'gem',
  gem: 'gem',
  runes: 'rune',
  rune: 'rune',
  levelup: 'levelUpCards',
  levelupcards: 'levelUpCards',
  cards: 'levelUpCards',
  title: 'titles',
  titles: 'titles',
  others: 'other',
  other: 'other'
};

function normalizeBonusSource(source) {
  const key = (source || '').toString().trim();
  const normalized = BONUS_SOURCE_ALIASES[key] || key;
  return ADDITIONAL_BONUS_SOURCES.includes(normalized) ? normalized : 'manual';
}

function getAdditionalStatBonus(label) {
  return ADDITIONAL_BONUS_SOURCES.reduce(
    (sum, key) => sum + (Number(additionalStatBonuses[key][label]) || 0),
    0
  );
}

function getAdditionalEffectLines() {
  const lines = [];
  ADDITIONAL_BONUS_SOURCES.forEach((key) => {
    additionalEffectBonuses[key].forEach((entry) => {
      if (entry) {
        lines.push(entry);
      }
    });
  });
  return lines;
}

function setAdditionalStatBonuses(source, bonuses = {}) {
  const key = normalizeBonusSource(source);
  const sanitized = {};
  Object.entries(bonuses || {}).forEach(([label, value]) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric !== 0) {
      sanitized[label] = numeric;
    }
  });
  additionalStatBonuses[key] = sanitized;
  refreshRuneSummary();
}

function addAdditionalStatBonus(source, label, amount) {
  if (!label) return;
  const key = normalizeBonusSource(source);
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return;
  const current = Number(additionalStatBonuses[key][label]) || 0;
  const next = current + numeric;
  if (next === 0) {
    delete additionalStatBonuses[key][label];
  } else {
    additionalStatBonuses[key][label] = next;
  }
  refreshRuneSummary();
}

function setAdditionalEffectBonuses(source, effects = []) {
  const key = normalizeBonusSource(source);
  additionalEffectBonuses[key] = Array.isArray(effects)
    ? effects.filter((entry) => entry).map((entry) => entry.toString())
    : [];
  refreshRuneSummary();
}

function addAdditionalEffectBonus(source, description) {
  if (!description) return;
  const key = normalizeBonusSource(source);
  additionalEffectBonuses[key].push(description.toString());
  refreshRuneSummary();
}

function clearAdditionalBonuses(source) {
  if (source) {
    const key = normalizeBonusSource(source);
    additionalStatBonuses[key] = {};
    additionalEffectBonuses[key] = [];
  } else {
    ADDITIONAL_BONUS_SOURCES.forEach((key) => {
      additionalStatBonuses[key] = {};
      additionalEffectBonuses[key] = [];
    });
  }
  refreshRuneSummary();
}

function buildRuneSummaryText(char) {
  if (!char) return '';
  const lines = [`캐릭터: ${char.name || '이름없음'} (${char.job || '직업 미지정'})`];
  buildRuneSummaryRows(char).forEach(({ equipment, rune, bonus1, bonus2, hasBonus }) => {
    if (hasBonus) {
      lines.push(`[${equipment}] ${rune} | 보조1: ${bonus1} | 보조2: ${bonus2}`);
    } else {
      lines.push(`[${equipment}] ${rune}`);
    }
  });
  const statSummary = buildCharacterStatSummary(char);
  const impactedStats = statSummary.filter((stat) => stat.extra !== 0);
  const effectLines = [...buildGemEffectLines(char), ...getAdditionalEffectLines()];
  lines.push('', '보석 능력치 합계:');
  if (impactedStats.length === 0 && effectLines.length === 0) {
    lines.push('- 보석 옵션이 선택되지 않았습니다.');
  } else {
    impactedStats.forEach((stat) => {
      const base = formatNumber(stat.base, stat.decimals);
      const extra = formatNumber(stat.extra, stat.decimals);
      const total = formatNumber(stat.total, stat.decimals);
      lines.push(`- ${stat.label}: ${base} + ${extra} = ${total}`);
    });
    effectLines.forEach((line) => lines.push(`- ${line}`));
  }
  return lines.join('\n');
}

function resetCopyButtonLabel() {
  if (!copySummaryBtn) return;
  if (summaryCopyFeedbackTimer) {
    clearTimeout(summaryCopyFeedbackTimer);
    summaryCopyFeedbackTimer = null;
  }
  copySummaryBtn.textContent = SUMMARY_COPY_LABEL_DEFAULT;
}

function renderRuneSummary() {
  if (!runeSummaryContent) return;
  const char = getCurrentEditingChar();
  runeSummaryContent.innerHTML = '';
  if (openSummaryBtn) {
    openSummaryBtn.disabled = !char;
  }
  if (gemSummaryList) {
    gemSummaryList.innerHTML = '';
  }

  if (!char) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'rune-summary-empty';
    emptyMessage.textContent = '캐릭터를 선택하면 룬 요약이 표시됩니다.';
    runeSummaryContent.appendChild(emptyMessage);
    if (copySummaryBtn) {
      copySummaryBtn.disabled = true;
      resetCopyButtonLabel();
    }
    if (gemSummaryList) {
      const li = document.createElement('li');
      li.className = 'rune-summary-empty';
      li.textContent = '보석 옵션이 선택되지 않았습니다.';
      gemSummaryList.appendChild(li);
    }
    return;
  }

  const rows = buildRuneSummaryRows(char);
  if (!rows.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'rune-summary-empty';
    emptyMessage.textContent = '선택된 룬이 없습니다.';
    runeSummaryContent.appendChild(emptyMessage);
  } else {
    const table = document.createElement('table');
    table.className = 'rune-summary-table';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>장비</th><th>룬</th><th>보조 1</th><th>보조 2</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(({ equipment, rune, grade, bonus1, bonus2, hasBonus }) => {
      const tr = document.createElement('tr');
      const displayRune = grade && rune !== '없음' ? `${rune} (${grade})` : rune;
      [equipment, displayRune, hasBonus ? bonus1 : '—', hasBonus ? bonus2 : '—'].forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    runeSummaryContent.appendChild(table);
  }

  if (copySummaryBtn) {
    copySummaryBtn.disabled = false;
    resetCopyButtonLabel();
  }

  if (gemSummaryList) {
    const statSummary = buildCharacterStatSummary(char);
    const effectLines = [...buildGemEffectLines(char), ...getAdditionalEffectLines()];
    const impactedStats = statSummary.filter((stat) => stat.extra !== 0);
    if (impactedStats.length === 0 && effectLines.length === 0) {
      const li = document.createElement('li');
      li.className = 'rune-summary-empty';
      li.textContent = '보석 옵션이 선택되지 않았습니다.';
      gemSummaryList.appendChild(li);
    } else {
      impactedStats.forEach((stat) => {
        const li = document.createElement('li');
        const base = formatNumber(stat.base, stat.decimals);
        const extra = formatNumber(stat.extra, stat.decimals);
        const total = formatNumber(stat.total, stat.decimals);
        li.textContent = `${stat.label}: ${base} + ${extra} = ${total}`;
        gemSummaryList.appendChild(li);
      });
      effectLines.forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        gemSummaryList.appendChild(li);
      });
    }
  }
}

function refreshRuneSummary() {
  renderRuneSummary();
}

function registerStatCalculatorAPI() {
  if (typeof window === 'undefined') return;
  window.statCalculator = {
    setStatBonuses: setAdditionalStatBonuses,
    addStatBonus: addAdditionalStatBonus,
    setEffectBonuses: setAdditionalEffectBonuses,
    addEffectBonus: addAdditionalEffectBonus,
    clearBonuses: clearAdditionalBonuses,
    refresh: refreshRuneSummary
  };
}

async function copyRuneSummaryToClipboard() {
  const char = getCurrentEditingChar();
  if (!char || !copySummaryBtn || copySummaryBtn.disabled) return;
  const summaryText = buildRuneSummaryText(char);
  if (!summaryText.trim()) {
    showCopyFeedback(SUMMARY_COPY_LABEL_ERROR, true);
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(summaryText);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = summaryText;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showCopyFeedback(SUMMARY_COPY_LABEL_SUCCESS, false);
  } catch (error) {
    console.warn('룬 요약 복사 실패:', error);
    showCopyFeedback(SUMMARY_COPY_LABEL_ERROR, true);
  }
}

function showCopyFeedback(label, isError) {
  if (!copySummaryBtn) return;
  if (summaryCopyFeedbackTimer) {
    clearTimeout(summaryCopyFeedbackTimer);
  }
  copySummaryBtn.textContent = label;
  summaryCopyFeedbackTimer = setTimeout(() => {
    resetCopyButtonLabel();
  }, isError ? 2500 : 1500);
}

function isSummaryModalOpen() {
  return runeSummaryModal && !runeSummaryModal.classList.contains('hidden');
}

function openSummaryModal() {
  renderRuneSummary();
  if (!runeSummaryModal) return;
  resetCopyButtonLabel();
  runeSummaryModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeSummaryModal() {
  if (!runeSummaryModal || !isSummaryModalOpen()) return;
  runeSummaryModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  resetCopyButtonLabel();
}

function handleSummaryKeydown(event) {
  if (event.key === 'Escape' && isSummaryModalOpen()) {
    event.preventDefault();
    closeSummaryModal();
  }
}

function handleStatsCalcOpen() {
  const index = getSelectedCharIndex();
  if (index !== null && index !== undefined) {
    const characters = getCharacters();
    const char = characters[index];
    if (char) {
      char.name = charNameInput.value.trim() || '이름없음';
      char.job = charJobSelect.value;

      const gradeDraft = getRuneGradeDraft();

      equipmentTypes.forEach((eq) => {
        const eqData = char.equipment[eq.key];
        for (let slotIndex = 0; slotIndex < eq.gemSlots; slotIndex++) {
          for (let optIndex = 0; optIndex < 3; optIndex++) {
            const control = document.querySelector(
              `[data-gem-input="true"][data-equip-key="${eq.key}"][data-slot-index="${slotIndex}"][data-opt-index="${optIndex}"]`
            );
            if (control) {
              eqData.gemOptions[slotIndex][optIndex] = control.value.trim();
            }
          }
        }
        if (!EQUIP_KEYS_WITH_RUNE_BONUS[eq.key]) {
          eqData.runeOptions = [];
        } else {
          if (!Array.isArray(eqData.runeOptions)) {
            eqData.runeOptions = ['', ''];
          }
          for (let bonusIndex = 0; bonusIndex < 2; bonusIndex++) {
            const bonusControl = document.querySelector(
              `[data-rune-bonus-input="true"][data-equip-key="${eq.key}"][data-bonus-index="${bonusIndex}"]`
            );
            if (bonusControl) {
              eqData.runeOptions[bonusIndex] = bonusControl.value.trim();
            } else if (!eqData.runeOptions[bonusIndex]) {
              eqData.runeOptions[bonusIndex] = '';
            }
          }
        }
        const draft = getRuneSelectionDraft();
        eqData.rune = draft[eq.key] || '없음';
        const grade = gradeDraft[eq.key] || null;
        eqData.runeGrade = eqData.rune === '없음' ? null : grade;
      });

      // 캐릭터 데이터를 LocalStorage에 자동 저장
      saveCharactersToStorage();

      // 편집 중이던 캐릭터 인덱스를 SessionStorage에 저장
      try {
        sessionStorage.setItem('editingCharacterIndex', index.toString());
      } catch (error) {
        console.warn('SessionStorage 저장 실패:', error);
      }
    }
  }

  window.location.href = 'stats.html';
}

function init() {
  jobs.forEach((job) => {
    const option = document.createElement('option');
    option.value = job;
    option.textContent = job;
    charJobSelect.appendChild(option);
  });

  addCharacterBtn.addEventListener('click', createNewCharacter);
  saveCharacterBtn.addEventListener('click', saveCurrentCharacter);
  cancelEditBtn.addEventListener('click', hideEditor);
  deleteCharacterBtn.addEventListener('click', deleteCurrentCharacter);
  charJobSelect.addEventListener('change', handleJobChange);
  toggleGemOptionsCheckbox.checked = getShowGemOptions();
  toggleGemOptionsCheckbox.addEventListener('change', handleGemToggle);
  exportBtn.addEventListener('click', exportSettings);
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', importSettings);
  if (backToEquipmentBtn) {
    backToEquipmentBtn.addEventListener('click', () => {
      const target =
        equipmentSection.querySelector('.equipment-item.selected') ||
        equipmentSection.querySelector('.equipment-item');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      storeTheme(nextTheme);
    });
  }
  if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', copyRuneSummaryToClipboard);
    copySummaryBtn.disabled = true;
    resetCopyButtonLabel();
  }
  if (openSummaryBtn) {
    openSummaryBtn.addEventListener('click', openSummaryModal);
    openSummaryBtn.disabled = true;
  }
  if (summaryCloseButtons.length > 0) {
    summaryCloseButtons.forEach((btn) =>
      btn.addEventListener('click', () => closeSummaryModal())
    );
  }
  document.addEventListener('keydown', handleSummaryKeydown);
  if (openStatsCalcBtn) {
    openStatsCalcBtn.addEventListener('click', handleStatsCalcOpen);
  }

  // 즐겨찾기 필터 체크박스
  if (toggleFavoritesOnlyCheckbox) {
    toggleFavoritesOnlyCheckbox.addEventListener('change', (event) => {
      showFavoritesOnly = event.target.checked;
      const currentKey = getActiveEquipKey();
      if (currentKey) {
        renderRuneInfoForEquipment(currentKey);
      }
    });
  }

  // 즐겨찾기 데이터 로드
  favoriteRunes = loadFavoriteRunes();

  resetActiveWeaponRuneSeason();
  resetActiveArmorRuneSeason();
  resetActiveEmblemRuneSeason();

  // LocalStorage에서 캐릭터 데이터 복원
  const savedData = loadCharactersFromStorage();
  if (savedData && savedData.characters && savedData.characters.length > 0) {
    // 저장된 캐릭터 데이터로 복원
    while (getCharacters().length > 0) {
      removeCharacter(0);
    }
    savedData.characters.forEach((char) => {
      const validChar = validateCharacterData(char);
      if (validChar) {
        addCharacter(validChar);
      }
    });
    if (savedData.showGemOptions !== undefined) {
      setShowGemOptions(savedData.showGemOptions);
      toggleGemOptionsCheckbox.checked = savedData.showGemOptions;
    }
  }

  renderCharacterList();
  refreshRuneSummary();

  // 능력치 계산기에서 돌아온 경우 이전 편집 상태 복원
  try {
    const editingIndex = sessionStorage.getItem('editingCharacterIndex');
    if (editingIndex !== null) {
      const index = parseInt(editingIndex, 10);
      if (!isNaN(index) && index >= 0 && index < getCharacters().length) {
        // SessionStorage에서 편집 인덱스 삭제
        sessionStorage.removeItem('editingCharacterIndex');
        // 편집 모드로 재진입
        setTimeout(() => {
          openCharacterEditor(index);
        }, 100);
      }
    }
  } catch (error) {
    console.warn('SessionStorage 복원 실패:', error);
  }
}

function createNewCharacter() {
  const newChar = {
    name: '',
    job: jobs[0],
    equipment: {}
  };

  equipmentTypes.forEach((eq) => {
    const gemOptions = Array.from({ length: eq.gemSlots }, () => ['', '', '']);
    const bonusConfig = EQUIP_KEYS_WITH_RUNE_BONUS[eq.key];
    newChar.equipment[eq.key] = {
      gemOptions,
      rune: '없음',
      runeOptions: bonusConfig ? ['', ''] : [],
      runeGrade: null
    };
  });

  addCharacter(newChar);
  const newIndex = getCharacters().length - 1;
  setSelectedCharIndex(newIndex);
  openCharacterEditor(newIndex);
}

function renderCharacterList() {
  const characters = getCharacters();
  characterListEl.innerHTML = '';
  if (characters.length === 0) {
    characterListEl.textContent = '캐릭터가 없습니다. “캐릭터 추가”를 눌러 새로 생성하세요.';
    return;
  }

  characters.forEach((char, index) => {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.innerHTML = `<strong>${char.name || '이름없음'}</strong><br/>${char.job}`;

    const gemSummary = buildGemOptionSummary(char);
    if (gemSummary.length > 0) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = '보석 옵션';
      details.appendChild(summary);
      const list = document.createElement('ul');
      gemSummary.forEach(({ label, options }) => {
        const li = document.createElement('li');
        li.textContent = `${label}: ${options.join(', ')}`;
        list.appendChild(li);
      });
      details.appendChild(list);
      card.appendChild(details);
    }

    card.addEventListener('click', () => {
      setSelectedCharIndex(index);
      openCharacterEditor(index);
    });
    characterListEl.appendChild(card);
  });
}

function buildGemOptionSummary(char) {
  const summaries = [];
  equipmentTypes.forEach((eq) => {
    let eqData = char.equipment[eq.key];
    if (!eqData) {
      eqData = {
        gemOptions: Array.from({ length: eq.gemSlots }, () => ['', '', '']),
        rune: '없음',
        runeOptions: ['', ''],
        runeGrade: null
      };
      char.equipment[eq.key] = eqData;
    }
    const options = [];
    eqData.gemOptions.forEach((slot) => {
      slot.forEach((opt) => {
        if (opt) options.push(opt);
      });
    });
    if (options.length > 0) {
      summaries.push({ label: eq.name, options });
    }
  });
  return summaries;
}

function resetRunePanel() {
  if (runeListEl) {
    runeListEl.innerHTML = '';
  }
  if (runeInfoMessage) {
    runeInfoMessage.textContent = DEFAULT_RUNE_MESSAGE;
  }
}

function changeWeaponRuneSeason(season) {
  if (!weaponSeasons.includes(season)) return;
  if (getActiveWeaponRuneSeason() === season) return;
  setActiveWeaponRuneSeason(season);
  if (getActiveEquipKey() === 'weapon') {
    renderRuneInfoForEquipment('weapon');
  }
}

function changeArmorRuneSeason(season) {
  if (!armorSeasons.includes(season)) return;
  if (getActiveArmorRuneSeason() === season) return;
  setActiveArmorRuneSeason(season);
  const key = getActiveEquipKey();
  if (key && key !== 'weapon' && key !== 'emblem') {
    renderRuneInfoForEquipment(key);
  }
}

function changeEmblemRuneSeason(season) {
  if (!emblemSeasons.includes(season)) return;
  if (getActiveEmblemRuneSeason() === season) return;
  setActiveEmblemRuneSeason(season);
  if (getActiveEquipKey() === 'emblem') {
    renderRuneInfoForEquipment('emblem');
  }
}

function setActiveEquipment(equipKey) {
  const currentChar = getCurrentEditingChar();
  if (!currentChar || !equipKey) {
    setActiveEquipKey(null);
    resetRunePanel();
    return;
  }
  setActiveEquipKey(equipKey);
  const currentKey = getActiveEquipKey();
  equipmentSection
    .querySelectorAll('.equipment-item')
    .forEach((item) => item.classList.toggle('selected', item.dataset.equipKey === currentKey));
  renderRuneInfoForEquipment(currentKey);

  if (window.matchMedia('(max-width: 900px)').matches && runeInfoPanel) {
    runeInfoPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderRuneInfoForEquipment(equipKey) {
  const currentChar = getCurrentEditingChar();
  if (!currentChar || !runeListEl || !runeInfoMessage || !equipKey) return;

  runeListEl.innerHTML = '';
  const equipmentMeta = equipmentTypes.find((eq) => eq.key === equipKey);
  const jobName = charJobSelect.value;
  const isAccessory = equipKey === 'necklace' || equipKey.startsWith('ring');
  const runeDraft = getRuneSelectionDraft();

  if (equipmentMeta) {
    runeInfoMessage.textContent = `${equipmentMeta.name}에 장착할 룬을 선택하세요.`;
  }

  const runeGradeDraft = getRuneGradeDraft();

  const createOptionRow = (rune, defaultRarities = []) => {
    const availableRarities = getAvailableRaritiesForRune(rune, defaultRarities);
    const row = document.createElement('div');
    row.className = 'rune-option';
    const selectedName = runeDraft[equipKey] || '없음';
    const isActive = rune.name === selectedName;
    if (isActive) {
      row.classList.add('active');
    }

    const nameCell = document.createElement('div');
    nameCell.className = 'rune-option-name';

    // 즐겨찾기 버튼 추가
    const favoriteBtn = document.createElement('button');
    favoriteBtn.type = 'button';
    favoriteBtn.className = 'rune-favorite-btn';
    const isFavorite = favoriteRunes.has(rune.name);
    favoriteBtn.textContent = isFavorite ? '★' : '☆';
    favoriteBtn.title = isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가';
    if (isFavorite) {
      favoriteBtn.classList.add('active');
    }
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavoriteRune(rune.name);
      renderRuneInfoForEquipment(equipKey);
    });

    nameCell.appendChild(favoriteBtn);

    const nameText = document.createElement('span');
    nameText.textContent = rune.name;
    nameCell.appendChild(nameText);

    row.appendChild(nameCell);

    const descCell = document.createElement('div');
    descCell.className = 'rune-option-desc';
    descCell.textContent = rune.description || '-';
    row.appendChild(descCell);

    const gradeCell = document.createElement('div');
    gradeCell.className = 'rune-option-grade';
    const currentChar = getCurrentEditingChar();
    const eqData = currentChar?.equipment?.[equipKey];
    const activeGrade = runeGradeDraft[equipKey] || (eqData?.rune === rune.name ? eqData.runeGrade : null) || null;

    if (availableRarities.length <= 1) {
      const displayGrade = availableRarities.length === 1 ? availableRarities[0] : null;
      if (!displayGrade) {
        gradeCell.textContent = '-';
      } else {
        const badgeRow = document.createElement('div');
        badgeRow.className = 'grade-row';
        const badge = document.createElement('span');
        badge.className = 'rune-grade-badge';
        const classKey = resolveRarityClass(displayGrade);
        if (classKey) {
          badge.classList.add(`rune-grade-${classKey}`);
        }
        badge.textContent = displayGrade;
        badgeRow.appendChild(badge);
        gradeCell.appendChild(badgeRow);
      }
    } else {
      const select = document.createElement('select');
      select.className = 'rune-grade-select';
      availableRarities.forEach((label) => {
        const normalized = normalizeRarityLabel(label);
        if (!normalized) return;
        const option = document.createElement('option');
        option.value = normalized;
        option.textContent = normalized;
        select.appendChild(option);
      });
      const defaultGrade = determineInitialGrade(equipKey, availableRarities, rune.name);
      const valueToUse = isActive
        ? (activeGrade && availableRarities.includes(activeGrade) ? activeGrade : defaultGrade)
        : availableRarities[0];
      if (valueToUse) {
        select.value = valueToUse;
      }
      select.disabled = !isActive;
      select.addEventListener('click', (event) => event.stopPropagation());
      select.addEventListener('change', (event) => {
        event.stopPropagation();
        handleRuneGradeChange(equipKey, event.target.value || null);
      });
      gradeCell.appendChild(select);
    }
    row.appendChild(gradeCell);

    row.addEventListener('click', () => selectRuneForEquipment(equipKey, rune, availableRarities));
    return row;
  };

  const createHeaderRow = () => {
    const header = document.createElement('div');
    header.className = 'rune-option rune-option-header';
    const nameHeader = document.createElement('div');
    nameHeader.className = 'rune-option-name';
    nameHeader.textContent = '이름';
    header.appendChild(nameHeader);
    const descHeader = document.createElement('div');
    descHeader.className = 'rune-option-desc';
    descHeader.textContent = '설명';
    header.appendChild(descHeader);
    const gradeHeader = document.createElement('div');
    gradeHeader.className = 'rune-option-grade';
    gradeHeader.textContent = '등급';
    header.appendChild(gradeHeader);
    return header;
  };

  const createSearchInput = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'rune-search-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '룬 이름/설명 검색';
    input.className = 'rune-search-input';
    wrapper.appendChild(input);
    return { wrapper, input };
  };

  if (equipKey === 'weapon') {
    if (!weaponSeasons.length) {
      runeInfoMessage.textContent = '등록된 무기 룬이 없습니다.';
      return;
    }
    let activeSeason = getActiveWeaponRuneSeason();
    if (!activeSeason || !weaponSeasons.includes(activeSeason)) {
      activeSeason = weaponSeasons[0];
      setActiveWeaponRuneSeason(activeSeason);
    }
    if (weaponSeasons.length > 1) {
      const tabs = document.createElement('div');
      tabs.className = 'rune-tabs';
      weaponSeasons.forEach((season) => {
        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.className = 'rune-tab';
        if (season === activeSeason) {
          tabBtn.classList.add('active');
        }
        tabBtn.textContent = season;
        tabBtn.addEventListener('click', () => changeWeaponRuneSeason(season));
        tabs.appendChild(tabBtn);
      });
      runeListEl.appendChild(tabs);
    }

    const { wrapper: searchWrapper, input: searchInput } = createSearchInput();
    runeListEl.appendChild(searchWrapper);

    const baseGroup = document.createElement('div');
    baseGroup.className = 'rune-group rune-group-basic';
    baseGroup.appendChild(createHeaderRow());
    baseGroup.appendChild(createOptionRow(baseRunes[0]));
    runeListEl.appendChild(baseGroup);

    const groupedContainer = document.createElement('div');
    groupedContainer.className = 'rune-groups-container';
    runeListEl.appendChild(groupedContainer);

    const activeSeasonGroups = weaponRuneGroups.filter(
      (group) => group.season === getActiveWeaponRuneSeason()
    );

    const baseRuneName = (baseRunes[0]?.name || '').toLowerCase();
    const baseRuneDesc = (baseRunes[0]?.description || '').toLowerCase();

    const renderGroups = (keyword = '') => {
      const lower = keyword.toLowerCase();
      const showBase = !lower || baseRuneName.includes(lower) || baseRuneDesc.includes(lower);
      const baseIsFavorite = favoriteRunes.has(baseRunes[0]?.name || '');

      // 즐겨찾기 필터 적용
      if (showFavoritesOnly && !baseIsFavorite) {
        baseGroup.style.display = 'none';
      } else {
        baseGroup.style.display = showBase ? '' : 'none';
      }

      groupedContainer.innerHTML = '';
      activeSeasonGroups.forEach((group) => {
        const filteredRunes = group.runes.filter((rune) => {
          const nameMatch = rune.name.toLowerCase().includes(lower);
          const descMatch = (rune.description || '').toLowerCase().includes(lower);
          const keywordMatch = lower.length === 0 ? true : nameMatch || descMatch;

          // 즐겨찾기 필터 적용
          if (showFavoritesOnly && !favoriteRunes.has(rune.name)) {
            return false;
          }

          return keywordMatch;
        });
        if (!filteredRunes.length) return;
        const groupContainer = document.createElement('div');
        groupContainer.className = 'rune-group';
        const heading = document.createElement('h4');
        heading.textContent = `${group.season} ${group.rarity}`;
        groupContainer.appendChild(heading);
        groupContainer.appendChild(createHeaderRow());
        const defaultRarities = group.rarity ? [group.rarity] : [];
        filteredRunes.forEach((rune) =>
          groupContainer.appendChild(createOptionRow(rune, defaultRarities))
        );
        groupedContainer.appendChild(groupContainer);
      });

      if (!groupedContainer.childElementCount && baseGroup.style.display === 'none') {
        const empty = document.createElement('div');
        empty.className = 'rune-search-empty';
        empty.textContent = '검색 결과가 없습니다.';
        groupedContainer.appendChild(empty);
      }
    };

    searchInput.addEventListener('input', (event) => renderGroups(event.target.value.trim()));
    renderGroups('');
    return;
  }

  if (!isAccessory) {
    const isEmblem = equipKey === 'emblem';
    const runeGroups = isEmblem ? emblemRuneGroups : armorRuneGroups;
    const seasons = isEmblem ? emblemSeasons : armorSeasons;
    const getSeason = isEmblem ? getActiveEmblemRuneSeason : getActiveArmorRuneSeason;
    const setSeason = isEmblem ? setActiveEmblemRuneSeason : setActiveArmorRuneSeason;
    const changeSeason = isEmblem ? changeEmblemRuneSeason : changeArmorRuneSeason;
    if (!runeGroups.length) {
      runeInfoMessage.textContent = '등록된 룬이 없습니다.';
      return;
    }
    let activeSeason = getSeason();
    if (!activeSeason || !seasons.includes(activeSeason)) {
      activeSeason = seasons[0];
      setSeason(activeSeason);
    }
    if (seasons.length > 1) {
      const tabs = document.createElement('div');
      tabs.className = 'rune-tabs';
      seasons.forEach((season) => {
        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.className = 'rune-tab';
        if (season === activeSeason) {
          tabBtn.classList.add('active');
        }
        tabBtn.textContent = season;
        tabBtn.addEventListener('click', () => changeSeason(season));
        tabs.appendChild(tabBtn);
      });
      runeListEl.appendChild(tabs);
    }

    // 검색창 추가
    const { wrapper: searchWrapper, input: searchInput } = createSearchInput();
    runeListEl.appendChild(searchWrapper);

    const baseGroup = document.createElement('div');
    baseGroup.className = 'rune-group rune-group-basic';
    baseGroup.appendChild(createHeaderRow());
    baseGroup.appendChild(createOptionRow(baseRunes[0]));
    runeListEl.appendChild(baseGroup);

    const groupedContainer = document.createElement('div');
    groupedContainer.className = 'rune-groups-container';
    runeListEl.appendChild(groupedContainer);

    const activeSeasonGroups = runeGroups.filter((group) => group.season === getSeason());

    const baseRuneName = (baseRunes[0]?.name || '').toLowerCase();
    const baseRuneDesc = (baseRunes[0]?.description || '').toLowerCase();

    const renderGroups = (keyword = '') => {
      const lower = keyword.toLowerCase();
      const showBase = !lower || baseRuneName.includes(lower) || baseRuneDesc.includes(lower);
      const baseIsFavorite = favoriteRunes.has(baseRunes[0]?.name || '');

      // 즐겨찾기 필터 적용
      if (showFavoritesOnly && !baseIsFavorite) {
        baseGroup.style.display = 'none';
      } else {
        baseGroup.style.display = showBase ? '' : 'none';
      }

      groupedContainer.innerHTML = '';
      activeSeasonGroups.forEach((group) => {
        const filteredRunes = group.runes.filter((rune) => {
          const nameMatch = rune.name.toLowerCase().includes(lower);
          const descMatch = (rune.description || '').toLowerCase().includes(lower);
          const keywordMatch = lower.length === 0 ? true : nameMatch || descMatch;

          // 즐겨찾기 필터 적용
          if (showFavoritesOnly && !favoriteRunes.has(rune.name)) {
            return false;
          }

          return keywordMatch;
        });
        if (!filteredRunes.length) return;
        const groupContainer = document.createElement('div');
        groupContainer.className = 'rune-group';
        const heading = document.createElement('h4');
        heading.textContent = `${group.season} ${group.rarity}`;
        groupContainer.appendChild(heading);
        groupContainer.appendChild(createHeaderRow());
        const defaultRarities = group.rarity ? [group.rarity] : [];
        filteredRunes.forEach((rune) =>
          groupContainer.appendChild(createOptionRow(rune, defaultRarities))
        );
        groupedContainer.appendChild(groupContainer);
      });

      if (!groupedContainer.childElementCount && baseGroup.style.display === 'none') {
        const empty = document.createElement('div');
        empty.className = 'rune-search-empty';
        empty.textContent = '검색 결과가 없습니다.';
        groupedContainer.appendChild(empty);
      }
    };

    searchInput.addEventListener('input', (event) => renderGroups(event.target.value.trim()));
    renderGroups('');
    return;
  }

  const runePool = getAllowedRunesForJob(jobName);
  if (!runePool.length) {
    runeInfoMessage.textContent = '사용 가능한 룬이 없습니다.';
    return;
  }
  const { wrapper: searchWrapper, input: searchInput } = createSearchInput();
  runeListEl.appendChild(searchWrapper);
  runeListEl.appendChild(createHeaderRow());
  const runeOptionsContainer = document.createElement('div');
  runeOptionsContainer.className = 'rune-options-container';
  runeListEl.appendChild(runeOptionsContainer);

  const renderOptions = (keyword = '') => {
    const lower = keyword.toLowerCase();
    runeOptionsContainer.innerHTML = '';
    const filtered = runePool.filter((rune) => {
      if (!lower) {
        // 즐겨찾기 필터만 적용
        if (showFavoritesOnly && !favoriteRunes.has(rune.name)) {
          return false;
        }
        return true;
      }
      const nameMatch = rune.name.toLowerCase().includes(lower);
      const descMatch = (rune.description || '').toLowerCase().includes(lower);
      const keywordMatch = nameMatch || descMatch;

      // 즐겨찾기 필터 적용
      if (showFavoritesOnly && !favoriteRunes.has(rune.name)) {
        return false;
      }

      return keywordMatch;
    });
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'rune-search-empty';
      empty.textContent = '검색 결과가 없습니다.';
      runeOptionsContainer.appendChild(empty);
      return;
    }
    filtered.forEach((rune) => runeOptionsContainer.appendChild(createOptionRow(rune)));
  };

  searchInput.addEventListener('input', (event) => renderOptions(event.target.value.trim()));

  renderOptions('');
}

function getAvailableRaritiesForRune(rune, fallback = []) {
  if (rune && Array.isArray(rune.rarities) && rune.rarities.length) {
    return rune.rarities.map((label) => normalizeRarityLabel(label)).filter(Boolean);
  }
  if (rune && rune.rarity) {
    const normalized = normalizeRarityLabel(rune.rarity);
    return normalized ? [normalized] : [];
  }
  return fallback || [];
}

function determineInitialGrade(equipKey, availableRarities = [], runeName = '') {
  if (!availableRarities || availableRarities.length === 0) {
    return null;
  }
  const draft = getRuneGradeDraft()[equipKey];
  if (draft && availableRarities.includes(draft)) {
    return draft;
  }
  const currentChar = getCurrentEditingChar();
  const eqData = currentChar?.equipment?.[equipKey];
  if (eqData && eqData.rune === runeName && eqData.runeGrade && availableRarities.includes(eqData.runeGrade)) {
    return eqData.runeGrade;
  }
  return availableRarities[0];
}

function updateRuneGradeDraftValue(equipKey, grade) {
  const draft = { ...getRuneGradeDraft() };
  if (grade) {
    draft[equipKey] = grade;
  } else {
    delete draft[equipKey];
  }
  setRuneGradeDraft(draft);
}

function applyRuneSelection(equipKey, runeName, grade = null) {
  const selectionDraft = { ...getRuneSelectionDraft(), [equipKey]: runeName };
  setRuneSelectionDraft(selectionDraft);

  const currentChar = getCurrentEditingChar();
  if (currentChar && currentChar.equipment && currentChar.equipment[equipKey]) {
    currentChar.equipment[equipKey].rune = runeName;
    currentChar.equipment[equipKey].runeGrade = grade || null;
    if (runeName === '없음' && EQUIP_KEYS_WITH_RUNE_BONUS[equipKey]) {
      currentChar.equipment[equipKey].runeOptions = EQUIP_KEYS_WITH_RUNE_BONUS[equipKey] ? ['', ''] : [];
    }
  }

  updateRuneGradeDraftValue(equipKey, grade);
  updateRuneDisplay(equipKey, runeName);
  refreshRuneSummary();
}

function handleRuneGradeChange(equipKey, grade) {
  const normalized = grade || null;
  const currentChar = getCurrentEditingChar();
  if (currentChar && currentChar.equipment && currentChar.equipment[equipKey]) {
    currentChar.equipment[equipKey].runeGrade = normalized;
  }
  updateRuneGradeDraftValue(equipKey, normalized);
  const runeDraft = getRuneSelectionDraft();
  const runeName = runeDraft[equipKey] || '없음';
  updateRuneDisplay(equipKey, runeName);
  refreshRuneSummary();
}

function selectRuneForEquipment(equipKey, rune, fallbackRarities = []) {
  const runeName = rune?.name || '없음';
  let grade = null;
  if (runeName !== '없음') {
    const available = getAvailableRaritiesForRune(rune, fallbackRarities);
    grade = determineInitialGrade(equipKey, available, runeName);
  }
  applyRuneSelection(equipKey, runeName, grade);
  renderRuneInfoForEquipment(equipKey);
}

function updateRuneDisplay(equipKey, runeName = '없음') {
  const label = equipmentSection.querySelector(
    `.rune-display[data-equip-key="${equipKey}"] span`
  );
  const currentChar = getCurrentEditingChar();
  const eqData = currentChar?.equipment?.[equipKey];
  const grade = eqData?.runeGrade;
  if (label) {
    const displayName = grade && runeName !== '없음' ? `${runeName} (${grade})` : runeName;
    label.textContent = displayName;
  }
  const bonusControls = equipmentSection.querySelectorAll(
    `.rune-bonus-select[data-equip-key="${equipKey}"]`
  );
  bonusControls.forEach((select) => {
    select.disabled = runeName === '없음';
    if (runeName === '없음') {
      select.value = '';
    }
  });
}

function applyGemVisibility(show = getShowGemOptions()) {
  const rows = equipmentSection.querySelectorAll('.gem-option-row');
  rows.forEach((row) => row.classList.toggle('hidden', !show));
}

function updateAccessoryRuneOptions(jobName) {
  const currentChar = getCurrentEditingChar();
  if (!currentChar) {
    resetRunePanel();
    return;
  }
  const allowedNames = getAllowedRunesForJob(jobName).map((r) => r.name);
  const draft = { ...getRuneSelectionDraft() };
  const gradeDraft = { ...getRuneGradeDraft() };
  equipmentTypes.forEach((eq) => {
    const isAccessory = eq.key === 'necklace' || eq.key.startsWith('ring');
    if (!isAccessory) return;
    if (!allowedNames.includes(draft[eq.key])) {
      draft[eq.key] = '없음';
      if (currentChar.equipment[eq.key]) {
        currentChar.equipment[eq.key].runeOptions = EQUIP_KEYS_WITH_RUNE_BONUS[eq.key]
          ? ['', '']
          : [];
        currentChar.equipment[eq.key].runeGrade = null;
      }
      delete gradeDraft[eq.key];
      updateRuneDisplay(eq.key, '없음');
    }
  });
  setRuneSelectionDraft(draft);
  setRuneGradeDraft(gradeDraft);

  const currentKey = getActiveEquipKey();
  if (currentKey) {
    renderRuneInfoForEquipment(currentKey);
  }
  refreshRuneSummary();
}

function handleJobChange() {
  const currentChar = getCurrentEditingChar();
  if (!currentChar) return;
  currentChar.job = charJobSelect.value;
  updateAccessoryRuneOptions(currentChar.job);
  refreshRuneSummary();
}

function handleGemToggle(event) {
  const show = event.target.checked;
  setShowGemOptions(show);
  applyGemVisibility(show);
}

function openCharacterEditor(index) {
  const characters = getCharacters();
  const char = characters[index];
  if (!char) return;

  setSelectedCharIndex(index);
  setCurrentEditingChar(char);
  resetRunePanel();
  setActiveEquipKey(null);
  resetRuneSelectionDraft();
  resetRuneGradeDraft();
  resetActiveWeaponRuneSeason();
  resetActiveArmorRuneSeason();
  resetActiveEmblemRuneSeason();

  charNameInput.value = char.name;
  charJobSelect.value = char.job;
  toggleGemOptionsCheckbox.checked = getShowGemOptions();
  equipmentSection.innerHTML = '';

  const draft = {};
  const gradeDraft = {};
  equipmentTypes.forEach((eq) => {
    const eqData = char.equipment[eq.key];
    if (!eqData) return;
    if (typeof eqData.rune === 'undefined') {
      eqData.rune = '없음';
    }
    if (typeof eqData.runeGrade === 'undefined') {
      eqData.runeGrade = null;
    }
    if (!Array.isArray(eqData.gemOptions)) {
      eqData.gemOptions = Array.from({ length: eq.gemSlots }, () => ['', '', '']);
    } else {
      eqData.gemOptions = eqData.gemOptions.slice(0, eq.gemSlots).map((slot) => {
        if (!Array.isArray(slot)) {
          return ['', '', ''];
        }
        const normalized = [...slot.slice(0, 3).map((opt) => opt || '')];
        while (normalized.length < 3) {
          normalized.push('');
        }
        return normalized;
      });
      while (eqData.gemOptions.length < eq.gemSlots) {
        eqData.gemOptions.push(['', '', '']);
      }
    }

    const bonusConfig = EQUIP_KEYS_WITH_RUNE_BONUS[eq.key] || null;
    if (bonusConfig) {
      if (!Array.isArray(eqData.runeOptions)) {
        eqData.runeOptions = ['', ''];
      } else {
        eqData.runeOptions = eqData.runeOptions.slice(0, 2).map((opt) => opt || '');
        while (eqData.runeOptions.length < 2) {
          eqData.runeOptions.push('');
        }
      }
    } else {
      eqData.runeOptions = [];
    }

    const eqDiv = document.createElement('div');
    eqDiv.className = 'equipment-item';
    eqDiv.dataset.equipKey = eq.key;

    const header = document.createElement('div');
    header.className = 'equipment-header';
    header.textContent = eq.name;
    eqDiv.appendChild(header);

    for (let slotIndex = 0; slotIndex < eq.gemSlots; slotIndex++) {
      const gemRow = document.createElement('div');
      gemRow.className = 'gem-row gem-option-row';
      const label = document.createElement('label');
      label.textContent = `보석 ${slotIndex + 1}`;
      gemRow.appendChild(label);
      for (let optIndex = 0; optIndex < 3; optIndex++) {
        const storedValue = eqData.gemOptions[slotIndex][optIndex] || '';
        const select = createGemOptionSelect(eq.key, slotIndex, optIndex, storedValue);
        select.addEventListener('focus', () => setActiveEquipment(eq.key));
        select.addEventListener('change', () => setActiveEquipment(eq.key));
        gemRow.appendChild(select);
      }
      eqDiv.appendChild(gemRow);
    }

    const runeDisplay = document.createElement('div');
    runeDisplay.className = 'rune-display';
    runeDisplay.dataset.equipKey = eq.key;
    const storedRune = eqData.rune || '없음';
    const displayRune = eqData.runeGrade && storedRune !== '없음'
      ? `${storedRune} (${eqData.runeGrade})`
      : storedRune;
    runeDisplay.innerHTML = `현재 룬: <span>${displayRune}</span>`;
    eqDiv.appendChild(runeDisplay);

    if (bonusConfig) {
      const runeBonusRow = document.createElement('div');
      runeBonusRow.className = 'rune-bonus-row';

      const bonusLabel = document.createElement('span');
      bonusLabel.className = 'rune-bonus-label';
      bonusLabel.textContent = '보조 옵션';
      runeBonusRow.appendChild(bonusLabel);

      eqData.runeOptions.forEach((value, bonusIndex) => {
        const bonusSelect = createRuneBonusSelect(eq.key, bonusIndex, bonusConfig, value || '');
        if (!bonusSelect) return;
        bonusSelect.disabled = storedRune === '없음';
        bonusSelect.addEventListener('focus', () => setActiveEquipment(eq.key));
        bonusSelect.addEventListener('change', (event) => {
          const current = getCurrentEditingChar();
          if (!current) return;
          const targetEq = current.equipment[eq.key];
          if (!targetEq) return;
        if (!Array.isArray(targetEq.runeOptions)) {
          targetEq.runeOptions = ['', ''];
        }
        targetEq.runeOptions[bonusIndex] = event.target.value;
        setActiveEquipment(eq.key);
        refreshRuneSummary();
      });
        runeBonusRow.appendChild(bonusSelect);
      });

      eqDiv.appendChild(runeBonusRow);
    }

    eqDiv.addEventListener('click', () => setActiveEquipment(eq.key));
    equipmentSection.appendChild(eqDiv);

    draft[eq.key] = storedRune;
    if (eqData.runeGrade) {
      gradeDraft[eq.key] = eqData.runeGrade;
    }
  });
  setRuneSelectionDraft(draft);
  setRuneGradeDraft(gradeDraft);

  updateAccessoryRuneOptions(char.job);
  applyGemVisibility();
  refreshRuneSummary();
  charEditorSection.classList.remove('hidden');
  deleteCharacterBtn.classList.remove('hidden');
  if (equipmentTypes.length > 0) {
    setActiveEquipment(equipmentTypes[0].key);
  }
  charEditorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideEditor() {
  closeSummaryModal();
  charEditorSection.classList.add('hidden');
  setSelectedCharIndex(null);
  deleteCharacterBtn.classList.add('hidden');
  setCurrentEditingChar(null);
  setActiveEquipKey(null);
  resetRuneSelectionDraft();
  resetRuneGradeDraft();
  resetActiveWeaponRuneSeason();
  resetActiveArmorRuneSeason();
  resetActiveEmblemRuneSeason();
  resetRunePanel();
  refreshRuneSummary();
  if (openSummaryBtn) {
    openSummaryBtn.disabled = true;
  }
}

function saveCurrentCharacter() {
  const index = getSelectedCharIndex();
  if (index === null || index === undefined) return;
  const characters = getCharacters();
  const char = characters[index];
  if (!char) return;

  char.name = charNameInput.value.trim() || '이름없음';
  char.job = charJobSelect.value;

  const gradeDraft = getRuneGradeDraft();

  equipmentTypes.forEach((eq) => {
    const eqData = char.equipment[eq.key];
    for (let slotIndex = 0; slotIndex < eq.gemSlots; slotIndex++) {
      for (let optIndex = 0; optIndex < 3; optIndex++) {
        const control = document.querySelector(
          `[data-gem-input="true"][data-equip-key="${eq.key}"][data-slot-index="${slotIndex}"][data-opt-index="${optIndex}"]`
        );
        if (control) {
          eqData.gemOptions[slotIndex][optIndex] = control.value.trim();
        }
      }
    }
    if (!EQUIP_KEYS_WITH_RUNE_BONUS[eq.key]) {
      eqData.runeOptions = [];
    } else {
      if (!Array.isArray(eqData.runeOptions)) {
        eqData.runeOptions = ['', ''];
      }
      for (let bonusIndex = 0; bonusIndex < 2; bonusIndex++) {
        const bonusControl = document.querySelector(
          `[data-rune-bonus-input="true"][data-equip-key="${eq.key}"][data-bonus-index="${bonusIndex}"]`
        );
        if (bonusControl) {
          eqData.runeOptions[bonusIndex] = bonusControl.value.trim();
        } else if (!eqData.runeOptions[bonusIndex]) {
          eqData.runeOptions[bonusIndex] = '';
        }
      }
    }
    const draft = getRuneSelectionDraft();
    eqData.rune = draft[eq.key] || '없음';
    const grade = gradeDraft[eq.key] || null;
    eqData.runeGrade = eqData.rune === '없음' ? null : grade;
  });

  hideEditor();
  renderCharacterList();
  saveCharactersToStorage();
}

function deleteCurrentCharacter() {
  const index = getSelectedCharIndex();
  if (index === null || index === undefined) return;
  removeCharacter(index);
  hideEditor();
  renderCharacterList();
  saveCharactersToStorage();
}

function exportSettings() {
  const characters = getCharacters();

  if (characters.length === 0) {
    alert('내보낼 캐릭터가 없습니다.');
    return;
  }

  const settings = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    characters: characters,
    showGemOptions: getShowGemOptions()
  };

  const jsonString = JSON.stringify(settings, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `mabinogi-settings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  alert('세팅이 성공적으로 내보내졌습니다!');
}

function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.json')) {
    alert('JSON 파일만 업로드할 수 있습니다.');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const settings = JSON.parse(e.target.result);

      if (!settings.characters || !Array.isArray(settings.characters)) {
        throw new Error('올바르지 않은 파일 형식입니다.');
      }

      if (settings.characters.length === 0) {
        alert('파일에 캐릭터 데이터가 없습니다.');
        return;
      }

      const confirmMessage = `현재 캐릭터 ${getCharacters().length}개를 모두 삭제하고 파일의 캐릭터 ${settings.characters.length}개를 불러옵니다. 계속하시겠습니까?`;

      if (!confirm(confirmMessage)) {
        return;
      }

      while (getCharacters().length > 0) {
        removeCharacter(0);
      }

      settings.characters.forEach(char => {
        const validChar = validateCharacterData(char);
        if (validChar) {
          addCharacter(validChar);
        }
      });

      if (settings.showGemOptions !== undefined) {
        setShowGemOptions(settings.showGemOptions);
        toggleGemOptionsCheckbox.checked = settings.showGemOptions;
      }

      hideEditor();
      renderCharacterList();

      alert(`세팅이 성공적으로 불러와졌습니다! (${settings.characters.length}개 캐릭터)`);

    } catch (error) {
      alert('파일을 읽는 중 오류가 발생했습니다: ' + error.message);
      console.error('Import error:', error);
    } finally {
      event.target.value = '';
    }
  };

  reader.onerror = function() {
    alert('파일을 읽을 수 없습니다.');
    event.target.value = '';
  };

  reader.readAsText(file);
}

function validateCharacterData(char) {
  if (!char || typeof char !== 'object') return null;

  const validChar = {
    name: (char.name || '').toString().substring(0, 50) || '이름없음',
    job: jobs.includes(char.job) ? char.job : jobs[0],
    equipment: {}
  };

  equipmentTypes.forEach(eq => {
    if (char.equipment && char.equipment[eq.key]) {
      const eqData = char.equipment[eq.key];
      const bonusConfig = EQUIP_KEYS_WITH_RUNE_BONUS[eq.key];
      const runeOptions = Array.isArray(eqData.runeOptions)
        ? eqData.runeOptions.slice(0, 2).map(opt => (opt || '').toString().substring(0, 50))
        : [];
      const runeGrade = (eqData.runeGrade || '').toString().substring(0, 20).trim();

      const normalizedRuneOptions = bonusConfig
        ? (() => {
            const opts = [...runeOptions];
            while (opts.length < 2) opts.push('');
            return opts;
          })()
        : [];

      validChar.equipment[eq.key] = {
        gemOptions: Array.isArray(eqData.gemOptions)
          ? eqData.gemOptions.slice(0, eq.gemSlots).map(slot =>
              Array.isArray(slot) ? slot.slice(0, 3).map(opt => (opt || '').toString().substring(0, 50)) : ['', '', '']
            )
          : Array.from({ length: eq.gemSlots }, () => ['', '', '']),
        rune: (eqData.rune || '없음').toString().substring(0, 100),
        runeOptions: normalizedRuneOptions,
        runeGrade: runeGrade ? runeGrade : null
      };
    } else {
      const bonusConfig = EQUIP_KEYS_WITH_RUNE_BONUS[eq.key];
      validChar.equipment[eq.key] = {
        gemOptions: Array.from({ length: eq.gemSlots }, () => ['', '', '']),
        rune: '없음',
        runeOptions: bonusConfig ? ['', ''] : [],
        runeGrade: null
      };
    }
  });

  return validChar;
}

registerStatCalculatorAPI();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
