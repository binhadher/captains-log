#!/bin/bash
set -a
source /opt/captainslog/.env.local
set +a
exec node /opt/captainslog/.next/standalone/server.js
