<#
.SYNOPSIS
    Appends one quality-signal event to .claude/metrics/outcomes.jsonl.

.DESCRIPTION
    Called by /work right after a code-reviewer or tester verdict, and once
    when a task is archived. Read by the `retro` skill; never read by the
    router itself. Append-only, one line per event, never fails the caller -
    a write error is swallowed after one attempt.

.PARAMETER Ticket
    The task key, e.g. SN-012 or SN-012.3.

.PARAMETER Verdict
    pass | fail | reopened. "reopened" marks a task that came back after
    being archived; Size/Stage/Round/Blocking/Tests are omitted for it.

.EXAMPLE
    .\.claude\scripts\log-outcome.ps1 -Ticket SN-012 -Size M -Stage code-reviewer -Round 1 -Verdict fail -Blocking 2 -Tests fail
.EXAMPLE
    .\.claude\scripts\log-outcome.ps1 -Ticket SN-012 -Verdict reopened
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Ticket,
    [ValidateSet('S', 'M', 'L')][string]$Size,
    [ValidateSet('analyzer', 'dev-planner', 'developer', 'code-reviewer', 'tester', 'designer', 'architect')][string]$Stage,
    [int]$Round,
    [Parameter(Mandatory)][ValidateSet('pass', 'fail', 'reopened')][string]$Verdict,
    [int]$Blocking,
    [ValidateSet('pass', 'fail', 'n/a')][string]$Tests
)

$metrics = Join-Path $PSScriptRoot '..\metrics'
$log = Join-Path $metrics 'outcomes.jsonl'

$line = [ordered]@{
    ts      = (Get-Date).ToUniversalTime().ToString('o')
    ticket  = $Ticket
    size    = if ($Size) { $Size } else { $null }
    stage   = if ($Stage) { $Stage } else { $null }
    round   = if ($PSBoundParameters.ContainsKey('Round')) { $Round } else { $null }
    verdict = $Verdict
    blocking = if ($PSBoundParameters.ContainsKey('Blocking')) { $Blocking } else { $null }
    tests   = if ($Tests) { $Tests } else { 'n/a' }
}

try {
    New-Item -ItemType Directory -Force -Path $metrics | Out-Null
    ($line | ConvertTo-Json -Compress) | Add-Content -Path $log -Encoding utf8
} catch {
    Write-Warning "log-outcome: could not write $log - $($_.Exception.Message)"
}
