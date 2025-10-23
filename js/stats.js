// js/stats.js
// 능력치 계산 전용 페이지 스크립트

const ATTRIBUTE_DEFINITIONS = [
  { label: '힘', base: 1239, decimals: 0 },
  { label: '솜씨', base: 1239, decimals: 0 },
  { label: '지력', base: 1239, decimals: 0 },
  { label: '의지', base: 1239, decimals: 0 },
  { label: '행운', base: 1239, decimals: 0 },
  { label: '공격력', base: 1626, decimals: 0 },
  { label: '방어력', base: 2710, decimals: 0 },
  { label: '브레이크', base: 342, decimals: 0 },
  { label: '강타 강화', base: 342, decimals: 0 },
  { label: '콤보 강화', base: 335, decimals: 0 },
  { label: '스킬 위력', base: 348, decimals: 0 },
  { label: '광역 강화', base: 348, decimals: 0 },
  { label: '회복력', base: 350, decimals: 0 },
  { label: '급소 회피', base: 81.8, decimals: 1 },
  { label: '추가타', base: 342, decimals: 0 },
  { label: '피해 감소', base: 342, decimals: 0 },
  { label: '빠른 공격', base: 335, decimals: 0 },
  { label: '연타 강화', base: 335, decimals: 0 },
  { label: '빠른 스킬', base: 348, decimals: 0 },
  { label: '추가 체력', base: 1094, decimals: 0 },
  { label: '궁극기', base: 350, decimals: 0 },
  { label: '치명타', base: 342, decimals: 0 },
  { label: '궁극기 (추가)', base: 358, decimals: 0 },
  { label: '치명타 (추가)', base: 349.5, decimals: 1 }
];

const CATEGORIES = [
  { key: 'rune', label: '룬' },
  { key: 'gem', label: '보석' },
  { key: 'pet', label: '펫' },
  { key: 'levelUpCards', label: '레벨업 카드' },
  { key: 'titles', label: '타이틀' },
  { key: 'other', label: '기타' }
];

const statsState = CATEGORIES.reduce((acc, category) => {
  acc[category.key] = {};
  return acc;
}, {});

const effectState = CATEGORIES.reduce((acc, category) => {
  acc[category.key] = [];
  return acc;
}, {});

const totalCells = new Map(); // attribute -> cell
const inputRefs = []; // { element, attr, category }

const elements = {
  tableBody: document.getElementById('statTableBody'),
  resetBtn: document.getElementById('resetAllBtn'),
  copyBtn: document.getElementById('copyStatsBtn'),
  effectSummaryList: document.getElementById('effectSummaryList'),
  effectFields: {
    rune: document.getElementById('effectRune'),
    gem: document.getElementById('effectGem'),
    pet: document.getElementById('effectPet'),
    levelUpCards: document.getElementById('effectLevel'),
    titles: document.getElementById('effectTitle'),
    other: document.getElementById('effectOther')
  }
};

function formatNumber(value, decimals = 0) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function initializeTable() {
  ATTRIBUTE_DEFINITIONS.forEach((attr) => {
    const tr = document.createElement('tr');

    const nameCell = document.createElement('th');
    nameCell.scope = 'row';
    nameCell.textContent = attr.label;
    tr.appendChild(nameCell);

    const baseCell = document.createElement('td');
    baseCell.textContent = formatNumber(attr.base, attr.decimals);
    tr.appendChild(baseCell);

    CATEGORIES.forEach((category) => {
      const td = document.createElement('td');
      td.className = 'stat-input-cell';
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'stat-input';
      input.step = attr.decimals > 0 ? '0.1' : '1';
      input.value = '';
      input.dataset.attribute = attr.label;
      input.dataset.category = category.key;
      input.addEventListener('input', handleStatInput);
      td.appendChild(input);
      tr.appendChild(td);
      inputRefs.push({ element: input, attribute: attr.label, category: category.key });
    });

    const totalCell = document.createElement('td');
    totalCell.className = 'stat-total-cell';
    tr.appendChild(totalCell);
    elements.tableBody.appendChild(tr);
    totalCells.set(attr.label, { cell: totalCell, decimals: attr.decimals });
  });

  Object.entries(elements.effectFields).forEach(([key, textarea]) => {
    textarea.addEventListener('input', () => {
      effectState[key] = textarea.value
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      renderEffectSummary();
      syncStatCalculator();
    });
  });
}

function handleStatInput(event) {
  const input = event.target;
  const category = input.dataset.category;
  const attribute = input.dataset.attribute;
  const rawValue = input.value.trim();
  const parsed = rawValue === '' ? 0 : Number(rawValue);
  if (!Number.isFinite(parsed)) {
    input.classList.add('input-error');
    return;
  }
  input.classList.remove('input-error');
  if (parsed === 0) {
    delete statsState[category][attribute];
  } else {
    statsState[category][attribute] = parsed;
  }
  renderTotals();
  syncStatCalculator();
}

function renderTotals() {
  ATTRIBUTE_DEFINITIONS.forEach((attr) => {
    const base = attr.base;
    let extra = 0;
    CATEGORIES.forEach((category) => {
      extra += Number(statsState[category.key][attr.label]) || 0;
    });
    const total = base + extra;
    const target = totalCells.get(attr.label);
    if (target) {
      const { cell, decimals } = target;
      cell.textContent = `${formatNumber(base, decimals)} + ${formatNumber(extra, decimals)} = ${formatNumber(total, decimals)}`;
    }
  });
}

function renderEffectSummary() {
  const list = elements.effectSummaryList;
  list.innerHTML = '';
  const allEffects = [];
  CATEGORIES.forEach((category) => {
    effectState[category.key].forEach((entry) => {
      allEffects.push(`${category.label}: ${entry}`);
    });
  });
  if (allEffects.length === 0) {
    const li = document.createElement('li');
    li.className = 'rune-summary-empty';
    li.textContent = '특수 효과가 없습니다.';
    list.appendChild(li);
  } else {
    allEffects.forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = entry;
      list.appendChild(li);
    });
  }
}

function buildSummaryText() {
  const lines = ['[능력치 합계]'];
  ATTRIBUTE_DEFINITIONS.forEach((attr) => {
    const base = attr.base;
    let extra = 0;
    const extraDetail = [];
    CATEGORIES.forEach((category) => {
      const value = Number(statsState[category.key][attr.label]) || 0;
      if (value !== 0) {
        extraDetail.push(`${category.label}+${formatNumber(value, attr.decimals)}`);
        extra += value;
      }
    });
    const total = base + extra;
    const detailText = extraDetail.length ? ` (${extraDetail.join(', ')})` : '';
    lines.push(`- ${attr.label}: ${formatNumber(base, attr.decimals)} + ${formatNumber(extra, attr.decimals)} = ${formatNumber(total, attr.decimals)}${detailText}`);
  });

  const effectLines = [];
  CATEGORIES.forEach((category) => {
    effectState[category.key].forEach((entry) => {
      effectLines.push(`${category.label}: ${entry}`);
    });
  });

  if (effectLines.length) {
    lines.push('', '[특수 효과]');
    effectLines.forEach((line) => lines.push(`- ${line}`));
  }

  return lines.join('\n');
}

function syncStatCalculator() {
  if (!window.statCalculator) return;
  CATEGORIES.forEach((category) => {
    window.statCalculator.setStatBonuses(category.key, { ...statsState[category.key] });
    window.statCalculator.setEffectBonuses(category.key, [...effectState[category.key]]);
  });
  window.statCalculator.refresh();
}

function resetAllInputs() {
  inputRefs.forEach(({ element }) => {
    element.value = '';
  });
  CATEGORIES.forEach((category) => {
    statsState[category.key] = {};
    effectState[category.key] = [];
    const textarea = elements.effectFields[category.key];
    if (textarea) {
      textarea.value = '';
    }
  });
  renderTotals();
  renderEffectSummary();
  syncStatCalculator();
}

async function copySummary() {
  const summary = buildSummaryText();
  if (!summary.trim()) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(summary);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    alert('요약이 복사되었습니다.');
  } catch (error) {
    console.warn('클립보드 복사 실패', error);
    alert('클립보드 복사에 실패했습니다.');
  }
}

function init() {
  initializeTable();
  renderTotals();
  renderEffectSummary();

  elements.resetBtn.addEventListener('click', resetAllInputs);
  elements.copyBtn.addEventListener('click', copySummary);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
