const fs = require('fs');
const path = require('path');
const dir = 'd:/js extra1/backend/src/templates';
const files = [
  'theme-red-minimal-line.js',
  'theme-top-border-photo.js',
  'theme-blue-header-curve.js',
  'theme-devops-tech.js',
  'theme-dark-blue-accent.js'
];

files.forEach(f => {
  let p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/\\\\`/g, '`'); // replace \\` with `
  c = c.replace(/\\`/g, '`');   // replace \` with ` just in case
  fs.writeFileSync(p, c);
  console.log('Fixed', f);
});
