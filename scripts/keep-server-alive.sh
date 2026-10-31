#!/bin/bash
# Keep the Monafaseh server alive — restart if it dies.
# This script runs in an infinite loop, checking every 10 seconds
# if the server is responding on port 3000. If not, it starts a new one.

cd /home/z/my-project

LOG_FILE="/home/z/my-project/dev.log"

start_server() {
  echo "[$(date)] Starting server..." >> "$LOG_FILE"
  # Kill any existing server first (in case of EADDRINUSE)
  pkill -f "standalone/server.js" 2>/dev/null
  sleep 2
  # Use setsid to fully detach from any controlling terminal
  setsid bash -c '
    cd /home/z/my-project
    exec node .next/standalone/server.js
  ' > "$LOG_FILE" 2>&1 < /dev/null &
  echo "[$(date)] Server started, PID=$!" >> "$LOG_FILE"
  sleep 5
}

is_alive() {
  # Check if curl can reach the server within 3 seconds
  curl -s --max-time 3 "http://localhost:3000/api/ads/serve?slot=health-check" -o /dev/null 2>/dev/null
  return $?
}

# Initial start
start_server
sleep 5

# Infinite watchdog loop
while true; do
  if ! is_alive; then
    echo "[$(date)] Server not responding — restarting..." >> "$LOG_FILE"
    pkill -f "standalone/server.js" 2>/dev/null
    sleep 2
    start_server
    sleep 5
  fi
  sleep 10
done
