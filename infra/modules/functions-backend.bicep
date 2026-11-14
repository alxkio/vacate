param baseName string
param storageAccountName string
param location string
param tags object
param allowedOrigins array
param enableDevelopmentData bool
param maximumInstanceCount int
@secure()
param monitoringConnectionString string = ''
param enableSqlPersistence bool = false
param sqlServerName string = ''
param sqlDatabaseName string = ''

// Azure SQL's environment suffix already includes its leading dot.
var sqlServerHostname = '${sqlServerName}${environment().suffixes.sqlServerHostname}'

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
  }
}
resource blobs 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}
resource packages 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobs
  name: 'deployments'
  properties: { publicAccess: 'None' }
}
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${baseName}-api'
  location: location
  tags: tags
}
resource blobAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, identity.id, 'blob-owner')
  scope: storage
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b')
  }
}
resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: '${baseName}-plan'
  location: location
  tags: tags
  kind: 'functionapp'
  sku: { name: 'FC1', tier: 'FlexConsumption' }
  properties: { reserved: true }
}
resource api 'Microsoft.Web/sites@2024-04-01' = {
  name: '${baseName}-api'
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      cors: {
        allowedOrigins: allowedOrigins
        supportCredentials: false
      }
      appSettings: [
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: monitoringConnectionString }
        { name: 'Logging__LogLevel__Default', value: 'Warning' }
        { name: 'AzureWebJobsStorage__accountName', value: storage.name }
        { name: 'AzureWebJobsStorage__credential', value: 'managedidentity' }
        { name: 'AzureWebJobsStorage__clientId', value: identity.properties.clientId }
        { name: 'DevelopmentAuthentication__Enabled', value: enableDevelopmentData ? 'true' : 'false' }
        { name: 'Persistence__Provider', value: enableSqlPersistence ? 'SqlServer' : 'InMemory' }
        { name: 'ConnectionStrings__Vacate', value: enableSqlPersistence ? 'Server=tcp:${sqlServerHostname},1433;Database=${sqlDatabaseName};Authentication=Active Directory Managed Identity;User Id=${identity.properties.clientId};Encrypt=True;TrustServerCertificate=False;Connection Timeout=90;ConnectRetryCount=3;ConnectRetryInterval=5;' : '' }
      ]
    }
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storage.properties.primaryEndpoints.blob}${packages.name}'
          authentication: {
            type: 'UserAssignedIdentity'
            userAssignedIdentityResourceId: identity.id
          }
        }
      }
      runtime: { name: 'dotnet-isolated', version: '10.0' }
      scaleAndConcurrency: {
        maximumInstanceCount: maximumInstanceCount
        instanceMemoryMB: 2048
      }
    }
  }
  dependsOn: [ blobAccess ]
}

output name string = api.name
output url string = 'https://${api.properties.defaultHostName}'
output identityId string = identity.id
output clientId string = identity.properties.clientId
output principalId string = identity.properties.principalId
output storageId string = storage.id
output planId string = plan.id
