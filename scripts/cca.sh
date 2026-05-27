#!/bin/bash
# claude-code-alert dispatcher (macOS)
set +e

CLAUDE_DIR="$HOME/.claude"
DISABLED="$CLAUDE_DIR/notifications.disabled"
CONFIG="$CLAUDE_DIR/cca-config.json"

[ -f "$DISABLED" ] && exit 0
[ ! -f "$CONFIG" ] && exit 0

# stdin → JSON capture
STDIN_JSON=$(cat)
[ -z "$STDIN_JSON" ] && exit 0

# event + stdin message extraction via python3 (always present on macOS)
# STDIN_JSON 을 환경변수로 전달 — heredoc 변수 치환 시 백슬래시/따옴표 깨짐 회피
EVENT_LINE=$(STDIN_JSON="$STDIN_JSON" python3 - <<'PY' 2>/dev/null
import os, json
try:
    d = json.loads(os.environ.get("STDIN_JSON", ""))
    print(d.get("hook_event_name", ""))
    print((d.get("message") or "").replace("\n", " "))
except Exception:
    pass
PY
)

EVENT=$(printf '%s\n' "$EVENT_LINE" | sed -n '1p')
STDIN_MSG=$(printf '%s\n' "$EVENT_LINE" | sed -n '2p')
[ -z "$EVENT" ] && exit 0

# config parse → enabled / sound / message
RESULT=$(python3 - "$CONFIG" "$EVENT" "$STDIN_MSG" <<'PY' 2>/dev/null
import sys, json, os
cfg_path, event, stdin_msg = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    with open(cfg_path) as f:
        cfg = json.load(f)
    ev = cfg.get("events", {}).get(event)
    if not ev or not ev.get("enabled"):
        sys.exit(0)
    sound = ev.get("sound") or "default"
    if sound == "default":
        sound = cfg.get("defaults", {}).get("sound_mac", "")
    else:
        sound = os.path.expanduser(f"~/.claude/sounds/{sound}")
    message = ev.get("message") or stdin_msg or event
    print(sound)
    print(message)
except Exception:
    sys.exit(0)
PY
)
[ -z "$RESULT" ] && exit 0

SOUND=$(printf '%s\n' "$RESULT" | sed -n '1p')
MSG=$(printf '%s\n' "$RESULT" | sed -n '2p')

# ── Toast (osascript, returns quickly) ──
# AppleScript 문자열 안에서 백슬래시·큰따옴표 둘 다 escape, 개행 제거
SAFE_MSG=$(printf '%s' "$MSG" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' | tr -d '\r\n')
osascript -e "display notification \"$SAFE_MSG\" with title \"Claude Code\"" >/dev/null 2>&1

# ── Sound (background) ──
if [ -n "$SOUND" ] && [ -f "$SOUND" ]; then
    (afplay "$SOUND" >/dev/null 2>&1 &)
fi

exit 0
