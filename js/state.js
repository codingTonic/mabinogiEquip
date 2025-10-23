// js/state.js
// 애플리케이션 전역 상태 관리

import { weaponSeasons, armorSeasons, emblemSeasons } from './data.js';

const characters = [];
let selectedCharIndex = null;
let currentEditingChar = null;
let activeEquipKey = null;
let runeSelectionDraft = {};
let activeWeaponRuneSeason = weaponSeasons[0] || null;
let activeArmorRuneSeason = armorSeasons[0] || null;
let activeEmblemRuneSeason = emblemSeasons[0] || null;
let showGemOptions = true;

export function getCharacters() {
  return characters;
}

export function addCharacter(character) {
  characters.push(character);
}

export function removeCharacter(index) {
  characters.splice(index, 1);
}

export function getSelectedCharIndex() {
  return selectedCharIndex;
}

export function setSelectedCharIndex(index) {
  selectedCharIndex = index;
}

export function getCurrentEditingChar() {
  return currentEditingChar;
}

export function setCurrentEditingChar(char) {
  currentEditingChar = char;
}

export function getActiveEquipKey() {
  return activeEquipKey;
}

export function setActiveEquipKey(key) {
  activeEquipKey = key;
}

export function getRuneSelectionDraft() {
  return runeSelectionDraft;
}

export function setRuneSelectionDraft(draft) {
  runeSelectionDraft = draft;
}

export function resetRuneSelectionDraft() {
  runeSelectionDraft = {};
}

export function getActiveWeaponRuneSeason() {
  return activeWeaponRuneSeason;
}

export function setActiveWeaponRuneSeason(season) {
  activeWeaponRuneSeason = season;
}

export function resetActiveWeaponRuneSeason() {
  activeWeaponRuneSeason = weaponSeasons[0] || null;
}

export function getShowGemOptions() {
  return showGemOptions;
}

export function setShowGemOptions(value) {
  showGemOptions = Boolean(value);
}

export function getActiveArmorRuneSeason() {
  return activeArmorRuneSeason;
}

export function setActiveArmorRuneSeason(season) {
  activeArmorRuneSeason = season;
}

export function resetActiveArmorRuneSeason() {
  activeArmorRuneSeason = armorSeasons[0] || null;
}

export function getActiveEmblemRuneSeason() {
  return activeEmblemRuneSeason;
}

export function setActiveEmblemRuneSeason(season) {
  activeEmblemRuneSeason = season;
}

export function resetActiveEmblemRuneSeason() {
  activeEmblemRuneSeason = emblemSeasons[0] || null;
}
