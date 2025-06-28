param keyVaultName string
param openAiKey string
param searchKey string
param documentIntelligenceKey string
param storageKey string

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
}

resource openAiKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'AZURE-OPENAI-KEY'
  properties: {
    value: openAiKey
  }
}

resource searchKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'AZURE-SEARCH-KEY'
  properties: {
    value: searchKey
  }
}

resource documentIntelligenceKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'AZURE-DOCUMENT-INTELLIGENCE-KEY'
  properties: {
    value: documentIntelligenceKey
  }
}

resource storageKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'AZURE-STORAGE-KEY'
  properties: {
    value: storageKey
  }
} 
