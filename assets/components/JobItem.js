export default {
  props: ['job'],
  template: `
    <li>
      <template v-if="job">
        <a :href="job.url || '#'" target="_blank" rel="noopener" v-html="state.highlightTitle(job)"></a>
        <div class="meta">{{job.location || ''}}</div>
        <div class="match-reasons" v-if="state.showReasons.value">
          <span v-for="m in state.getMatchInfo(job)" :key="m.word">{{m.word}}: {{m.fields.join(', ')}}</span>
        </div>
      </template>
    </li>
  `,
  setup() { const state = Vue.inject('state'); return { state }; }
};