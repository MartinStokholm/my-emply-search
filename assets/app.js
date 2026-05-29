const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    const jobs = ref([]);
    const query = ref('');
    const loading = ref(true);
    const savedTags = ref([]); // { text, active }
    const searchFields = ref({ title: true, location: true, content: false });

    function loadSaved() {
      try {
        const raw = localStorage.getItem('savedTags');
        savedTags.value = raw ? JSON.parse(raw) : [];
      } catch (e) {
        savedTags.value = [];
      }
    }
    function saveSaved() {
      try { localStorage.setItem('savedTags', JSON.stringify(savedTags.value)); } catch(e){}
    }

    onMounted(async () => {
      loadSaved();
      try {
        const resp = await fetch('./data/jobs.json');
        if (!resp.ok) throw new Error('Failed to load jobs.json');
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
      const existing = savedTags.value.find(t => t.text.toLowerCase() === txt.toLowerCase());
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
      const qWords = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const tagWords = savedTags.value.filter(t => t.active).map(t => t.text.toLowerCase());
      const words = Array.from(new Set([...qWords, ...tagWords]));
      const info = [];
      for (const w of words) {
        const fields = [];
        if (searchFields.value.title && (job.title||'').toLowerCase().includes(w)) fields.push('title');
        if (searchFields.value.location && (job.location||'').toLowerCase().includes(w)) fields.push('location');
        if (searchFields.value.content && (job.content||job.description||'').toLowerCase().includes(w)) fields.push('content');
        if (fields.length) info.push({ word: w, fields });
      }
      return info;
    }

    const filtered = computed(() => {
      const qWords = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const tagWords = savedTags.value.filter(t => t.active).map(t => t.text.toLowerCase());
      const words = Array.from(new Set([...qWords, ...tagWords]));
      if (words.length === 0) return jobs.value.filter(j => j && (j.title || j.number));
      return jobs.value.filter(job => {
        if (!job) return false;
        const parts = [];
        if (searchFields.value.title) parts.push(job.title||'');
        if (searchFields.value.location) parts.push(job.location||'');
        if (searchFields.value.content) parts.push(job.content||job.description||'');
        const text = parts.join(' ').toLowerCase();
        return words.every(w => text.includes(w));
      }).filter(j => j && (j.title || j.number));
    });

    const activeWords = computed(() => {
      const qWords = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const tagWords = savedTags.value.filter(t => t.active).map(t => t.text.toLowerCase());
      return Array.from(new Set([...qWords, ...tagWords]));
    });

    return { jobs, query, filtered, loading, savedTags, addTag, toggleTag, clearSaved, searchFields, showReasons, getMatchInfo, activeWords };
  }
}).mount('#app');