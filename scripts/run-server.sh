#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date '+%H:%M:%S')] Starting server..." >> /home/z/my-project/dev.log
  node .next/standalone/server.js >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date '+%H:%M:%S')] Server exited with code $EXIT_CODE, restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
