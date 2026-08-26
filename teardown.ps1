<#
.SYNOPSIS
    Tears down the ScubaGear Analyzer Azure deployment.

.PARAMETER ResourceGroupName
    The resource group to delete.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName
)

$ErrorActionPreference = "Stop"

Write-Host "`n▶ Deleting resource group: $ResourceGroupName" -ForegroundColor Cyan
az group delete --name $ResourceGroupName --yes --no-wait
Write-Host "  ✓ Resource group deletion initiated (async)" -ForegroundColor Green
Write-Host "`nDone." -ForegroundColor Green
