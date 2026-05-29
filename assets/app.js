const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    const jobs = ref([]);
    const query = ref('');
    const loading = ref(true);

    onMounted(async () => {
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

    const filtered = computed(() => {
      const words = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (words.length === 0) return jobs.value;
      return jobs.value.filter(job => {
        const text = (job.title + ' ' + (job.location||'') + ' ' + (job.description||'')).toLowerCase();
        return words.every(w => text.includes(w));
      });
    });

    return { jobs, query, filtered, loading };
  }
}).mount('#app');