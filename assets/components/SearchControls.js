export default {
  template: `
    <div class="controls">
      <input v-model="queryLocal" :placeholder="$t('placeholder')" />
      <div class="field-controls">
        <label><input type="checkbox" v-model="state.searchFields.title" /> {{ $t('field.title') }}</label>
        <label><input type="checkbox" v-model="state.searchFields.location" /> {{ $t('field.location') }}</label>
        <label><input type="checkbox" v-model="state.searchFields.content" /> {{ $t('field.content') }}</label>
      </div>
      <div class="tag-controls">
        <button @click="state.addTag" class="tag-add" :disabled="!state.query.value.trim()">{{ $t('save_search') }}</button>
        <select class="saved-dropdown" @change="onSelect($event)">
          <option value="">{{ $t('saved_placeholder') }}</option>
          <option v-for="(t, idx) in state.savedTags.value" :value="idx" :key="t.text">{{t.text}}</option>
        </select>
        <button @click="state.clearSaved" class="tag-clear" v-if="state.savedTags.value.length">{{ $t('clear_saved') }}</button>
      </div>
      <div class="active-filters" v-if="state.activeWords.value.length">
        {{ $t('active_filters') }}:
        <span class="active-word" v-for="w in state.activeWords.value" :key="w">{{w}}</span>
      </div>
      <label class="toggle" style="margin-top:8px">
        <span class="toggle-label">{{ $t('show_reasons') }}</span>
        <input type="checkbox" v-model="state.showReasons.value" />
        <span class="toggle-ui" aria-hidden="true"></span>
      </label>
    </div>
  `,
  setup() { const state = Vue.inject('state'); const queryLocal = Vue.computed({ get: () => state.query.value, set: v => state.query.value = v }); function onSelect(e){ const val = e.target.value; if(val==='') return; state.selectSaved(Number(val)); e.target.value=''; } return { state, queryLocal, onSelect }; }
};