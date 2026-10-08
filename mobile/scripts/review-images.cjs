const fs = require('fs');
const path = require('path');
const names = ['dashboard-empty-light', 'project-tasks-light', 'project-tasks-dark', 'tasks-dark'];
const files = [];
function scan(directory, depth = 0) {
  if (!fs.existsSync(directory) || depth > 5) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { if (!['node_modules', 'android', '.git', 'backend', 'web'].includes(entry.name)) scan(file, depth + 1); }
    else if (entry.name.endsWith('.png')) files.push(file);
    else if ((entry.name === 'commands.json' || entry.name.startsWith('commands-')) && entry.name.endsWith('.json')) console.log('NATIVE_FLOW_DIAGNOSTICS=' + fs.readFileSync(file, 'utf8').slice(-50000));
  }
}
scan('mobile/native-results'); scan('mobile/.maestro');
for (const name of names) {
  const file = files.find(file => path.basename(file) === name + '.png') || [name + '.png', 'mobile/' + name + '.png'].find(file => fs.existsSync(file));
  if (file) console.log('ANDROID_REVIEW_' + name + '=' + fs.readFileSync(file).toString('base64'));
}

for (const [index, file] of files.filter(file => /fail|screenshots\/step/i.test(file)).slice(-2).entries()) console.log('ANDROID_REVIEW_failure-' + index + '=' + fs.readFileSync(file).toString('base64'));
