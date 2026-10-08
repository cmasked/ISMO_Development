const url = process.argv[2];
(async () => {
  for (let attempt = 0; attempt < 90; attempt++) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(3000) }); if (response.ok) { console.log('Service ready.'); return; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Service did not become ready.');
})().catch(error => { console.error(error.message); process.exit(1); });
