# claude-code-alert (`cca`)

[Claude Code](https://claude.com/claude-code) hook 이벤트에 사운드 + 토스트 알림을 띄워주는 크로스플랫폼 라이브러리. Windows / macOS 지원.

설치하면 `cca` 명령으로 사용합니다.

## 설치

전역 설치 (권장):

```bash
npm install -g claude-code-alert
cca init
```

또는 일회성 실행:

```bash
npx claude-code-alert init
```

`init`은 대화형 프롬프트로 다음을 수행합니다.

1. `~/.claude/settings.json`에 이미 등록된 hook을 감지하고 충돌 처리 방식을 묻습니다.
2. 알림 받을 이벤트를 고릅니다 (Stop, Notification, SessionEnd, …).
3. 원하면 이벤트별로 사운드와 메시지를 따로 설정할 수 있습니다.
4. 변경 내용(diff)을 미리 보여주고, 확인을 받은 뒤에만 적용합니다.
5. `settings.json`을 `~/.claude/cca-backups/`에 자동 백업합니다 (최근 3개 유지).

## 명령어

| 명령 | 동작 |
|---------|---------|
| `cca init`      | hook 설치 / 재설정 (대화형) |
| `cca disable`   | 알림 음소거 (`~/.claude/notifications.disabled` 생성) |
| `cca enable`    | 음소거 해제 |
| `cca uninstall` | 우리 hook만 제거 (사용자가 직접 등록한 hook은 손대지 않음) |

## 동작 원리

- 작은 dispatcher 스크립트를 `~/.claude/scripts/cca.{ps1,sh}`에 배치하고, 설정값은 `~/.claude/cca-config.json`에 저장합니다.
- `settings.json`에는 각 이벤트마다 dispatcher를 가리키는 명령 한 줄만 추가됩니다.
- hook이 발화되면 dispatcher가 `cca-config.json`을 읽고 그에 맞춰 토스트와 사운드를 띄웁니다.

→ 알림 사운드나 메시지를 바꾸고 싶을 때 `cca-config.json`만 수정하면 됩니다. `settings.json`을 다시 건드릴 일이 없습니다.

## 사운드 커스터마이즈

`cca init` 중 "Custom file..."을 고르고 경로를 입력하세요.

- **Windows**: `.wav` 만 허용
- **macOS**: `.wav`, `.aiff`, `.mp3`, `.m4a`, `.caf` 허용

입력한 파일은 `~/.claude/sounds/`로 복사되고 `cca-config.json`에 파일명으로 기록됩니다.

## 충돌 처리

`cca init`이 이미 같은 이벤트에 다른 hook이 등록되어 있는 걸 발견하면 세 가지 선택지를 줍니다.

- **Append** (기본): 기존 hook과 우리 hook이 둘 다 발화. 알림이 두 번 뜰 수 있습니다.
- **Skip**: 기존 hook 유지, 그 이벤트에는 우리 hook 추가하지 않음.
- **Abort**: 아무 변경도 하지 않고 종료.

hook 식별은 `command` 문자열 안의 dispatcher 경로를 기준으로 합니다. **우리가 만들지 않은 hook은 절대 손대지 않습니다.**

## 제거

```bash
cca uninstall
```

`command`가 우리 dispatcher를 가리키는 hook만 골라서 제거합니다. 다른 hook은 그대로 남습니다. dispatcher 스크립트, 설정 파일, 사용자가 등록한 사운드 파일도 함께 지울지 선택할 수 있습니다.

## 플랫폼 요구사항

- **Windows**: Windows 10 / 11, PowerShell 5.1 (기본 탑재). WinRT Toast API + `Media.SoundPlayer` 사용.
- **macOS**: `osascript`, `afplay` 사용 (둘 다 기본 탑재). Notification Center로 표시.
- **Node**: 18 이상 (설치 시점에만 필요. hook 발화 시에는 Node가 관여하지 않음)

## 트러블슈팅

| 증상 | 확인 |
|---------|-------|
| 알림이 안 뜸 | `~/.claude/notifications.disabled`가 있나요? `cca enable` 실행하세요. |
| 알림이 두 번 뜸 | 같은 이벤트에 다른 hook이 있는 상태에서 "append"를 선택한 경우입니다. |
| 토스트는 뜨는데 사운드가 안 남 | `cca-config.json`의 사운드 경로가 실제로 존재하나요? Windows에서는 `.wav`만 재생됩니다. |
| `settings.json`이 깨졌어요 | `~/.claude/cca-backups/settings.YYYYMMDD-HHmm.json`에서 복구하세요. |

## 라이선스

MIT
