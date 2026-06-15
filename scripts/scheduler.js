#!/usr/bin/env node
/**
 * Schedule Runner — Reads schedules.json and runs tasks on schedule
 * 
 * Usage: node scripts/scheduler.js
 * 
 * Add ONE cron entry: * * * * * cd /opt/captainslog && node scripts/scheduler.js >> /var/log/captainslog-scheduler.log 2>&1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCHEDULES_FILE = path.join(__dirname, '..', 'schedules.json');
const STATE_FILE = path.join(__dirname, '..', 'runtime', 'scheduler-state.json');
const LOG_DIR = path.join(__dirname, '..', 'var', 'log');

// Ensure directories exist
fs.mkdirSync(path.join(__dirname, '..', 'runtime'), { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

const MS_PER_MINUTE = 60 * 1000;

// Parse cron expression into next-run check
function parseCron(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`Invalid cron expression: ${expr}`);
  
  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

// Check if cron expression matches current time
function cronMatches(cron, date) {
  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1;
  const dayOfWeek = date.getDay();
  
  return (
    fieldMatches(cron.minute, minute) &&
    fieldMatches(cron.hour, hour) &&
    fieldMatches(cron.dayOfMonth, dayOfMonth) &&
    fieldMatches(cron.month, month) &&
    fieldMatches(cron.dayOfWeek, dayOfWeek)
  );
}

function fieldMatches(pattern, value) {
  if (pattern === '*') return true;
  
  // Handle step values like */5
  if (pattern.startsWith('*/')) {
    const step = parseInt(pattern.slice(2));
    return value % step === 0;
  }
  
  // Handle comma-separated lists
  if (pattern.includes(',')) {
    return pattern.split(',').some(p => fieldMatches(p.trim(), value));
  }
  
  // Handle ranges like 1-5
  if (pattern.includes('-')) {
    const [start, end] = pattern.split('-').map(Number);
    return value >= start && value <= end;
  }
  
  return parseInt(pattern) === value;
}

// Check if a task is already running (within last 5 minutes)
function wasRecentlyRun(taskId, state) {
  const lastRun = state.lastRuns[taskId];
  if (!lastRun) return false;
  return (Date.now() - lastRun.timestamp) < 5 * MS_PER_MINUTE;
}

// Run a task
function runTask(task) {
  const timestamp = new Date().toISOString();
  const logFile = path.join(LOG_DIR, `${task.id}.log`);
  
  console.log(`[${timestamp}] Running task: ${task.id}`);
  
  try {
    const output = execSync(task.command, {
      cwd: task.cwd || process.cwd(),
      timeout: 5 * 60 * 1000, // 5 min timeout
      maxBuffer: 10 * 1024 * 1024,
    });
    
    fs.appendFileSync(logFile, `[${timestamp}] SUCCESS: ${output}\n`);
    return { success: true, output: output.toString() };
  } catch (err) {
    const errorMsg = err.stderr?.toString() || err.message || 'Unknown error';
    fs.appendFileSync(logFile, `[${timestamp}] ERROR: ${errorMsg}\n`);
    console.error(`[${timestamp}] Task ${task.id} failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

// Main loop
function main() {
  const schedules = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8'));
  
  // Load state
  let state = { lastRuns: {} };
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {}
  
  const now = new Date();
  
  for (const task of schedules.tasks) {
    if (!task.enabled) continue;
    
    try {
      const cron = parseCron(task.schedule);
      
      if (cronMatches(cron, now)) {
        if (wasRecentlyRun(task.id, state)) {
          continue; // Already ran this cycle
        }
        
        const result = runTask(task);
        
        // Update state
        state.lastRuns[task.id] = {
          timestamp: Date.now(),
          success: result.success,
        };
      }
    } catch (err) {
      console.error(`Error processing task ${task.id}:`, err.message);
    }
  }
  
  // Save state
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

main();
