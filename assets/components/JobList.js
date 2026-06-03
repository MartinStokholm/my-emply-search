import JobItem from './JobItem.js';

export default {
  components: { JobItem },
  template: `
    <div>
      <div v-if="state.loading.value">{{ $t('loading') }}</div>
      <div v-else>
        <div v-if="state.filtered.value.length===0">{{ $t('no_jobs') }}</div>
        <ul>
          <job-item v-for="job in state.filtered.value" :key="job && job.id" :job="job"></job-item>
        </ul>
      </div>
    </div>
  `,
  setup() { const state = Vue.inject('state'); return { state }; }
};