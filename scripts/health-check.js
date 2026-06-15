#!/usr/bin/env node
/**
 * health-check.js — Verify app/db are responding
 */

const http = require('http');

const checks = [
  { name: 'App', url: 'http://localhost:3003/' },
  { name: 'API', url: 'http://localhost:3100/' },
];

async function main() {
  let allOk = true;
  
  for (const check of checks) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(check.url, resolve);
        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
      });
      console.log(`✅ ${check.name}: HTTP ${res.statusCode}`);
    } catch (err) {
      console.error(`❌ ${check.name}: ${err.message}`);
      allOk = false;
    }
  }
  
  process.exit(allOk ? 0 : 1);
}

main();
