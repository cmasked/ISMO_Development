const { setTimeout: delay } = require('node:timers/promises');
(async () => {
  const endpoint = 'https://api.github.com/repos/' + process.env.GITHUB_REPOSITORY + '/actions/runs?head_sha=' + process.env.REVIEW_HEAD + '&per_page=20';
  for (let i = 0; i < 100; i++) {
    const response = await fetch(endpoint, { headers: { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN, Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('Cannot inspect Android workflow status.');
    const data = await response.json();
    const run = data.workflow_runs.find(run => run.name === 'Android application');
    if (run?.status === 'completed') {
      if (run.conclusion !== 'success') throw new Error('Android verification failed; live QA stays queued.');
      console.log('Android verification passed. Starting the queued live website review.'); return;
    }
    if (i % 4 === 0) console.log('Waiting for Android verification to complete.');
    await delay(15000);
  }
  throw new Error('Android verification did not finish within the review window.');
})().catch(error => { console.error(error.message); process.exit(1); });
