const { createApp, ref, computed, onMounted, watch } = Vue;

// i18n messages
const messages = {
  da: {
    title: "Job-søgning - Aarhus",
    language_help: "Vælg sprog",
    placeholder: "Filter efter ord (adskilt med mellemrum)",
    "field.title": "Titel",
    "field.location": "Lokation",
    "field.content": "Indhold",
    save_search: "Gem søgning",
    clear_saved: "Ryd gemte",
    active_filters: "Aktive filtre",
    show_reasons: "Vis match årsager",
    loading: "Indlæser job...",
    no_jobs: "Ingen job fundet.",
    note: "Data opdateres automatisk; hvis tomt, kør workflow eller tjek logs.",
    no_title: "(ingen titel)",
  },
  en: {
    title: "Job Search - Aarhus",
    language_help: "Choose language",
    placeholder: "Filter by words (space-separated)",
    "field.title": "Title",
    "field.location": "Location",
    "field.content": "Content",
    save_search: "Save search",
    clear_saved: "Clear saved",
    active_filters: "Active filters",
    show_reasons: "Show match reasons",
    loading: "Loading jobs...",
    no_jobs: "No jobs found.",
    note: "Data refreshed by scraper; if empty, run the workflow or check action logs.",
    no_title: "(no title)",
  },
};

const savedLocale =
  (typeof localStorage !== "undefined" && localStorage.getItem("locale")) ||
  "da";
const i18n = VueI18n.createI18n({ locale: savedLocale, messages });

createApp({
  setup() {
    const jobs = ref([]);
    const query = ref("");
    const loading = ref(true);
    const savedTags = ref([]); // { text, active }
    const searchFields = ref({ title: true, location: true, content: false });
    const locale = ref(i18n.global.locale || "da");

    watch(locale, (v) => {
      i18n.global.locale = v;
      try {
        localStorage.setItem("locale", v);
      } catch (e) {}
    });

    function loadSaved() {
      try {
        const raw = localStorage.getItem("savedTags");
        savedTags.value = raw ? JSON.parse(raw) : [];
      } catch (e) {
        savedTags.value = [];
      }
    }
    function saveSaved() {
      try {
        localStorage.setItem("savedTags", JSON.stringify(savedTags.value));
      } catch (e) {}
    }

    onMounted(async () => {
      loadSaved();
      try {
        const resp = await fetch("./data/jobs.json");
        if (!resp.ok) throw new Error("Failed to load jobs.json");
        jobs.value = await resp.json();
      } catch (e) {
        console.error(e);
        jobs.value = [];
      } finally {
        loading.value = false;
      }
    });

    function addTag() {
      const txt = query.value.trim();
      if (!txt) return;
      const existing = savedTags.value.find(
        (t) => t.text.toLowerCase() === txt.toLowerCase(),
      );
      if (existing) {
        existing.active = true;
      } else {
        savedTags.value.push({ text: txt, active: true });
      }
      saveSaved();
    }

    function toggleTag(idx) {
      const t = savedTags.value[idx];
      if (!t) return;
      t.active = !t.active;
      saveSaved();
    }

    function clearSaved() {
      savedTags.value = [];
      saveSaved();
    }

    const showReasons = ref(false);

    function getMatchInfo(job) {
      const qWords = query.value
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const tagWords = savedTags.value
        .filter((t) => t.active)
        .map((t) => t.text.toLowerCase());
      const words = Array.from(new Set([...qWords, ...tagWords]));
      const info = [];
      for (const w of words) {
        const fields = [];
        if (
          searchFields.value.title &&
          (job.title || "").toLowerCase().includes(w)
        )
          fields.push("title");
        if (
          searchFields.value.location &&
          (job.location || "").toLowerCase().includes(w)
        )
          fields.push("location");
        if (
          searchFields.value.content &&
          (job.content || job.description || "").toLowerCase().includes(w)
        )
          fields.push("content");
        if (fields.length) info.push({ word: w, fields });
      }
      return info;
    }

    // Escape HTML in text to avoid XSS
    function escapeHtml(str) {
      if (str == null) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    // Return HTML string for title with matched words wrapped in <mark>
    function highlightTitle(job) {
      const title = job && job.title ? String(job.title) : "";
      if (!showReasons.value) return escapeHtml(title);
      const matches = getMatchInfo(job)
        .filter((m) => m.fields.includes("title"))
        .map((m) => m.word);
      if (!matches.length) return escapeHtml(title);
      const uniq = Array.from(new Set(matches)).sort(
        (a, b) => b.length - a.length,
      );
      const escapedWords = uniq.map((w) =>
        w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      );
      const re = new RegExp("(" + escapedWords.join("|") + ")", "gi");
      // Replace on original title, but escape the matched fragments
      return escapeHtml(title).replace(re, function (m) {
        return '<mark class="highlight">' + escapeHtml(m) + "</mark>";
      });
    }

    const filtered = computed(() => {
      const qWords = query.value
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const tagWords = savedTags.value
        .filter((t) => t.active)
        .map((t) => t.text.toLowerCase());
      const words = Array.from(new Set([...qWords, ...tagWords]));
      if (words.length === 0)
        return jobs.value.filter((j) => j && (j.title || j.number));
      return jobs.value
        .filter((job) => {
          if (!job) return false;
          const parts = [];
          if (searchFields.value.title) parts.push(job.title || "");
          if (searchFields.value.location) parts.push(job.location || "");
          if (searchFields.value.content)
            parts.push(job.content || job.description || "");
          const text = parts.join(" ").toLowerCase();
          return words.every((w) => text.includes(w));
        })
        .filter((j) => j && (j.title || j.number));
    });

    const activeWords = computed(() => {
      const qWords = query.value
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const tagWords = savedTags.value
        .filter((t) => t.active)
        .map((t) => t.text.toLowerCase());
      return Array.from(new Set([...qWords, ...tagWords]));
    });

    return {
      jobs,
      query,
      filtered,
      loading,
      savedTags,
      addTag,
      toggleTag,
      clearSaved,
      searchFields,
      showReasons,
      getMatchInfo,
      highlightTitle,
      activeWords,
      locale,
    };
  },
})
  .use(i18n)
  .mount("#app");
