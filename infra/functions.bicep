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

// ── Outputs ────────────────────────────────────────────────

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppResourceId string = functionApp.id
output appInsightsName string = appInsights.name
