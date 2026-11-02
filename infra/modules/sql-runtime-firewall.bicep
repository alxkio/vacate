@maxLength(100)
param outboundIpAddresses array

@allowed(['Restricted', 'DevelopmentOpen'])
param networkMode string = 'Restricted'

resource server 'Microsoft.Sql/servers@2023-08-01' existing = {
  name: 'vacate-dev-srv'
}

// Caller verifies each value is a resolved app IPv4 address, never 0.0.0.0 or a range.
resource rules 'Microsoft.Sql/servers/firewallRules@2023-08-01' = [for address in outboundIpAddresses: if (networkMode == 'Restricted') {
  parent: server
  name: 'vacate-dev-api-${replace(address, '.', '-')}'
  properties: {
    startIpAddress: address
    endIpAddress: address
  }
}]

// Explicit user-approved development exception; authentication remains Entra-only.
resource developmentOpen 'Microsoft.Sql/servers/firewallRules@2023-08-01' = if (networkMode == 'DevelopmentOpen') {
  parent: server
  name: 'vacate-dev-open-ipv4'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '255.255.255.255'
  }
}
