Claude Code 알림 음소거를 해제합니다. 아래에서 당신 OS에 맞는 한 줄을 실행해 플래그 파일을 삭제해 주세요.

- Windows (PowerShell):
  Remove-Item "$env:USERPROFILE\.claude\notifications.disabled" -ErrorAction SilentlyContinue
- macOS / Linux:
  rm -f "$HOME/.claude/notifications.disabled"

규칙:
- 파일이 없어도 에러가 아닙니다.
- 작업 후 한 줄로만 답하세요. 예: "알림 켰어요." 또는 "이미 켜져 있어요."
- 다른 부연설명이나 다음 단계 제안은 하지 마세요.
