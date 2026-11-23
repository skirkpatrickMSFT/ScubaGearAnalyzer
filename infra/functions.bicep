// ============================================================
// ScubaGear Analyzer — Azure Functions Infrastructure
// Deploys Azure Function App (Flex Consumption) + Storage
// for the Power Platform backend (custom connector + Copilot
// Studio agent).
// ============================================================

targetScope = 'resourceGroup'

// ── Parameters ─────────────────────────────────────────────

@description('Base name used to derive resource names')
param baseName string = 'scubagear'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Chat model provider: "openai" (OpenAI API key) or "azure" (Azure OpenAI / Azure AI Foundry, authenticated with the function app Managed Identity)')
@allowed([
  'openai'
  'azure'
])
param aiProvider string = 'openai'

@secure()
@description('OpenAI API key for GPT-4o chat. Required when aiProvider is "openai"; ignored for "azure".')
param openAiApiKey string = ''

@description('Azure OpenAI endpoint, e.g. https://<resource>.openai.azure.com. Required when aiProvider is "azure".')
param azureOpenAiEndpoint string = ''

@description('Name of the model deployment to call (the deployment name, not the model name). Required when aiProvider is "azure".')
param azureOpenAiDeployment string = ''

@description('Azure OpenAI API version')
param azureOpenAiApiVersion string = '2024-10-21'

@description('Name of the existing Azure OpenAI / AI Services account, used to grant the Managed Identity access. Defaults to the first label of the endpoint host.')
param azureOpenAiAccountName string = ''

@description('Resource group of the Azure OpenAI account. Defaults to this resource group.')
param azureOpenAiResourceGroup string = resourceGroup().name

@description('Subscription of the Azure OpenAI account. Defaults to this subscription.')
param azureOpenAiSubscriptionId string = subscription().subscriptionId

@description('Assign Cognitive Services OpenAI User to the function app on the Azure OpenAI account. Turn off if you assign the role yourself (the deployer needs Owner or User Access Administrator on the account to assign it).')
param assignAzureOpenAiRole bool = true

@description('Allowed CORS origins (Power Apps domain)')
param allowedOrigins string = 'https://*.powerapps.com'

@description('Create a dedicated storage account and blob container for ScubaGear results, and grant the function app\'s Managed Identity read access. Turn off if you already have a results account (see externalStorageAccountName).')
param createResultsStorage bool = true

@description('Name of the blob container created for ScubaGear results')
param resultsContainerName string = 'scubagear-output'

@description('Optional: name of an external storage account (e.g. for ScubaGear results) to grant the function app\'s Managed Identity read access. Leave empty to skip.')
param externalStorageAccountName string = ''

@description('Optional: resource group of the external storage account. Defaults to this resource group.')
param externalStorageResourceGroup string = resourceGroup().name

// ── Derived names ──────────────────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id)
var functionAppName = '${baseName}-func-${uniqueSuffix}'
var storageName = replace('${baseName}st${uniqueSuffix}', '-', '')
// Separate from the function app's own storage so results can be shared or locked down independently.
var resultsStorageName = take(toLower(replace('${baseName}res${uniqueSuffix}', '-', '')), 24)
var appServicePlanName = '${baseName}-plan-${uniqueSuffix}'
var appInsightsName = '${baseName}-ai-${uniqueSuffix}'
var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'

var azureOpenAiAccount = !empty(azureOpenAiAccountName)
  ? azureOpenAiAccountName
  : split(replace(replace(azureOpenAiEndpoint, 'https://', ''), 'http://', ''), '.')[0]

var aiAppSettings = aiProvider == 'azure'
  ? [
      { name: 'AI_PROVIDER', value: 'azure' }
      { name: 'AZURE_OPENAI_ENDPOINT', value: azureOpenAiEndpoint }
      { name: 'AZURE_OPENAI_DEPLOYMENT', value: azureOpenAiDeployment }
      { name: 'AZURE_OPENAI_API_VERSION', value: azureOpenAiApiVersion }
    ]
  : [
      { name: 'AI_PROVIDER', value: 'openai' }
      { name: 'OPENAI_API_KEY', value: openAiApiKey }
    ]

// ── Storage Account (required by Azure Functions) ──────────

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
  tags: {
    project: 'ScubaGearAnalyzer'
    component: 'functions-storage'
  }
}

// Blob container for Flex Consumption deployment packages
resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

resource deploymentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobServices
  name: 'deploymentpackage'
  properties: {
    publicAccess: 'None'
  }
}

// ── Application Insights ───────────────────────────────────

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
  tags: {
    project: 'ScubaGearAnalyzer'
    component: 'monitoring'
  }
}

// ── App Service Plan (Flex Consumption) ────────────────────

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'FC1'
    tier: 'FlexConsumption'
  }
  kind: 'functionapp'
  properties: {
    reserved: true // Linux
  }
  tags: {
    project: 'ScubaGearAnalyzer'
    component: 'compute'
  }
}

// ── Function App (Flex Consumption) ────────────────────────

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storageAccount.properties.primaryEndpoints.blob}deploymentpackage'
          authentication: {
            type: 'StorageAccountConnectionString'
            storageAccountConnectionStringName: 'DEPLOYMENT_STORAGE_CONNECTION_STRING'
          }
        }
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 100
        instanceMemoryMB: 2048
      }
      runtime: {
        name: 'node'
        version: '22'
      }
    }
    siteConfig: {
      appSettings: concat([
        {
          name: 'AzureWebJobsStorage'
          value: storageConnectionString
        }
        {
          name: 'DEPLOYMENT_STORAGE_CONNECTION_STRING'
          value: storageConnectionString
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ], aiAppSettings)
      cors: {
        allowedOrigins: [
          allowedOrigins
          'https://*.powerautomate.com'
          'https://copilotstudio.microsoft.com'
          'https://make.powerapps.com'
        ]
        supportCredentials: false
      }
    }
  }
  dependsOn: [
    deploymentContainer
  ]
  tags: {
    project: 'ScubaGearAnalyzer'
    component: 'functions'
  }
}

// ── RBAC: Storage Blob Data Reader on the built-in storage ─

@description('Storage Blob Data Reader built-in role')
var storageBlobDataReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1')

resource builtInStorageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, functionApp.id, storageBlobDataReaderRoleId)
  scope: storageAccount
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: storageBlobDataReaderRoleId
    principalType: 'ServicePrincipal'
  }
}

// ── Results storage (optional): account + container for ScubaGear output ─

resource resultsStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = if (createResultsStorage) {
  name: resultsStorageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
  tags: {
    project: 'ScubaGearAnalyzer'
    component: 'results-storage'
  }
}

resource resultsBlobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = if (createResultsStorage) {
  parent: resultsStorage
  name: 'default'
}

resource resultsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = if (createResultsStorage) {
  parent: resultsBlobServices
  name: resultsContainerName
  properties: {
    publicAccess: 'None'
  }
}

resource resultsStorageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (createResultsStorage) {
  name: guid(resultsStorage.id, functionApp.id, storageBlobDataReaderRoleId)
  scope: resultsStorage
  properties: {
    principalId: functionApp.identity.principalId
    roleDefinitionId: storageBlobDataReaderRoleId
    principalType: 'ServicePrincipal'
  }
}

// ── RBAC: Storage Blob Data Reader on external storage (optional) ─

module externalStorageRbac 'external-storage-rbac.bicep' = if (!empty(externalStorageAccountName)) {
  name: 'externalStorageRbac'
  scope: resourceGroup(externalStorageResourceGroup)
  params: {
    storageAccountName: externalStorageAccountName
    functionAppPrincipalId: functionApp.identity.principalId
  }
}

// ── RBAC: Cognitive Services OpenAI User on Azure OpenAI (optional) ─

module azureOpenAiRbac 'external-openai-rbac.bicep' = if (aiProvider == 'azure' && assignAzureOpenAiRole && !empty(azureOpenAiAccount)) {
  name: 'azureOpenAiRbac'
  scope: resourceGroup(azureOpenAiSubscriptionId, azureOpenAiResourceGroup)
  params: {
    accountName: azureOpenAiAccount
    functionAppPrincipalId: functionApp.identity.principalId
  }
}

// ── Outputs ────────────────────────────────────────────────

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppResourceId string = functionApp.id
output appInsightsName string = appInsights.name
output aiProvider string = aiProvider
output resultsStorageAccountName string = createResultsStorage ? resultsStorage.name : ''
output resultsContainerName string = createResultsStorage ? resultsContainerName : ''
output resultsStorageAccountId string = createResultsStorage ? resultsStorage.id : ''
