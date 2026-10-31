import os
import sys
import time
import subprocess

def daemonize():
    try:
        if os.fork() > 0:
            sys.exit(0)
    except OSError:
        sys.exit(1)
    os.setsid()
    try:
        if os.fork() > 0:
            sys.exit(0)
    except OSError:
        sys.exit(1)
    sys.stdout.flush()
    sys.stderr.flush()
    devnull = open('/dev/null', 'r')
    logfile = open('/home/z/my-project/dev.log', 'a')
    os.dup2(devnull.fileno(), 0)
    os.dup2(logfile.fileno(), 1)
    os.dup2(logfile.fileno(), 2)

def main():
    daemonize()
    while True:
        try:
            logfile = open('/home/z/my-project/dev.log', 'a')
            logfile.write(f"\n[{time.strftime('%H:%M:%S')}] Starting server...\n")
            logfile.flush()
            logfile.close()
            # Use standalone server (output: standalone is enabled in next.config.ts)
            proc = subprocess.Popen(
                ['node', '/home/z/my-project/.next/standalone/server.js'],
                cwd='/home/z/my-project',
                stdout=open('/home/z/my-project/dev.log', 'a'),
                stderr=subprocess.STDOUT,
                env={
                    **os.environ,
                    'NODE_ENV': 'production',
                    'HOSTNAME': '0.0.0.0',
                    'PORT': '3000',
                    'DATABASE_URL': 'file:/home/z/my-project/db/custom.db',
                },
            )
            proc.wait()
            logfile = open('/home/z/my-project/dev.log', 'a')
            logfile.write(f"[{time.strftime('%H:%M:%S')}] Server exited (code {proc.returncode}), restarting in 3s...\n")
            logfile.flush()
            logfile.close()
        except Exception as e:
            logfile = open('/home/z/my-project/dev.log', 'a')
            logfile.write(f"[{time.strftime('%H:%M:%S')}] Error: {e}\n")
            logfile.close()
        time.sleep(3)

if __name__ == '__main__':
    main()
