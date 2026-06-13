export default {
  template: `
    <div class="saved-tags" v-if="state.savedTags.value.length">
      <span class="tag" v-for="(t, idx) in state.savedTags.value" :key="t.text" :class="{active: t.active}" @click="state.toggleTag(idx)">
        {{t.text}}
        <button class="remove" @click.stop="state.removeSaved(idx)" aria-label="Remove saved search">×</button>
      </span>
    </div>
  `,
  setup() { const state = Vue.inject('state'); return { state }; }
};