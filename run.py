"""
TripCraft (PackagePro) - Unified Concurrent Runner
Initializes both FastAPI Backend (port 8000) and React/Vite Frontend (port 5173) in a single command.

Usage:
    python run.py
    or: npm run dev (from root)

Both services run concurrently with live output streaming and clean Ctrl+C shutdown.
"""

import os
import sys
import time
import signal
import subprocess
import threading
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

processes = []

def run_process(cmd, cwd, prefix, color_code):
    """Run a process, streaming stdout and stderr with a colored prefix."""
    is_windows = sys.platform == "win32"
    shell = is_windows and isinstance(cmd, str)
    
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=shell,
        )
        processes.append(proc)
        
        for line in iter(proc.stdout.readline, ''):
            if line:
                # Format: [PREFIX] line
                sys.stdout.write(f"\033[{color_code}m[{prefix}]\033[0m {line}")
                sys.stdout.flush()
                
        proc.wait()
    except Exception as e:
        print(f"\033[91m[{prefix} ERROR]\033[0m {e}")

def kill_process_tree(proc):
    """Safely terminate a process and all its child workers."""
    if proc.poll() is not None:
        return
    try:
        if sys.platform == "win32":
            # On Windows, taskkill /F /T kills entire process tree
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False
            )
        else:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
    except Exception:
        pass

def shutdown():
    """Terminate both backend and frontend servers cleanly."""
    print("\n\033[93m[TripCraft] Shutting down backend and frontend servers...\033[0m")
    for p in processes:
        kill_process_tree(p)
    print("\033[92m[TripCraft] All servers stopped cleanly. Have a great day!\033[0m")

def main():
    # Print welcome banner
    print("\033[92m" + "=" * 64 + "\033[0m")
    print("\033[92m      TripCraft (PackagePro) - Unified Development Server\033[0m")
    print("\033[92m" + "=" * 64 + "\033[0m")
    print(f"  \033[96mBackend API:\033[0m   http://localhost:8000 (Swagger: http://localhost:8000/docs)")
    print(f"  \033[95mFrontend UI:\033[0m   http://localhost:5173")
    print(f"  \033[93mPress Ctrl+C at any time to stop both servers cleanly.\033[0m")
    print("\033[92m" + "=" * 64 + "\033[0m\n")

    # Command definitions
    python_bin = sys.executable
    backend_cmd = [
        python_bin, "-m", "uvicorn", "src.main:app",
        "--reload", "--host", "0.0.0.0", "--port", "8000"
    ]

    is_windows = sys.platform == "win32"
    frontend_cmd = "npm.cmd run dev" if is_windows else ["npm", "run", "dev"]

    # Start threads for concurrent execution
    backend_thread = threading.Thread(
        target=run_process,
        args=(backend_cmd, BACKEND_DIR, "BACKEND", "96"),  # Cyan
        daemon=True
    )
    frontend_thread = threading.Thread(
        target=run_process,
        args=(frontend_cmd, FRONTEND_DIR, "FRONTEND", "95"),  # Magenta
        daemon=True
    )

    backend_thread.start()
    frontend_thread.start()

    # Handle Ctrl+C and exit signals
    def handle_signal(sig, frame):
        shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    if not is_windows:
        signal.signal(signal.SIGTERM, handle_signal)

    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
            # Check if any process unexpectedly died
            for p in processes:
                if p.poll() is not None and p.poll() != 0:
                    pass
    except KeyboardInterrupt:
        shutdown()
        sys.exit(0)

if __name__ == "__main__":
    main()
