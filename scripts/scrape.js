const fs = require('fs');
const path = require('path');
const axios = require('axios');

const URL = 'https://aarhus.career.emply.com/api/integration/vacancy/get-page';
const COUNT = 30;

const defaultHeaders = {
  'accept': '*/*',
  'content-type': 'application/json',
  'origin': 'https://aarhus.career.emply.com',
  'referer': 'https://aarhus.career.emply.com/ledige-stillinger',
  'x-requested-with': 'XMLHttpRequest',
  'user-agent': 'Mozilla/5.0 (Node.js)'
};

async function fetchPage(offset) {
  const body = {
    count: COUNT,
    filters: [{ filterTypeOrFactId: 'a87d1175-72c1-493d-87c9-25b991180e3e', value: '08a1da48-da80-4ff2-9f1f-d4bf217c3a8a,389c3e1a-9f72-4d63-babd-a20cce352caa,42f2c647-5645-4288-9e6d-62f3b92413bf,78523f51-a172-4170-9b0b-f9c4960eed4c,77ef1335-5dde-47df-af65-a2174e48d61e,bed47c6c-85ee-49a9-bb75-b614bfaab5ea,dfabf4b3-0b18-4b2b-9450-8dc78a89f503,de94d892-936f-41d5-9c3a-e0f95d65e76f,323111b2-71b2-4dc7-943a-293c2dde6748,809a7b22-350e-4419-9ba2-57345a66ba25,0564bca7-022d-42ba-820c-fca63abb28cb,e3ee023a-f7d3-4b7f-961d-6843570788a7,7a98b81b-326d-45de-945a-96426970e2df,8fa6c63d-7b0b-4889-a7e7-7803ab141c8d,4057f2e7-758f-4eb2-9591-d46652b5d2ff,ed63b31d-b7ff-4fc0-b935-151abd4d1a4c,1ac3dd9a-227d-4afd-92a9-a2b9298a02a3,8243a7c2-d8df-4885-a786-ab657f9e158a,8704013e-0efd-4f22-9513-93aeeca95778' }],
    langCode: 'da-DK',
    offset,
    searchText: '',
    sectionId: '687f3e3c-060e-4fd7-8fcc-14ca2e74da98',
    sortByProjectDataId: 'deadline',
    sortAscending: true,
    light: false,
    isJobAgent: false,
    siteId: null
  };

  const resp = await axios.post(URL, body, { headers: defaultHeaders, timeout: 60000 });
  return resp.data;
}

(async () => {
  try {
    let offset = 0;
    const all = [];
    const seen = new Set();
    while (true) {
      console.log('Fetching offset', offset);
      const data = await fetchPage(offset);
      const items = data && data.vacancies ? data.vacancies : [];
      if (!items.length) break;
      for (const v of items) {
        if (seen.has(v.id)) continue;
        seen.add(v.id);
        const content = (v.translations && v.translations[0] && v.translations[0].content) || '';
        all.push({
          id: v.id,
          number: v.number,
          title: v.title,
          titleAsUrl: v.titleAsUrl,
          url: v.titleAsUrl ? `https://aarhus.career.emply.com/ledige-stillinger/${v.titleAsUrl}` : null,
          location: v.location || (v.factDatas && v.factDatas.find(f=>f.factId==='location')?.text) || '',
          department: v.department || '',
          shortId: v.shortId || '',
          deadline: v.deadline || null,
          published: v.published || null,
          created: v.created || null,
          content
        });
      }
      if (items.length < COUNT) break;
      offset += COUNT;
      // safety cap
      if (offset > 1000) break;
    }

    const outDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'jobs.json'), JSON.stringify(all, null, 2));
    console.log('Wrote', all.length, 'jobs');
  } catch (err) {
    console.error('Scrape failed:', err.message || err);
    process.exitCode = 1;
  }
})();
