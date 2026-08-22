// Runs automatically on every Netlify deploy (see netlify.toml).
// Reads the individual markdown files editors create in the CMS (content/blog, content/events)
// and compiles them into the single JSON files the live site actually fetches (data/posts.json, data/events.json).
// This keeps the CMS editing experience simple (one file per post) without changing how the site loads data.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function normalizeDates(obj) {
  for (const key of Object.keys(obj)) {
    if (obj[key] instanceof Date) {
      obj[key] = obj[key].toISOString().slice(0, 10);
    }
  }
  return obj;
}

function buildFolderCollection(dir, outFile, bodyKey) {
  if (!fs.existsSync(dir)) {
    console.log(`(skip) ${dir} does not exist yet`);
    return;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const items = files.map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { data, content } = matter(raw);
    const item = normalizeDates({ ...data });
    if (bodyKey) item[bodyKey] = content.trim();
    return item;
  });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(items, null, 2));
  console.log(`Built ${outFile} (${items.length} item(s))`);
}

buildFolderCollection('content/blog', 'data/posts.json', 'body');
buildFolderCollection('content/events', 'data/events.json', null);

console.log('Build complete.');
