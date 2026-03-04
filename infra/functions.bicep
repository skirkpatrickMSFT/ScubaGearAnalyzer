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

@secure()
@description('OpenAI API key for GPT-4o chat integration')
param openAiApiKey string

@description('Allowed CORS origins (Power Apps domain)')
param allowedOrigins string = 'https://*.powerapps.com'

@description('Optional: name of an external storage account (e.g. for ScubaGear results) to grant the function app\'s Managed Identity read access. Leave empty to skip.')
param externalStorageAccountName string = ''

@description('Optional: resource group of the external storage account. Defaults to this resource group.')
param externalStorageResourceGroup string = resourceGroup().name

// ── Derived names ──────────────────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id)
var functionAppName = '${baseName}-func-${uniqueSuffix}'
var storageName = replace('${baseName}st${uniqueSuffix}', '-', '')
var appServicePlanName = '${baseName}-plan-${uniqueSuffix}'
var appInsightsName = '${baseName}-ai-${uniqueSuffix}'
var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'

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
      appSettings: [
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
        {
          name: 'OPENAI_API_KEY'
          value: openAiApiKey
        }
      ]
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

// ── RBAC: Storage Blob Data Reader on external storage (optional) ─

module externalStorageRbac 'external-storage-rbac.bicep' = if (!empty(externalStorageAccountName)) {
  name: 'externalStorageRbac'
  scope: resourceGroup(externalStorageResourceGroup)
  params: {
    storageAccountName: externalStorageAccountName
    functionAppPrincipalId: functionApp.identity.principalId
  }
}

// ── Outputs ────────────────────────────────────────────────

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppResourceId string = functionApp.id
output appInsightsName string = appInsights.name
