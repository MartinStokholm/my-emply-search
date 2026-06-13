export default {
  template: `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <select v-model="localeLocal">
        <option value="da">Dansk</option>
        <option value="en">English</option>
      </select>
      <div style="font-size:13px;color:#666">{{ $t('language_help') }}</div>
    </div>
  `,
  setup() { const state = Vue.inject('state'); const localeLocal = Vue.computed({ get: () => state.locale.value, set: v => state.locale.value = v }); return { localeLocal }; }
};