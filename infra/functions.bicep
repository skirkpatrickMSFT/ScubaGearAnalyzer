// ============================================================
// ScubaGear Analyzer — Azure Functions Infrastructure
// Deploys Azure Function App + Storage for the Power Platform
// backend (custom connector + Copilot Studio agent).
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

// ── App Service Plan (Consumption) ─────────────────────────

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
    size: 'Y1'
    family: 'Y'
    capacity: 0
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

// ── Function App ───────────────────────────────────────────

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: functionAppName
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
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
