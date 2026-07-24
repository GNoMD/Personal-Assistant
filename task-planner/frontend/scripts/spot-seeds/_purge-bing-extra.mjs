import fs from 'fs';

const outJson = 'scripts/spot-seeds/landmarks-extra.json';
const outMjs = 'scripts/spot-seeds/landmarks-extra.mjs';
const j = JSON.parse(fs.readFileSync(outJson, 'utf8'));
let kept = 0;
let dropped = 0;
for (const pid of Object.keys(j.provinces || {})) {
  const before = j.provinces[pid].length;
  j.provinces[pid] = (j.provinces[pid] || []).filter((s) => s.source === 'mct-5a');
  kept += j.provinces[pid].length;
  dropped += before - j.provinces[pid].length;
}
j.generatedAt = new Date().toISOString();
fs.writeFileSync(outJson, JSON.stringify(j, null, 2));

const ids = Object.keys(j.provinces).sort();
let body = '/** Auto-generated real landmarks (MCT 5A). */\n\nexport const LANDMARKS_EXTRA = {\n';
for (const pid of ids) {
  body += `  ${pid}: [\n`;
  for (const s of j.provinces[pid]) {
    const fields = [
      `cityId: ${JSON.stringify(s.cityId)}`,
      `cityName: ${JSON.stringify(s.cityName)}`,
      `name: ${JSON.stringify(s.name)}`,
      `category: ${JSON.stringify(s.category)}`,
      `area: ${JSON.stringify(s.area)}`,
      `location: ${JSON.stringify(s.location)}`,
    ];
    if (typeof s.lat === 'number') fields.push(`lat: ${s.lat}`);
    if (typeof s.lng === 'number') fields.push(`lng: ${s.lng}`);
    if (s.source) fields.push(`source: ${JSON.stringify(s.source)}`);
    if (s.grade) fields.push(`grade: ${JSON.stringify(s.grade)}`);
    body += `    { ${fields.join(', ')} },\n`;
  }
  body += '  ],\n';
}
body += '};\n';
fs.writeFileSync(outMjs, body);
console.log({ kept, dropped });
