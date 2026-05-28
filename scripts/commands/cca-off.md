Claude Code 알림을 음소거합니다. 아래에서 당신 OS에 맞는 한 줄을 실행해 빈 플래그 파일을 만들어 주세요.

- Windows (PowerShell):
  New-Item -ItemType File -Path "$env:USERPROFILE\.claude\notifications.disabled" -Force | Out-Null
- macOS / Linux:
  touch "$HOME/.claude/notifications.disabled"

규칙:
- 파일이 이미 존재해도 그대로 두면 됩니다(에러 아님).
- 작업 후 한 줄로만 답하세요. 예: "알림 껐어요." 또는 "이미 꺼져 있어요."
- 다른 부연설명이나 다음 단계 제안은 하지 마세요.
