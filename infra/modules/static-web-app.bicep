param baseName string
param location string
param sku string
param tags object

resource web 'Microsoft.Web/staticSites@2024-04-01' = {
  name: '${baseName}-web'
  location: location
  tags: tags
  sku: { name: sku, tier: sku }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Disabled'
  }
}
output name string = web.name
output url string = 'https://${web.properties.defaultHostname}'
