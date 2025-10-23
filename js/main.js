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
const themeToggleBtn = document.getElementById('themeToggleBtn');

const THEME_STORAGE_KEY = 'mabinogiTheme';
const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
let currentTheme = 'light';

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

  resetActiveWeaponRuneSeason();
  resetActiveArmorRuneSeason();
  resetActiveEmblemRuneSeason();
  renderCharacterList();
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
      runeOptions: bonusConfig ? ['', ''] : []
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
        runeOptions: ['', '']
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

  const createOptionRow = (rune, defaultRarities = []) => {
    const row = document.createElement('div');
    row.className = 'rune-option';
    if (rune.name === (runeDraft[equipKey] || '없음')) {
      row.classList.add('active');
    }

    const nameCell = document.createElement('div');
    nameCell.className = 'rune-option-name';
    nameCell.textContent = rune.name;
    row.appendChild(nameCell);

    const gradeCell = document.createElement('div');
    gradeCell.className = 'rune-option-grade';
    const rawRarities = Array.isArray(rune.rarities) && rune.rarities.length
      ? rune.rarities
      : rune.rarity
      ? [rune.rarity]
      : defaultRarities;
    const displayRarities = [];
    rawRarities.forEach((label) => {
      const normalized = normalizeRarityLabel(label);
      if (normalized && !displayRarities.includes(normalized)) {
        displayRarities.push(normalized);
      }
    });

    if (displayRarities.length === 0) {
      gradeCell.textContent = '-';
    } else {
      displayRarities.forEach((label) => {
        const badgeRow = document.createElement('div');
        badgeRow.className = 'grade-row';
        const badge = document.createElement('span');
        badge.className = 'rune-grade-badge';
        const classKey = resolveRarityClass(label);
        if (classKey) {
          badge.classList.add(`rune-grade-${classKey}`);
        }
        badge.textContent = label;
        badgeRow.appendChild(badge);
        gradeCell.appendChild(badgeRow);
      });
    }
    row.appendChild(gradeCell);

    const descCell = document.createElement('div');
    descCell.className = 'rune-option-desc';
    descCell.textContent = rune.description;
    row.appendChild(descCell);

    row.addEventListener('click', () => selectRuneForEquipment(equipKey, rune.name));
    return row;
  };

  const createHeaderRow = () => {
    const header = document.createElement('div');
    header.className = 'rune-option rune-option-header';
    const nameHeader = document.createElement('div');
    nameHeader.className = 'rune-option-name';
    nameHeader.textContent = '이름';
    header.appendChild(nameHeader);
    const gradeHeader = document.createElement('div');
    gradeHeader.className = 'rune-option-grade';
    gradeHeader.textContent = '등급';
    header.appendChild(gradeHeader);
    const descHeader = document.createElement('div');
    descHeader.className = 'rune-option-desc';
    descHeader.textContent = '설명';
    header.appendChild(descHeader);
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
      baseGroup.style.display = showBase ? '' : 'none';

      groupedContainer.innerHTML = '';
      activeSeasonGroups.forEach((group) => {
        const filteredRunes = group.runes.filter((rune) => {
          const nameMatch = rune.name.toLowerCase().includes(lower);
          const descMatch = (rune.description || '').toLowerCase().includes(lower);
          return lower.length === 0 ? true : nameMatch || descMatch;
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

    const baseGroup = document.createElement('div');
    baseGroup.className = 'rune-group rune-group-basic';
    baseGroup.appendChild(createHeaderRow());
    baseGroup.appendChild(createOptionRow(baseRunes[0]));
    runeListEl.appendChild(baseGroup);

    runeGroups
      .filter((group) => group.season === getSeason())
      .forEach((group) => {
        if (!group.runes.length) return;
        const groupContainer = document.createElement('div');
        groupContainer.className = 'rune-group';
        const heading = document.createElement('h4');
        heading.textContent = `${group.season} ${group.rarity}`;
        groupContainer.appendChild(heading);
        groupContainer.appendChild(createHeaderRow());
        const defaultRarities = group.rarity ? [group.rarity] : [];
        group.runes.forEach((rune) =>
          groupContainer.appendChild(createOptionRow(rune, defaultRarities))
        );
        runeListEl.appendChild(groupContainer);
      });
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
      if (!lower) return true;
      const nameMatch = rune.name.toLowerCase().includes(lower);
      const descMatch = (rune.description || '').toLowerCase().includes(lower);
      return nameMatch || descMatch;
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

function selectRuneForEquipment(equipKey, runeName) {
  const currentChar = getCurrentEditingChar();
  if (!currentChar) return;
  const eqData = currentChar.equipment[equipKey];
  if (!eqData) return;

  const draft = { ...getRuneSelectionDraft(), [equipKey]: runeName };
  setRuneSelectionDraft(draft);
  updateRuneDisplay(equipKey, runeName);
  renderRuneInfoForEquipment(equipKey);
}

function updateRuneDisplay(equipKey, runeName = '없음') {
  const label = equipmentSection.querySelector(
    `.rune-display[data-equip-key="${equipKey}"] span`
  );
  if (label) {
    label.textContent = runeName;
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
  if (runeName === '없음' && EQUIP_KEYS_WITH_RUNE_BONUS[equipKey]) {
    const current = getCurrentEditingChar();
    if (current && current.equipment && current.equipment[equipKey]) {
      current.equipment[equipKey].runeOptions = ['', ''];
    }
  }
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
  equipmentTypes.forEach((eq) => {
    const isAccessory = eq.key === 'necklace' || eq.key.startsWith('ring');
    if (!isAccessory) return;
    if (!allowedNames.includes(draft[eq.key])) {
      draft[eq.key] = '없음';
      if (currentChar.equipment[eq.key]) {
        currentChar.equipment[eq.key].runeOptions = EQUIP_KEYS_WITH_RUNE_BONUS[eq.key]
          ? ['', '']
          : [];
      }
      updateRuneDisplay(eq.key, '없음');
    }
  });
  setRuneSelectionDraft(draft);

  const currentKey = getActiveEquipKey();
  if (currentKey) {
    renderRuneInfoForEquipment(currentKey);
  }
}

function handleJobChange() {
  const currentChar = getCurrentEditingChar();
  if (!currentChar) return;
  currentChar.job = charJobSelect.value;
  updateAccessoryRuneOptions(currentChar.job);
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
  resetActiveWeaponRuneSeason();
  resetActiveArmorRuneSeason();
  resetActiveEmblemRuneSeason();

  charNameInput.value = char.name;
  charJobSelect.value = char.job;
  toggleGemOptionsCheckbox.checked = getShowGemOptions();
  equipmentSection.innerHTML = '';

  const draft = {};
  equipmentTypes.forEach((eq) => {
    const eqData = char.equipment[eq.key];
    if (!eqData) return;
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
    runeDisplay.innerHTML = `현재 룬: <span>${storedRune}</span>`;
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
        });
        runeBonusRow.appendChild(bonusSelect);
      });

      eqDiv.appendChild(runeBonusRow);
    }

    eqDiv.addEventListener('click', () => setActiveEquipment(eq.key));
    equipmentSection.appendChild(eqDiv);

    draft[eq.key] = storedRune;
  });
  setRuneSelectionDraft(draft);

  updateAccessoryRuneOptions(char.job);
  applyGemVisibility();
  charEditorSection.classList.remove('hidden');
  deleteCharacterBtn.classList.remove('hidden');
  if (equipmentTypes.length > 0) {
    setActiveEquipment(equipmentTypes[0].key);
  }
  charEditorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideEditor() {
  charEditorSection.classList.add('hidden');
  setSelectedCharIndex(null);
  deleteCharacterBtn.classList.add('hidden');
  setCurrentEditingChar(null);
  setActiveEquipKey(null);
  resetRuneSelectionDraft();
  resetActiveWeaponRuneSeason();
  resetActiveArmorRuneSeason();
  resetActiveEmblemRuneSeason();
  resetRunePanel();
}

function saveCurrentCharacter() {
  const index = getSelectedCharIndex();
  if (index === null || index === undefined) return;
  const characters = getCharacters();
  const char = characters[index];
  if (!char) return;

  char.name = charNameInput.value.trim() || '이름없음';
  char.job = charJobSelect.value;

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
  });

  hideEditor();
  renderCharacterList();
}

function deleteCurrentCharacter() {
  const index = getSelectedCharIndex();
  if (index === null || index === undefined) return;
  removeCharacter(index);
  hideEditor();
  renderCharacterList();
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
        runeOptions: normalizedRuneOptions
      };
    } else {
      const bonusConfig = EQUIP_KEYS_WITH_RUNE_BONUS[eq.key];
      validChar.equipment[eq.key] = {
        gemOptions: Array.from({ length: eq.gemSlots }, () => ['', '', '']),
        rune: '없음',
        runeOptions: bonusConfig ? ['', ''] : []
      };
    }
  });

  return validChar;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
