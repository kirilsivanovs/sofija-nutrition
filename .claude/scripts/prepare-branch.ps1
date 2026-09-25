<#
.SYNOPSIS
    Creates the branch for a task in this repo, off the real default branch.

.DESCRIPTION
    The scripted form of .claude/agents/branch-preparer.md, run by /work at gate 2.
    Refuses a dirty working tree, detects the default branch from origin/HEAD
    (falling back to whichever single one of origin/main / origin/master exists),
    fetches, then checks out the branch if it already exists locally or creates it
    off origin/<default> if it does not.

    With -Base the new branch is created off origin/<base> instead, so a task can
    stack on another task's branch that is not merged yet. The base must exist on
    origin after the fetch; it is never created here. An existing local branch is
    checked out as it is, whatever the base.

    It never pushes, commits, merges, rebases, stashes, resets or deletes, and it
    does not touch the task file: the router records `branch`, `status` and the
    log line itself from this script's output.

    -Preview does the read-only half only (no fetch, no checkout).

.PARAMETER Id
    The task id, e.g. SN-012.

.PARAMETER Name
    The confirmed branch name, e.g. sn-012-meals-api-auth. Lowercase, hyphenated,
    starting with the lowercased id.

.PARAMETER Base
    Optional branch on origin to create the new branch off. Omitted: the default branch.

.EXAMPLE
    .\.claude\scripts\prepare-branch.ps1 -Id SN-012 -Name sn-012-meals-api-auth -Preview

.NOTES
    Exit code: 0 ready, 2 bad arguments or refused.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Id,
    [Parameter(Mandatory = $true)][string]$Name,
    [string]$Base,
    [switch]$Preview
)

$ErrorActionPreference = 'Continue'
# A credential prompt from fetch would hang a non-interactive shell; fail instead.
$env:GIT_TERMINAL_PROMPT = '0'

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Invoke-Git {
    param([string[]]$GitArgs)
    # The checkout may be owned by another SID (OneDrive / Entra ID profile moves);
    # scoping safe.directory to this one call avoids editing global git config.
    $output = & git -c "safe.directory=$($repo -replace '\\','/')" -C $repo @GitArgs 2>&1
    [pscustomobject]@{
        ExitCode = $LASTEXITCODE
        Text     = (($output | ForEach-Object { "$_" }) -join "`n").Trim()
    }
}

function Stop-With {
    param([string]$Message)
    Write-Output "Refused: $Message"
    exit 2
}

$idLower = $Id.Trim().ToLowerInvariant()
if ($Name -cnotmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or -not $Name.StartsWith("$idLower-")) {
    Stop-With "branch name '$Name' must be lowercase-hyphenated and start with '$idLower-'."
}
if ($Base) {
    $Base = $Base.Trim() -replace '^origin/', ''
    if ($Base -notmatch '^[A-Za-z0-9._/-]+$') { Stop-With "base '$Base' is not a plain branch name." }
}

if (-not (Test-Path (Join-Path $repo '.git'))) { Stop-With "not a git repo: $repo" }

# Switching branches over uncommitted work is how work gets lost.
$status = Invoke-Git @('status', '--porcelain')
if ($status.ExitCode -ne 0) { Stop-With "git status failed: $($status.Text)" }
$current = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).Text
$exists = (Invoke-Git @('rev-parse', '--verify', '--quiet', "refs/heads/$Name")).ExitCode -eq 0
$dirty = if ($status.Text) { "$(@($status.Text -split "`n").Count) uncommitted change(s) on $current" } else { $null }

# Already on the task's branch with its own work in progress: nothing to switch.
if ($current -eq $Name) {
    Write-Output "$Name | already checked out$(if ($dirty) { " - $dirty (this task's own work)" })"
    Write-Output ''
    Write-Output "branch: $Name"
    exit 0
}
if ($dirty) { Stop-With "$dirty; not switching branches. Commit or move that work first." }

if ($Base) {
    $baseBranch = $Base
}
else {
    $head = Invoke-Git @('symbolic-ref', '--short', 'refs/remotes/origin/HEAD')
    if ($head.ExitCode -eq 0 -and $head.Text -match '^origin/(.+)$') {
        $baseBranch = $Matches[1]
    }
    else {
        $remotes = Invoke-Git @('branch', '-r', '--list', 'origin/main', 'origin/master')
        $found = @($remotes.Text -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^origin/(main|master)$' } | ForEach-Object { $_ -replace '^origin/', '' })
        if ($found.Count -ne 1) { Stop-With 'cannot determine the default branch (no origin/HEAD, and not exactly one of origin/main, origin/master)' }
        $baseBranch = $found[0]
    }
}

if ($Preview) {
    $what = if ($exists) { 'would check out existing' } else { 'would create' }
    $line = "$Name | off origin/$baseBranch | $what - currently on $current, tree clean"
    if ($Base -and (Invoke-Git @('rev-parse', '--verify', '--quiet', "refs/remotes/origin/$baseBranch")).ExitCode -ne 0) {
        $line += "; origin/$baseBranch not in local refs yet (the run fetches, then refuses if still absent)"
    }
    Write-Output $line
    exit 0
}

$fetch = Invoke-Git @('fetch', 'origin', '--quiet', '--prune')
if ($fetch.ExitCode -ne 0) { Stop-With "git fetch failed: $($fetch.Text)" }

if ($exists) {
    $co = Invoke-Git @('checkout', $Name)
    if ($co.ExitCode -ne 0) { Stop-With "checkout failed: $($co.Text)" }
    $outcome = 'existed'
}
else {
    if ((Invoke-Git @('rev-parse', '--verify', '--quiet', "refs/remotes/origin/$baseBranch")).ExitCode -ne 0) {
        Stop-With "base origin/$baseBranch does not exist after fetch"
    }
    $co = Invoke-Git @('checkout', '-b', $Name, "origin/$baseBranch")
    if ($co.ExitCode -ne 0) { Stop-With "checkout -b failed: $($co.Text)" }
    $outcome = 'created'
}

Write-Output "$Name | off origin/$baseBranch | $outcome"
Write-Output ''
Write-Output "branch: $Name"
exit 0
