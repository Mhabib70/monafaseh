#!/bin/bash
# Daemon script for Monafaseh Next.js server
# Uses double-fork to properly detach from controlling terminal

cd /home/z/my-project

# Kill any existing instance
pkill -f "next start" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start with nohup + double fork
nohup bash -c '
  exec /home/z/my-project/node_modules/.bin/next start -p 3000
' > /home/z/my-project/dev.log 2>&1 < /dev/null &

# Disown the process
disown
PID=$!
echo "Started server with PID: $PID"

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s --max-time 2 "http://localhost:3000/api/health" > /dev/null 2>&1; then
    echo "Server is ready after ${i} seconds"
    break
  fi
  sleep 1
done

# Final check
if ps -p $PID > /dev/null 2>&1; then
  echo "✓ Server process is alive"
else
  echo "✗ Server process died"
fi
