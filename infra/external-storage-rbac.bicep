// ============================================================
// External Storage Account — RBAC Role Assignment
// Grants Storage Blob Data Reader to a function app's
// Managed Identity on an external storage account.
// ============================================================

targetScope = 'resourceGroup'

@description('Name of the external storage account')
param storageAccountName string

@description('Principal ID of the function app Managed Identity')
param functionAppPrincipalId string

var storageBlobDataReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1')

resource externalStorage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(externalStorage.id, functionAppPrincipalId, storageBlobDataReaderRoleId)
  scope: externalStorage
  properties: {
    principalId: functionAppPrincipalId
    roleDefinitionId: storageBlobDataReaderRoleId
    principalType: 'ServicePrincipal'
  }
}
