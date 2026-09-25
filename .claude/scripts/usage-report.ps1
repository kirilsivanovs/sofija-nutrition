<#
.SYNOPSIS
    Summarises .claude/metrics/usage.jsonl by ticket and by agent type.

.DESCRIPTION
    Reads the lines written by .claude/hooks/usage-log.js and prints two tables:
    per ticket and per agent_type, each with runs, turns, summed tokens, the
    estimated cost and the cache-hit ratio, cache_read / (cache_read + cache
    writes + input). Read-only.

.PARAMETER Ticket
    Only lines for this ticket. A parent key also matches its sub-tasks
    (SN-012 matches SN-012.3).

.PARAMETER Since
    Only lines written on or after this date/time (e.g. 2026-09-24).

.EXAMPLE
    .\.claude\scripts\usage-report.ps1 -Ticket SN-012 -Since 2026-09-24
#>
[CmdletBinding()]
param(
    [string]$Ticket,
    [datetime]$Since
)

$log = Join-Path $PSScriptRoot '..\metrics\usage.jsonl'
if (-not (Test-Path $log)) {
    Write-Output "No usage log yet: $log"
    exit 0
}

$rows = @(Get-Content $log -Encoding UTF8 | Where-Object { $_.Trim() } | ForEach-Object {
        try { $_ | ConvertFrom-Json } catch { Write-Warning "skipped unreadable line: $($_.Exception.Message)" }
    })

if ($Ticket) {
    $t = $Ticket.Trim().ToUpperInvariant()
    $rows = @($rows | Where-Object { $_.ticket -and ($_.ticket -eq $t -or $_.ticket.StartsWith("$t.")) })
}
if ($PSBoundParameters.ContainsKey('Since')) {
    $rows = @($rows | Where-Object { [datetime]$_.ts -ge $Since })
}
if ($rows.Count -eq 0) {
    Write-Output 'No matching lines.'
    exit 0
}

function Get-Summary {
    param([object[]]$Group, [string]$Label)
    $sum = { param($f) ($Group | ForEach-Object { [double]$_.tokens.$f } | Measure-Object -Sum).Sum }
    $inp = & $sum 'input'
    $w5 = & $sum 'cache_write_5m'
    $w1 = & $sum 'cache_write_1h'
    $read = & $sum 'cache_read'
    $out = & $sum 'output'
    $denominator = $read + $w5 + $w1 + $inp
    [pscustomobject]@{
        Key        = $Label
        Runs       = $Group.Count
        Turns      = ($Group | ForEach-Object { [int]$_.turns } | Measure-Object -Sum).Sum
        Input      = [long]$inp
        Write5m    = [long]$w5
        Write1h    = [long]$w1
        CacheRead  = [long]$read
        Output     = [long]$out
        EstUsd     = [math]::Round((($Group | ForEach-Object { [double]$_.est_usd } | Measure-Object -Sum).Sum), 2)
        CacheHit   = if ($denominator -gt 0) { '{0:P1}' -f ($read / $denominator) } else { '-' }
    }
}

function Write-Table {
    param([string]$Title, [scriptblock]$KeyOf)
    Write-Output "== $Title"
    $rows | Group-Object -Property $KeyOf | ForEach-Object { Get-Summary $_.Group $_.Name } |
        Sort-Object EstUsd -Descending | Format-Table -AutoSize | Out-String -Width 200 | Write-Output
}

Write-Table 'By ticket' { if ($_.ticket) { $_.ticket } else { '(none)' } }
Write-Table 'By agent type' { if ($_.agent_type) { $_.agent_type } else { '(unknown)' } }
Write-Output (Get-Summary $rows 'TOTAL' | Format-Table -AutoSize | Out-String -Width 200)
