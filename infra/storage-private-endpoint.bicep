// ============================================================
// Storage account private endpoints
// One private endpoint per requested storage service, each
// registered in its private DNS zone so the account's normal
// *.core.windows.net name resolves to a private IP in the VNet.
// ============================================================

targetScope = 'resourceGroup'

@description('Azure region')
param location string

@description('Name of the storage account')
param storageAccountName string

@description('Resource ID of the storage account')
param storageAccountId string

@description('Subnet that hosts the private endpoints')
param subnetId string

@description('Storage services to expose privately: blob, queue and/or table')
param services array

@description('Private DNS zone resource IDs keyed by service: { blob, queue, table }')
param dnsZoneIds object

resource endpoints 'Microsoft.Network/privateEndpoints@2024-05-01' = [
  for service in services: {
    name: '${storageAccountName}-${service}-pe'
    location: location
    properties: {
      subnet: {
        id: subnetId
      }
      privateLinkServiceConnections: [
        {
          name: '${storageAccountName}-${service}'
          properties: {
            privateLinkServiceId: storageAccountId
            groupIds: [
              service
            ]
          }
        }
      ]
    }
    tags: {
      project: 'ScubaGearAnalyzer'
      component: 'private-endpoint'
    }
  }
]

resource dnsGroups 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-05-01' = [
  for (service, i) in services: {
    parent: endpoints[i]
    name: 'default'
    properties: {
      privateDnsZoneConfigs: [
        {
          name: service
          properties: {
            privateDnsZoneId: dnsZoneIds[service]
          }
        }
      ]
    }
  }
]
