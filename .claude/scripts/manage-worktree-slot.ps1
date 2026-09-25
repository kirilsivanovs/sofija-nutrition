<#
.SYNOPSIS
    Creates, resets or removes a persistent git worktree "slot" for parallel work sessions.

.DESCRIPTION
    Slots live at ../sofija-nutrition-astro-wt/<n>, a sibling to this checkout, each a
    git worktree of this repo. A slot's .claude/tasks is junctioned back to the main
    checkout so every slot shares one task board; .claude/metrics is deliberately not
    junctioned (usage-log.js already finds the main checkout on its own).

    -Action Create adds the worktree detached at origin/main, junctions .claude/tasks,
    copies .claude/settings.local.json if present, and runs npm ci inside the slot.

    -Action Reset returns an existing slot to detached origin/main and deletes the
    now-merged local branch named by -Branch, ready for the next task.

    -Action Remove removes the .claude/tasks junction (target untouched) and the git
    worktree itself, leaving the main checkout's own .claude/tasks untouched.

.PARAMETER Action
    Create, Reset or Remove.

.PARAMETER Slot
    The slot number, e.g. 9 for ../sofija-nutrition-astro-wt/9.

.PARAMETER Branch
    Required for -Action Reset: the local branch to delete after switching to detached
    origin/main.

.EXAMPLE
    .\.claude\scripts\manage-worktree-slot.ps1 -Action Create -Slot 9

.NOTES
    Exit code: 0 success, 2 bad arguments or refused.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateSet('Create', 'Reset', 'Remove')][string]$Action,
    [Parameter(Mandatory = $true)][int]$Slot,
    [string]$Branch
)

$ErrorActionPreference = 'Continue'
# A credential prompt from fetch would hang a non-interactive shell; fail instead.
$env:GIT_TERMINAL_PROMPT = '0'

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$slotPath = Join-Path (Split-Path $repo -Parent) "sofija-nutrition-astro-wt\$Slot"

function Invoke-Git {
    param([string]$WorkDir, [string[]]$GitArgs)
    # The checkout may be owned by another SID (OneDrive / Entra ID profile moves);
    # scoping safe.directory to this one call avoids editing global git config.
    $output = & git -c "safe.directory=$($WorkDir -replace '\\','/')" -C $WorkDir @GitArgs 2>&1
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

switch ($Action) {
    'Create' {
        if (Test-Path $slotPath) { Stop-With "slot already exists; use Reset or Remove" }

        $add = Invoke-Git -WorkDir $repo -GitArgs @('worktree', 'add', $slotPath, 'origin/main', '--detach')
        if ($add.ExitCode -ne 0) { Stop-With "git worktree add failed: $($add.Text)" }

        New-Item -ItemType Junction -Path (Join-Path $slotPath '.claude\tasks') -Target (Join-Path $repo '.claude\tasks') -Force | Out-Null

        $settingsSource = Join-Path $repo '.claude\settings.local.json'
        if (Test-Path $settingsSource) {
            Copy-Item -Path $settingsSource -Destination (Join-Path $slotPath '.claude\settings.local.json') -Force
        }

        Push-Location $slotPath
        npm ci
        $npmExitCode = $LASTEXITCODE
        Pop-Location
        if ($npmExitCode -ne 0) { Stop-With "npm ci failed in $slotPath (exit $npmExitCode); worktree and junction left in place for inspection" }

        Write-Output "slot: $Slot"
        Write-Output "path: $slotPath"
        Write-Output "branch: (detached at origin/main)"
        exit 0
    }
    'Reset' {
        if (-not $Branch) { Stop-With "-Branch is required for -Action Reset" }
        if (-not (Test-Path $slotPath)) { Stop-With "slot does not exist: $slotPath" }

        $fetch = Invoke-Git -WorkDir $slotPath -GitArgs @('fetch', 'origin', '--quiet', '--prune')
        if ($fetch.ExitCode -ne 0) { Stop-With "git fetch failed: $($fetch.Text)" }

        $switch = Invoke-Git -WorkDir $slotPath -GitArgs @('switch', '--detach', 'origin/main')
        if ($switch.ExitCode -ne 0) { Stop-With "git switch failed: $($switch.Text)" }

        $delete = Invoke-Git -WorkDir $slotPath -GitArgs @('branch', '-d', $Branch)
        if ($delete.ExitCode -ne 0) {
            Write-Output "branch delete refused for $Branch - $($delete.Text)"
        }
        else {
            Write-Output "branch deleted: $Branch"
        }

        Write-Output "slot: $Slot"
        Write-Output "branch: (detached at origin/main)"
        exit 0
    }
    'Remove' {
        if (-not (Test-Path $slotPath)) { Stop-With "slot does not exist: $slotPath" }

        $junction = Join-Path $slotPath '.claude\tasks'
        if (Test-Path $junction) {
            # cmd /c rmdir removes only the junction reparse point, never recursing into
            # the target; Remove-Item can recurse into the target on some PowerShell versions.
            cmd /c rmdir "$junction" | Out-Null
        }

        $remove = Invoke-Git -WorkDir $repo -GitArgs @('worktree', 'remove', $slotPath)
        if ($remove.ExitCode -ne 0) { Stop-With "git worktree remove failed: $($remove.Text)" }

        $prune = Invoke-Git -WorkDir $repo -GitArgs @('worktree', 'prune')
        if ($prune.ExitCode -ne 0) { Stop-With "git worktree prune failed: $($prune.Text)" }

        # git worktree remove only clears tracked content and git's own metadata; gitignored
        # content (e.g. node_modules from Create's npm ci) is left behind on disk.
        if (Test-Path $slotPath) {
            Remove-Item -Recurse -Force $slotPath
        }

        Write-Output "slot: $Slot"
        Write-Output "removed: $slotPath"
        exit 0
    }
}
