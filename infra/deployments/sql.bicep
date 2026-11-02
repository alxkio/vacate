targetScope = 'resourceGroup'

// Separate SQL path: never import main.bicep or change application resources here.
@allowed(['swedencentral'])
param location string = loadJsonContent('../targets/dev.json').sqlLocation
@minLength(36)
@maxLength(36)
param administratorObjectId string
@minLength(1)
param administratorLogin string
@minLength(36)
@maxLength(36)
param tenantId string

@allowed(['Disabled', 'Enabled'])
param publicNetworkAccess string = 'Disabled'

var tags = {
  application: 'vacate'
  environment: 'dev'
  managedBy: 'bicep'
  issue: 'VAC-34'
}

module sql '../modules/sql-free.bicep' = {
  name: 'sql-free-dev'
  params: {
    location: location
    serverName: 'vacate-dev-srv'
    databaseName: 'vacate-dev-db'
    tags: tags
    administratorObjectId: administratorObjectId
    administratorLogin: administratorLogin
    tenantId: tenantId
    publicNetworkAccess: publicNetworkAccess
  }
}

output serverResourceId string = sql.outputs.serverResourceId
output databaseResourceId string = sql.outputs.databaseResourceId
