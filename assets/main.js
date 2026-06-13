import LanguageSelector from './components/LanguageSelector.js';
import SearchControls from './components/SearchControls.js';
import SavedTags from './components/SavedTags.js';
import JobList from './components/JobList.js';

const { createApp, ref, computed, onMounted, watch, provide, reactive } = Vue;

const messages = {
  da: {
    title: 'Job-søgning - Aarhus',
    language_help: 'Vælg sprog',
    placeholder: 'Filter efter ord (adskilt med mellemrum)',
    'field.title': 'Titel',
    'field.location': 'Lokation',
    'field.content': 'Indhold',
    save_search: 'Gem søgning',
    clear_saved: 'Ryd gemte',
    active_filters: 'Aktive filtre',
    show_reasons: 'Vis match årsager',
    loading: 'Indlæser job...',
    no_jobs: 'Ingen job fundet.',
    note: 'Data opdateres automatisk; hvis tomt, kør workflow eller tjek logs.',
    no_title: '(ingen titel)',
    saved_placeholder: 'Gemte søgninger'
  },
  en: {
    title: 'Job Search - Aarhus',
    language_help: 'Choose language',
    placeholder: 'Filter by words (space-separated)',
    'field.title': 'Title',
    'field.location': 'Location',
    'field.content': 'Content',
    save_search: 'Save search',
    clear_saved: 'Clear saved',
    active_filters: 'Active filters',
    show_reasons: 'Show match reasons',
    loading: 'Loading jobs...',
    no_jobs: 'No jobs found.',
    note: 'Data refreshed by scraper; if empty, run the workflow or check action logs.',
    no_title: '(no title)',
    saved_placeholder: 'Saved searches'
  }
};

const savedLocale = (typeof localStorage !== 'undefined' && localStorage.getItem('locale')) || 'da';
const i18n = VueI18n.createI18n({ locale: savedLocale, messages });

const app = createApp({
  setup() {
    const jobs = ref([]);
    const query = ref('');
    const loading = ref(true);
    const savedTags = ref([]);
    const searchFields = reactive({ title: true, location: true, content: false });
    const locale = ref(i18n.global.locale || 'da');
    const showReasons = ref(false);

    watch(locale, (v) => { i18n.global.locale = v; try { localStorage.setItem('locale', v); } catch(e){} });

    function loadSaved() { try { const raw = localStorage.getItem('savedTags'); savedTags.value = raw ? JSON.parse(raw) : []; } catch (e) { savedTags.value = []; } }
    function saveSaved() { try { localStorage.setItem('savedTags', JSON.stringify(savedTags.value)); } catch(e){} }

    onMounted(async () => {
      loadSaved();
      try { const resp = await fetch('./data/jobs.json'); if (!resp.ok) throw new Error('Failed to load jobs.json'); jobs.value = await resp.json(); } catch (e) { console.error(e); jobs.value = []; } finally { loading.value = false; }
    });

    function addTag() { const txt = query.value.trim(); if (!txt) return; const existing = savedTags.value.find(t => t.text.toLowerCase() === txt.toLowerCase()); if (existing) { existing.active = true; } else { savedTags.value.push({ text: txt, active: true }); } saveSaved(); }
    function selectSaved(idx) { const i = Number(idx); if (isNaN(i) || i < 0 || i >= savedTags.value.length) return; const t = savedTags.value[i]; if (!t) return; query.value = t.text; savedTags.value.forEach((s,ii)=> s.active = ii===i); saveSaved(); }
    function removeSaved(idx) { const i = Number(idx); if (isNaN(i) || i < 0 || i >= savedTags.value.length) return; savedTags.value.splice(i,1); saveSaved(); }
    function toggleTag(idx) { const t = savedTags.value[idx]; if (!t) return; t.active = !t.active; saveSaved(); }
    function clearSaved() { savedTags.value = []; saveSaved(); }

    function getMatchInfo(job) {
      const qWords = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const tagWords = savedTags.value.filter(t => t.active).map(t => t.text.toLowerCase());
      const words = Array.from(new Set([...qWords, ...tagWords]));
      const info = [];
      for (const w of words) {
        const fields = [];
        if (searchFields.title && (job.title||'').toLowerCase().includes(w)) fields.push('title');
        if (searchFields.location && (job.location||'').toLowerCase().includes(w)) fields.push('location');
        if (searchFields.content && (job.content||job.description||'').toLowerCase().includes(w)) fields.push('content');
        if (fields.length) info.push({ word: w, fields });
      }
      return info;
    }

    function escapeHtml(str) { if (str == null) return ''; return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

    function highlightTitle(job) {
      const title = job && job.title ? String(job.title) : '';
      if (!showReasons.value) return escapeHtml(title);
      const matches = getMatchInfo(job).filter(m => m.fields.includes('title')).map(m => m.word);
      if (!matches.length) return escapeHtml(title);
      const uniq = Array.from(new Set(matches)).sort((a,b)=>b.length - a.length);
      const escapedWords = uniq.map(w => w.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'));
      const re = new RegExp('(' + escapedWords.join('|') + ')', 'gi');
      return escapeHtml(title).replace(re, function(m){ return '<mark class="highlight">' + escapeHtml(m) + '</mark>'; });
    }

    const filtered = computed(() => {
      const qWords = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const tagWords = savedTags.value.filter(t => t.active).map(t => t.text.toLowerCase());
      const words = Array.from(new Set([...qWords, ...tagWords]));
      if (words.length === 0) return jobs.value.filter(j => j && (j.title || j.number));
      return jobs.value.filter(job => {
        if (!job) return false;
        const parts = [];
        if (searchFields.title) parts.push(job.title||'');
        if (searchFields.location) parts.push(job.location||'');
        if (searchFields.content) parts.push(job.content||job.description||'');
        const text = parts.join(' ').toLowerCase();
        return words.every(w => text.includes(w));
      }).filter(j => j && (j.title || j.number));
    });

    const activeWords = computed(() => {
      const qWords = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const tagWords = savedTags.value.filter(t => t.active).map(t => t.text.toLowerCase());
      return Array.from(new Set([...qWords, ...tagWords]));
    });

    const state = { jobs, query, filtered, loading, savedTags, addTag, selectSaved, toggleTag, clearSaved, searchFields, showReasons, getMatchInfo, highlightTitle, activeWords, locale };
    provide('state', state);

    return { locale };
  }
});

app.component('language-selector', LanguageSelector);
app.component('search-controls', SearchControls);
app.component('saved-tags', SavedTags);
app.component('job-list', JobList);

app.use(i18n).mount('#app');
