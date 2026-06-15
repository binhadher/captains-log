#!/usr/bin/env node
/**
 * backup-db.js — Dump PostgreSQL database, gzip it
 * Called by scheduler.js via schedules.json
 * 
 * Reads DB credentials from /etc/postgrest.conf
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', 'var', 'backups', 'db');
fs.mkdirSync(BACKUP_DIR, { recursive: true });

function getDbUri() {
  const conf = fs.readFileSync('/etc/postgrest.conf', 'utf-8');
  const match = conf.match(/db-uri\s*=\s*\"(.+)\"/);
  if (!match) throw new Error('Could not find db-uri in /etc/postgrest.conf');
  // Convert postgres:// to postgresql:// (pg_dump needs postgresql://)
  return match[1].replace('postgres://', 'postgresql://');
}

function main() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `captainslog-${dateStr}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  const dbUri = getDbUri();
  console.log(`Backing up database to ${filepath}`);
  
  execSync(
    `pg_dump "${dbUri}" | gzip > "${filepath}"`,
    { timeout: 120000, shell: '/bin/bash' }
  );
  
  const stats = fs.statSync(filepath);
  console.log(`Backup complete: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  
  // Show file
  console.log(`Saved to: ${filepath}`);
}

main();
