targetScope = 'resourceGroup'

@allowed(['dev', 'staging', 'prod'])
param environmentName string
param location string = resourceGroup().location
param staticSiteLocation string = 'westeurope'
@minLength(2)
@maxLength(7)
param namePrefix string = 'vacate'
@allowed(['Free', 'Standard'])
param staticSiteSku string = 'Free'
@minValue(40)
@maxValue(1000)
param maximumInstanceCount int = 40

@description('Retain warning/error diagnostics in Application Insights. False omits both monitoring resources.')
param enableMonitoring bool = true
@description('Daily workspace ingestion limit in GB; Azure requires >0.023 GB. This is not a hard spending cap.')
@allowed(['0.025', '0.05', '0.1', '0.25', '0.5', '1'])
param monitoringDailyCapGb string = '0.025'

var suffix = uniqueString(subscription().subscriptionId, resourceGroup().id, environmentName)
var baseName = '${namePrefix}-${environmentName}-${suffix}'
var enableDevelopmentData = environmentName == 'dev'
var tags = { application: 'vacate', environment: environmentName, managedBy: 'bicep' }

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: '${namePrefix}${environmentName}${take(suffix, 10)}'
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
module web 'modules/static-web-app.bicep' = {
  name: 'static-web-app'
  params: { baseName: baseName, location: staticSiteLocation, sku: staticSiteSku, tags: tags }
}
module monitoring 'modules/monitoring.bicep' = if (enableMonitoring) {
  name: 'monitoring'
  params: { baseName: baseName, location: location, tags: tags, dailyCapGb: monitoringDailyCapGb }
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
        allowedOrigins: [ web.outputs.url ]
        supportCredentials: false
      }
      appSettings: [
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: enableMonitoring ? monitoring!.outputs.connectionString : '' }
        { name: 'Logging__LogLevel__Default', value: 'Warning' }
        { name: 'AzureWebJobsStorage__accountName', value: storage.name }
        { name: 'AzureWebJobsStorage__credential', value: 'managedidentity' }
        { name: 'AzureWebJobsStorage__clientId', value: identity.properties.clientId }
        { name: 'DevelopmentAuthentication__Enabled', value: enableDevelopmentData ? 'true' : 'false' }
        { name: 'SeedData__Enabled', value: enableDevelopmentData ? 'true' : 'false' }
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

output staticSiteName string = web.outputs.name
output staticSiteUrl string = web.outputs.url
output functionAppName string = api.name
output functionAppUrl string = 'https://${api.properties.defaultHostName}'
