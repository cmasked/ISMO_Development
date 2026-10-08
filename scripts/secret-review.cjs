const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const files = execFileSync('git', ['ls-files', '-z']).toString().split('\0').filter(Boolean);
const hits = [];
const tokens = /(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|sk_live_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s<>:]+:[^\s<>@]+@)/;
for (const path of files) {
  if (/(^|\/)\.env(?:$|\.(?!example$))/.test(path)) hits.push({ path, reason: 'Tracked environment file' });
  if (/package-lock\.json$|\.png$|\.pdf$/.test(path)) continue;
  const data = fs.readFileSync(path, 'utf8');
  data.split('\n').forEach((line, index) => { if (tokens.test(line)) hits.push({ path, line: index + 1, reason: 'Credential indicator' }); });
}
console.log('SECRET_REVIEW=' + JSON.stringify({ trackedFiles: files.length, findings: hits }));
if (hits.length) process.exit(1);
