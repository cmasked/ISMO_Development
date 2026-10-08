const fs = require('fs');
const path = require('path');
const names = ['dashboard-empty-light', 'project-tasks-light', 'project-tasks-dark', 'tasks-dark'];
const files = [];
function scan(directory, depth = 0) {
  if (!fs.existsSync(directory) || depth > 5) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { if (!['node_modules', 'android', '.git', 'backend', 'web'].includes(entry.name)) scan(file, depth + 1); }
    else if (names.includes(entry.name.replace(/\.png$/, ''))) files.push(file);
  }
}
scan('mobile/native-results'); scan('mobile/.maestro');
for (const name of names) {
  const file = files.find(file => path.basename(file) === name + '.png') || [name + '.png', 'mobile/' + name + '.png'].find(file => fs.existsSync(file));
  if (file) console.log('ANDROID_REVIEW_' + name + '=' + fs.readFileSync(file).toString('base64'));
}
