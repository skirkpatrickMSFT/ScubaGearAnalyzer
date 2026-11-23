// ============================================================
// ScubaGear Analyzer — Azure Functions Infrastructure
// Deploys the Azure Function App (Flex Consumption), its storage,
// an optional ScubaGear results storage account, and (by default)
// the VNet + private endpoints that keep storage off the public
// internet. All storage access uses Managed Identity; no account
// keys are created or used.
// ============================================================

metadata description = 'Deploys the ScubaGear Analyzer Azure Functions backend (Flex Consumption) with identity-based storage, private endpoints, Application Insights, an optional results storage account, and RBAC. After deployment, run the GitHub Actions workflow to deploy the function code, or run deploy-functions.ps1 locally.'

targetScope = 'resourceGroup'

// ── Parameters ─────────────────────────────────────────────

@description('Base name used to derive resource names (e.g. scubagear → scubagear-func-xxxx)')
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

@description('GitHub repository URL. Not used by the template; retained so existing parameter files keep working.')
#disable-next-line no-unused-params
param repoUrl string = 'https://github.com/skirkpatrickMSFT/ScubaGearAnalyzer'

@description('Branch to deploy from. Not used by the template; retained so existing parameter files keep working.')
#disable-next-line no-unused-params
param repoBranch string = 'main'

@description('Allowed CORS origins (Power Apps domain)')
param allowedOrigins string = 'https://*.powerapps.com'

@description('Put the storage accounts behind private endpoints: creates a VNet, integrates the function app with it, creates private DNS zones, and disables public network access on the function app\'s storage. Inbound access to the function app itself stays public so the Power Platform connector can reach it.')
param enablePrivateEndpoints bool = true

@description('Address space for the VNet (at least a /24). Only used when enablePrivateEndpoints is true.')
param vnetAddressPrefix string = '10.40.0.0/24'

@description('Create a dedicated storage account and blob container for ScubaGear results, and grant the function app\'s Managed Identity read access. Turn off if you already have a results account (see externalStorageAccountName).')
param createResultsStorage bool = true

@description('Name of the blob container created for ScubaGear results')
param resultsContainerName string = 'scubagear-output'

@description('Name for the results storage account that is CREATED when createResultsStorage is true (3-24 lowercase letters and digits, globally unique). Leave empty to auto-generate one.')
param resultsStorageAccountName string = ''

@description('Public IPs or CIDR ranges allowed to reach the results storage account (e.g. where ScubaGear runs or where you upload from). With private endpoints enabled, leaving this empty disables public access to the results account entirely.')
param resultsStorageAllowedIpRanges array = []

@description('Optional: name of an EXISTING storage account (e.g. one ScubaConnect already writes to) to grant the function app\'s Managed Identity read access. This does not create the account; the deployment fails if it is not found. To have one created, use resultsStorageAccountName instead. Leave empty to skip.')
param externalStorageAccountName string = ''

@description('Optional: resource group of the existing external storage account. Defaults to this resource group.')
param externalStorageResourceGroup string = resourceGroup().name

// ── Derived names ──────────────────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id)
var functionAppName = '${baseName}-func-${uniqueSuffix}'
var storageName = replace('${baseName}st${uniqueSuffix}', '-', '')
// Separate from the function app's own storage so results can be shared or locked down independently.
var resultsStorageName = !empty(resultsStorageAccountName)
  ? toLower(resultsStorageAccountName)
  : take(toLower(replace('${baseName}res${uniqueSuffix}', '-', '')), 24)
var appServicePlanName = '${baseName}-plan-${uniqueSuffix}'
var appInsightsName = '${baseName}-ai-${uniqueSuffix}'

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

// Built-in roles
var storageBlobDataReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1')
// The Functions host needs blob (keys, leases, deployment package), queue and table access.
var functionStorageRoleIds = [
  subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b') // Storage Blob Data Owner
  subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '974c5e8b-45b9-4653-ba55-5f855dd0fb88') // Storage Queue Data Contributor
  subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3') // Storage Table Data Contributor
]

// ── Network (private endpoints) ────────────────────────────

module network 'network.bicep' = if (enablePrivateEndpoints) {
  name: 'network'
  params: {
    baseName: baseName
    location: location
    uniqueSuffix: uniqueSuffix
    vnetAddressPrefix: vnetAddressPrefix
  }
}

// ── Storage Account (required by Azure Functions) ──────────
// Identity-based only: shared key access is disabled, so no account keys exist to leak or rotate.

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    publicNetworkAccess: enablePrivateEndpoints ? 'Disabled' : 'Enabled'
    networkAcls: {
      defaultAction: enablePrivateEndpoints ? 'Deny' : 'Allow'
      bypass: 'AzureServices'
    }
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

module functionStoragePrivateEndpoints 'storage-private-endpoint.bicep' = if (enablePrivateEndpoints) {
  name: 'functionStoragePrivateEndpoints'
  params: {
    location: location
    storageAccountName: storageAccount.name
    storageAccountId: storageAccount.id
    subnetId: network!.outputs.privateEndpointSubnetId
    services: [
      'blob'
      'queue'
      'table'
    ]
    dnsZoneIds: network!.outputs.dnsZoneIds
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
    // Outbound traffic to private IPs (the storage private endpoints) goes through the VNet.
    virtualNetworkSubnetId: enablePrivateEndpoints ? network!.outputs.functionSubnetId : null
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storageAccount.properties.primaryEndpoints.blob}deploymentpackage'
          authentication: {
            type: 'SystemAssignedIdentity'
          }
        }
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 100
        instanceMemoryMB: 2048
      }
      runtime: {
        name: 'node'
        version: '26'
      }
    }
    siteConfig: {
      appSettings: concat([
        {
          // Identity-based host storage connection (no key or connection string).
          name: 'AzureWebJobsStorage__accountName'
          value: storageAccount.name
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
    functionStoragePrivateEndpoints
  ]
  tags: {
    project: 'ScubaGearAnalyzer'
    component: 'functions'
  }
}

// ── RBAC: the function app's identity on its own storage ───

resource functionStorageRoleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for roleId in functionStorageRoleIds: {
    name: guid(storageAccount.id, functionApp.id, roleId)
    scope: storageAccount
    properties: {
      principalId: functionApp.identity.principalId
      roleDefinitionId: roleId
      principalType: 'ServicePrincipal'
    }
  }
]

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
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    // With private endpoints the account is private unless specific IPs are allowed.
    publicNetworkAccess: (!enablePrivateEndpoints || !empty(resultsStorageAllowedIpRanges)) ? 'Enabled' : 'Disabled'
    networkAcls: {
      defaultAction: enablePrivateEndpoints ? 'Deny' : 'Allow'
      bypass: 'AzureServices'
      ipRules: [
        for range in resultsStorageAllowedIpRanges: {
          value: range
          action: 'Allow'
        }
      ]
    }
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

module resultsStoragePrivateEndpoints 'storage-private-endpoint.bicep' = if (createResultsStorage && enablePrivateEndpoints) {
  name: 'resultsStoragePrivateEndpoints'
  params: {
    location: location
    storageAccountName: resultsStorage.name
    storageAccountId: resultsStorage.id
    subnetId: network!.outputs.privateEndpointSubnetId
    services: [
      'blob'
    ]
    dnsZoneIds: network!.outputs.dnsZoneIds
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

// Skip when it names the account this deployment just created: that role is already assigned above.
var externalIsResultsAccount = createResultsStorage && toLower(externalStorageAccountName) == resultsStorageName && externalStorageResourceGroup == resourceGroup().name

module externalStorageRbac 'external-storage-rbac.bicep' = if (!empty(externalStorageAccountName) && !externalIsResultsAccount) {
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
output privateEndpointsEnabled bool = enablePrivateEndpoints
output resultsStorageAccountName string = createResultsStorage ? resultsStorage.name : ''
output resultsContainerName string = createResultsStorage ? resultsContainerName : ''
output resultsStorageAccountId string = createResultsStorage ? resultsStorage.id : ''
