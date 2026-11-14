"""
SocioTrack Application Package.
Guarantees clean bidirectional module resolution across standalone scripts,
nested runners, and pytest test harnesses.
"""
import sys
import os

_app_dir = os.path.abspath(os.path.dirname(__file__))
_backend_dir = os.path.abspath(os.path.join(_app_dir, ".."))
_repo_dir = os.path.abspath(os.path.join(_backend_dir, ".."))

for _p in (_backend_dir, _repo_dir):
    if _p not in sys.path:
        sys.path.insert(0, _p)
