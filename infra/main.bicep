targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Name of the API service')
param apiServiceName string = ''

@description('Name of the web service')
param webServiceName string = ''

@description('Name of the OpenAI service')
param openAiServiceName string = ''

@description('Name of the search service')
param searchServiceName string = ''

@description('Name of the document intelligence service')
param documentIntelligenceServiceName string = ''

@description('Name of the storage account')
param storageAccountName string = ''

@description('Name of the key vault')
param keyVaultName string = ''

@description('Name of the log analytics workspace')
param logAnalyticsName string = ''

@description('Name of the application insights')
param applicationInsightsName string = ''

@description('Id of the user or app to assign application roles')
param principalId string = ''

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }

// Organize resources in a resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// Create an App Service Plan to group applications under the same payment plan and SKU
module appServicePlan './app/app-service-plan.bicep' = {
  name: 'app-service-plan'
  scope: resourceGroup
  params: {
    name: !empty(apiServiceName) ? apiServiceName : '${abbrs.webServerFarms}api-${resourceToken}'
    location: location
    tags: tags
    sku: {
      name: 'B1'
      capacity: 1
    }
  }
}

// Container Apps Environment
module containerAppsEnvironment './app/container-apps-env.bicep' = {
  name: 'container-apps-env'
  scope: resourceGroup
  params: {
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    tags: tags
    logAnalyticsWorkspaceName: monitoring.outputs.logAnalyticsWorkspaceName
  }
}

// The application backend
module api './app/api.bicep' = {
  name: 'api'
  scope: resourceGroup
  params: {
    name: !empty(apiServiceName) ? apiServiceName : '${abbrs.appContainerApps}api-${resourceToken}'
    location: location
    tags: tags
    containerAppsEnvironmentName: containerAppsEnvironment.outputs.name
    keyVaultName: keyVault.outputs.name
    openAiEndpoint: openAi.outputs.endpoint
    openAiDeploymentName: 'gpt-4.1-mini'
    searchEndpoint: searchService.outputs.endpoint
    searchIndexName: 'adaptive-rag-index'
    documentIntelligenceEndpoint: documentIntelligence.outputs.endpoint
    storageAccountName: storage.outputs.name
    applicationInsightsConnectionString: monitoring.outputs.applicationInsightsConnectionString
    identityName: apiIdentity.outputs.identityName
    openAiKey: openAi.outputs.key
    searchKey: searchService.outputs.key
    documentIntelligenceKey: documentIntelligence.outputs.key
    storageKey: storage.outputs.key
    containerRegistryName: containerRegistry.outputs.name
  }
  dependsOn: [
    keyVaultSecrets
    apiKeyVaultAccess
    apiOpenAiAccess
    apiSearchAccess
    apiDocumentIntelligenceAccess
    apiStorageAccess
    apiContainerRegistryAccess
  ]
}

// The application frontend
module web './app/web.bicep' = {
  name: 'web'
  scope: resourceGroup
  params: {
    name: !empty(webServiceName) ? webServiceName : '${abbrs.webStaticSites}web-${resourceToken}'
    location: location
    tags: tags
    apiBaseUrl: api.outputs.SERVICE_API_URI
  }
}

// Create an Azure OpenAI instance
module openAi './app/ai/cognitive-services.bicep' = {
  name: 'openai'
  scope: resourceGroup
  params: {
    name: !empty(openAiServiceName) ? openAiServiceName : '${abbrs.cognitiveServicesAccounts}${resourceToken}'
    location: location
    tags: tags
    sku: {
      name: 'S0'
    }
    deployments: [
      {
        name: 'gpt-4.1-mini'
        model: {
          format: 'OpenAI'
          name: 'gpt-4.1-mini'
          version: '2025-04-14'
        }
        sku: {
          name: 'GlobalStandard'
          capacity: 10
        }
      }
      {
        name: 'text-embedding-3-small'
        model: {
          format: 'OpenAI'
          name: 'text-embedding-3-small'
          version: '1'
        }
        sku: {
          name: 'Standard'
          capacity: 120
        }
      }
    ]
  }
}

// Create Azure AI Search
module searchService './app/ai/search.bicep' = {
  name: 'search-service'
  scope: resourceGroup
  params: {
    name: !empty(searchServiceName) ? searchServiceName : '${abbrs.searchSearchServices}${resourceToken}'
    location: location
    tags: tags
    sku: {
      name: 'basic'
    }
    semanticSearch: 'free'
  }
}

// Create Azure Document Intelligence
module documentIntelligence './app/ai/document-intelligence.bicep' = {
  name: 'document-intelligence'
  scope: resourceGroup
  params: {
    name: !empty(documentIntelligenceServiceName) ? documentIntelligenceServiceName : '${abbrs.cognitiveServicesFormRecognizer}${resourceToken}'
    location: location
    tags: tags
    sku: {
      name: 'S0'
    }
  }
}

// Create a storage account
module storage './app/storage-account.bicep' = {
  name: 'storage'
  scope: resourceGroup
  params: {
    name: !empty(storageAccountName) ? storageAccountName : '${abbrs.storageStorageAccounts}${resourceToken}'
    location: location
    tags: tags
    containers: [
      {
        name: 'documents'
        publicAccess: 'None'
      }
      {
        name: 'ingest-drop'
        publicAccess: 'None'
      }
    ]
  }
}

// Create a container registry
module containerRegistry './app/container-registry.bicep' = {
  name: 'container-registry'
  scope: resourceGroup
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
    sku: 'Basic'
  }
}

// Create a keyvault to store secrets
module keyVault './app/keyvault.bicep' = {
  name: 'keyvault'
  scope: resourceGroup
  params: {
    name: !empty(keyVaultName) ? keyVaultName : '${abbrs.keyVaultVaults}${resourceToken}'
    location: location
    tags: tags
    principalId: principalId
  }
}

// Monitor application with Azure Monitor
module monitoring './app/monitoring.bicep' = {
  name: 'monitoring'
  scope: resourceGroup
  params: {
    location: location
    tags: tags
    logAnalyticsName: !empty(logAnalyticsName) ? logAnalyticsName : '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: !empty(applicationInsightsName) ? applicationInsightsName : '${abbrs.insightsComponents}${resourceToken}'
  }
}

// User assigned managed identity to be used by the API to access other Azure resources
module apiIdentity './app/identity.bicep' = {
  name: 'api-identity'
  scope: resourceGroup
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}api-${resourceToken}'
    location: location
    tags: tags
  }
}

// Give the API access to KeyVault
module apiKeyVaultAccess './app/rbac/keyvault-access.bicep' = {
  name: 'api-keyvault-access'
  scope: resourceGroup
  params: {
    keyVaultName: keyVault.outputs.name
    principalId: apiIdentity.outputs.identityPrincipalId
  }
}

// Give the API access to the OpenAI service
module apiOpenAiAccess './app/rbac/openai-access.bicep' = {
  name: 'api-openai-access'
  scope: resourceGroup
  params: {
    openAiName: openAi.outputs.name
    principalId: apiIdentity.outputs.identityPrincipalId
  }
}

// Give the API access to the search service
module apiSearchAccess './app/rbac/search-access.bicep' = {
  name: 'api-search-access'
  scope: resourceGroup
  params: {
    searchServiceName: searchService.outputs.name
    principalId: apiIdentity.outputs.identityPrincipalId
  }
}

// Give the API access to the document intelligence service
module apiDocumentIntelligenceAccess './app/rbac/document-intelligence-access.bicep' = {
  name: 'api-document-intelligence-access'
  scope: resourceGroup
  params: {
    documentIntelligenceName: documentIntelligence.outputs.name
    principalId: apiIdentity.outputs.identityPrincipalId
  }
}

// Give the API access to the storage account
module apiStorageAccess './app/rbac/storage-access.bicep' = {
  name: 'api-storage-access'
  scope: resourceGroup
  params: {
    storageAccountName: storage.outputs.name
    principalId: apiIdentity.outputs.identityPrincipalId
  }
}

// Give the API access to the container registry
module apiContainerRegistryAccess './app/rbac/container-registry-access.bicep' = {
  name: 'api-container-registry-access'
  scope: resourceGroup
  params: {
    containerRegistryName: containerRegistry.outputs.name
    principalId: apiIdentity.outputs.identityPrincipalId
  }
}

// Store secrets in Key Vault
module keyVaultSecrets './app/keyvault-secrets.bicep' = {
  name: 'keyvault-secrets'
  scope: resourceGroup
  params: {
    keyVaultName: keyVault.outputs.name
    openAiKey: openAi.outputs.key
    searchKey: searchService.outputs.key
    documentIntelligenceKey: documentIntelligence.outputs.key
    storageKey: storage.outputs.key
  }
  dependsOn: [
    apiKeyVaultAccess
    apiOpenAiAccess
    apiSearchAccess
    apiDocumentIntelligenceAccess
    apiStorageAccess
  ]
}

// Data outputs
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup.name

// Application outputs
output APPLICATIONINSIGHTS_CONNECTION_STRING string = monitoring.outputs.applicationInsightsConnectionString
output AZURE_KEY_VAULT_ENDPOINT string = keyVault.outputs.endpoint
output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name

// OpenAI outputs
output AZURE_OPENAI_ENDPOINT string = openAi.outputs.endpoint
output AZURE_OPENAI_KEY string = openAi.outputs.key
output AZURE_OPENAI_CHAT_DEPLOYMENT string = 'gpt-4.1-mini'
output AZURE_OPENAI_EMBEDDING_DEPLOYMENT string = 'text-embedding-3-small'

// Search outputs
output AZURE_SEARCH_ENDPOINT string = searchService.outputs.endpoint
output AZURE_SEARCH_KEY string = searchService.outputs.key
output AZURE_SEARCH_INDEX string = 'adaptive-rag-index'

// Document Intelligence outputs
output AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT string = documentIntelligence.outputs.endpoint
output AZURE_DOCUMENT_INTELLIGENCE_KEY string = documentIntelligence.outputs.key

// Storage outputs
output AZURE_STORAGE_ACCOUNT string = storage.outputs.name
output AZURE_STORAGE_KEY string = storage.outputs.key
output AZURE_STORAGE_CONNECTION_STRING string = storage.outputs.connectionString

// Container Registry outputs
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.outputs.name

// Service outputs
output SERVICE_API_IDENTITY_PRINCIPAL_ID string = apiIdentity.outputs.identityPrincipalId
output SERVICE_API_NAME string = api.outputs.SERVICE_API_NAME
output SERVICE_API_URI string = api.outputs.SERVICE_API_URI
output SERVICE_WEB_NAME string = web.outputs.SERVICE_WEB_NAME
output SERVICE_WEB_URI string = web.outputs.SERVICE_WEB_URI 
