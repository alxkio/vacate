targetScope = 'resourceGroup'

@maxLength(100)
param outboundIpAddresses array = []

@allowed(['Restricted', 'DevelopmentOpen'])
param networkMode string = loadJsonContent('../targets/dev.json').sqlRuntimeNetworkMode

module firewall '../modules/sql-runtime-firewall.bicep' = {
  name: 'sql-runtime-firewall'
  params: { outboundIpAddresses: outboundIpAddresses, networkMode: networkMode }
}
