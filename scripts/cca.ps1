# claude-code-alert dispatcher (Windows)
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
[Console]::InputEncoding  = [Text.Encoding]::UTF8
$OutputEncoding           = [Text.Encoding]::UTF8

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $stdin = $raw | ConvertFrom-Json -ErrorAction Stop

    $event = $stdin.hook_event_name
    if ([string]::IsNullOrWhiteSpace($event)) { exit 0 }

    $claudeDir   = Join-Path $env:USERPROFILE '.claude'
    $disabledFile = Join-Path $claudeDir 'notifications.disabled'
    if (Test-Path $disabledFile) { exit 0 }

    $configFile = Join-Path $claudeDir 'cca-config.json'
    if (-not (Test-Path $configFile)) { exit 0 }
    $cfg = Get-Content -Raw $configFile | ConvertFrom-Json -ErrorAction Stop

    $eventCfg = $cfg.events.$event
    if ($null -eq $eventCfg -or -not $eventCfg.enabled) { exit 0 }

    # sound resolution
    $sound = if ($eventCfg.sound -eq 'default') {
        $cfg.defaults.sound_win
    } else {
        Join-Path $claudeDir 'sounds' $eventCfg.sound
    }

    # message resolution
    $message = if ($eventCfg.message) { $eventCfg.message }
               elseif ($stdin.message) { $stdin.message }
               else { $event }

    # ── Toast (sync, returns quickly) ──
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType=WindowsRuntime] | Out-Null

    $xmlTitle   = [System.Security.SecurityElement]::Escape('Claude Code')
    $xmlMessage = [System.Security.SecurityElement]::Escape($message)
    $xml = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>$xmlTitle</text>
      <text>$xmlMessage</text>
    </binding>
  </visual>
  <actions>
    <action activationType="system" arguments="dismiss" content="OK"/>
  </actions>
</toast>
"@
    $doc = New-Object Windows.Data.Xml.Dom.XmlDocument
    $doc.LoadXml($xml)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($doc)
    $appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)

    # ── Sound (background, fire-and-forget) ──
    if ($sound -and (Test-Path $sound)) {
        # 사운드 경로의 작은따옴표를 PowerShell single-quote escape ('') 처리
        $soundEsc = $sound -replace "'", "''"
        Start-Process -WindowStyle Hidden -FilePath 'powershell.exe' -ArgumentList @(
            '-NoProfile', '-Command',
            "(New-Object Media.SoundPlayer '$soundEsc').PlaySync()"
        ) | Out-Null
    }
} catch {
    # silent — must never leak to Claude Code output
}
exit 0
