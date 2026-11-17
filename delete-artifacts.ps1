# Lists all GitHub Actions artifacts for alxkio/vacate, then deletes them after confirmation.
# Requires the GitHub CLI (gh) and a prior `gh auth login`.

# Stop on the first error so a failed call is not silently ignored.
$ErrorActionPreference = 'Stop'

# Repository whose artifacts are listed and deleted.
$repo = 'alxkio/alcalc'

# Fetch every artifact (all pages) and keep id, name, size and expiry as objects.
$artifacts = gh api --paginate "repos/$repo/actions/artifacts" --jq '.artifacts[] | {id, name, size_in_bytes, created_at, expired}' |
    ForEach-Object { $_ | ConvertFrom-Json }

# Nothing to delete: report it and stop.
if (-not $artifacts) {
    Write-Host 'No artifacts found.'
    return
}

# Show the list first, with size in MB, so you can review what will be removed.
$artifacts | Select-Object id, name, @{ n = 'size_mb'; e = { [math]::Round($_.size_in_bytes / 1MB, 2) } }, created_at, expired | Format-Table -AutoSize

# Sum the sizes to show how much storage the deletion frees.
$totalMb = [math]::Round(($artifacts | Measure-Object size_in_bytes -Sum).Sum / 1MB, 2)
Write-Host "$($artifacts.Count) artifact(s), $totalMb MB in total."

# Ask for explicit confirmation; anything other than 'yes' aborts without deleting.
$answer = Read-Host 'Type yes to delete all of them'
if ($answer -ne 'yes') {
    Write-Host 'Cancelled. Nothing was deleted.'
    return
}

# Delete each artifact by id through the REST API.
foreach ($artifact in $artifacts) {
    Write-Host "Deleting $($artifact.id) ($($artifact.name))..."
    gh api -X DELETE "repos/$repo/actions/artifacts/$($artifact.id)"
}

# Quota usage can take 6-12 hours to update after deletion.
Write-Host 'Done. The storage quota may take several hours to refresh.'
