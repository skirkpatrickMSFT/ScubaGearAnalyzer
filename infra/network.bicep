// ============================================================
// Network for private storage access
// Creates a VNet with a subnet delegated to Flex Consumption
// (function app VNet integration), a subnet for private
// endpoints, and the private DNS zones for blob/queue/table.
// ============================================================

targetScope = 'resourceGroup'

@description('Base name used to derive resource names')
param baseName string

@description('Azure region')
param location string

@description('Suffix that keeps names unique per resource group')
param uniqueSuffix string

@description('Address space for the VNet. The function subnet takes the first /26 and the private endpoint subnet a /27 after it, so use at least a /24.')
param vnetAddressPrefix string = '10.40.0.0/24'

var vnetName = '${baseName}-vnet-${uniqueSuffix}'
var storageServices = [
  'blob'
  'queue'
  'table'
]

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
        // Flex Consumption outbound VNet integration requires this delegation.
        name: 'snet-functions'
        properties: {
          addressPrefix: cidrSubnet(vnetAddressPrefix, 26, 0)
          delegations: [
            {
              name: 'flex-consumption'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: 'snet-private-endpoints'
        properties: {
          addressPrefix: cidrSubnet(vnetAddressPrefix, 27, 2)
        }
      }
    ]
  }
  tags: {
    project: 'ScubaGearAnalyzer'
    component: 'network'
  }
}

resource zones 'Microsoft.Network/privateDnsZones@2024-06-01' = [
  for service in storageServices: {
    name: 'privatelink.${service}.${environment().suffixes.storage}'
    location: 'global'
    tags: {
      project: 'ScubaGearAnalyzer'
      component: 'network'
    }
  }
]

resource zoneLinks 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = [
  for (service, i) in storageServices: {
    parent: zones[i]
    name: '${vnetName}-link'
    location: 'global'
    properties: {
      registrationEnabled: false
      virtualNetwork: {
        id: vnet.id
      }
    }
  }
]

output functionSubnetId string = vnet.properties.subnets[0].id
output privateEndpointSubnetId string = vnet.properties.subnets[1].id
output dnsZoneIds object = {
  blob: zones[0].id
  queue: zones[1].id
  table: zones[2].id
}
