// ============================================================
// Azure OpenAI / Azure AI Foundry — RBAC Role Assignment
// Grants "Cognitive Services OpenAI User" to the function app's
// Managed Identity on an existing Azure OpenAI or Azure AI
// Services account, so chat can call it without an API key.
// ============================================================

targetScope = 'resourceGroup'

@description('Name of the existing Azure OpenAI / Azure AI Services account')
param accountName string

@description('Principal ID of the function app Managed Identity')
param functionAppPrincipalId string

// Cognitive Services OpenAI User
var openAiUserRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd')

resource account 'Microsoft.CognitiveServices/accounts@2024-10-01' existing = {
  name: accountName
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(account.id, functionAppPrincipalId, openAiUserRoleId)
  scope: account
  properties: {
    principalId: functionAppPrincipalId
    roleDefinitionId: openAiUserRoleId
    principalType: 'ServicePrincipal'
  }
}
