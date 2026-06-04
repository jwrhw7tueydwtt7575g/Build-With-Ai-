terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id

  skip_provider_registration = true
}

resource "azurerm_resource_group" "file_uploader" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_storage_account" "file_uploader" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.file_uploader.name
  location                 = azurerm_resource_group.file_uploader.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    Environment = var.environment
    Project     = "FileUploader"
  }
}

resource "azurerm_storage_container" "uploads" {
  name                  = var.blob_container_name
  storage_account_name  = azurerm_storage_account.file_uploader.name
  container_access_type = "private"
}

data "azurerm_storage_account_sas" "file_uploader_sas" {
  connection_string = azurerm_storage_account.file_uploader.primary_connection_string

  https_only = true

  resource_types {
    service   = true
    container = true
    object    = true
  }

  services {
    blob  = true
    queue = false
    table = false
    file  = false
  }

  start  = timestamp()
  expiry = timeadd(timestamp(), "8760h")

  permissions {
    read   = true
    write  = true
    delete = true
    list   = true
    add    = true
    create = true
    update = true
    process = false
    tag     = false
    filter  = false
  }
}

# ====== KEY VAULT (Secrets Management) ======
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "pipeline" {
  name                       = "kv-${var.environment}-${substr(md5(azurerm_resource_group.file_uploader.id), 0, 8)}"
  location                   = azurerm_resource_group.file_uploader.location
  resource_group_name        = azurerm_resource_group.file_uploader.name
  tenant_id                  = var.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false

  access_policy {
    tenant_id = var.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
    ]
  }

  tags = {
    Environment = var.environment
    Component   = "SecretsManagement"
  }
}

# ====== MANAGED IDENTITY (for Function App & ADF) ======
resource "azurerm_user_assigned_identity" "pipeline" {
  name                = "msi-pipeline-${var.environment}"
  location            = azurerm_resource_group.file_uploader.location
  resource_group_name = azurerm_resource_group.file_uploader.name

  tags = {
    Environment = var.environment
    Component   = "ManagedIdentity"
  }
}

# NOTE: Role assignments require Owner/User Access Administrator permissions
# Can be assigned manually via Azure CLI:
# az role assignment create --assignee <principal-id> --role "Storage Blob Data Contributor" --scope <storage-account-id>
# az role assignment create --assignee <principal-id> --role "Key Vault Secrets User" --scope <key-vault-id>

# ====== ADDITIONAL BLOB CONTAINERS ======
resource "azurerm_storage_container" "processed" {
  name                  = "processed"
  storage_account_name  = azurerm_storage_account.file_uploader.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "raw_text" {
  name                  = "raw-text"
  storage_account_name  = azurerm_storage_account.file_uploader.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "normalized_json" {
  name                  = "normalized-json"
  storage_account_name  = azurerm_storage_account.file_uploader.name
  container_access_type = "private"
}

# ====== AZURE DATA FACTORY (Orchestration) ======
resource "azurerm_data_factory" "pipeline" {
  name                = "adf-${var.environment}-${substr(md5(azurerm_resource_group.file_uploader.id), 0, 6)}"
  location            = azurerm_resource_group.file_uploader.location
  resource_group_name = azurerm_resource_group.file_uploader.name

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.pipeline.id]
  }

  tags = {
    Environment = var.environment
    Component   = "DataFactory"
  }
}

# ====== ADF LINKED SERVICES ======
# Linked Service for Azure Blob Storage
resource "azurerm_data_factory_linked_service_azure_blob_storage" "blob_storage" {
  name                 = "AzureBlobStorage"
  data_factory_id      = azurerm_data_factory.pipeline.id
  connection_string    = azurerm_storage_account.file_uploader.primary_connection_string
}

# Linked Service for Azure Key Vault (to retrieve secrets)
resource "azurerm_data_factory_linked_service_key_vault" "key_vault" {
  name            = "AzureKeyVault"
  data_factory_id = azurerm_data_factory.pipeline.id
  key_vault_id    = azurerm_key_vault.pipeline.id
}

# ====== ADF DATASETS ======
# Dataset for Source Blob (uploads container)
resource "azurerm_data_factory_dataset_azure_blob" "source_blob" {
  name            = "SourceBlobDataset"
  data_factory_id = azurerm_data_factory.pipeline.id
  linked_service_name = azurerm_data_factory_linked_service_azure_blob_storage.blob_storage.name

  path       = "uploads"
  filename   = "@dataset().FileName"
  
  dynamic_filename_enabled = true
  dynamic_path_enabled     = false

  parameters = {
    FileName = ""
  }
}

# Dataset for Normalized JSON output (normalized-json container)
resource "azurerm_data_factory_dataset_azure_blob" "normalized_json" {
  name            = "NormalizedJsonDataset"
  data_factory_id = azurerm_data_factory.pipeline.id
  linked_service_name = azurerm_data_factory_linked_service_azure_blob_storage.blob_storage.name

  path       = "normalized-json"
  filename   = "@concat(formatDateTime(utcnow(), 'yyyy/MM/dd'), '/', formatDateTime(utcnow(), 'HHmmss'), '_normalized.json')"
  
  dynamic_filename_enabled = true
  dynamic_path_enabled     = false

  parameters = {
    ContainerName = ""
    FileName      = ""
  }
}

# ====== ADF PIPELINES ======
# Main Ingest Pipeline - triggered by Event Grid
resource "azurerm_data_factory_pipeline" "ingest_pipeline" {
  name            = var.adf_pipeline_name
  data_factory_id = azurerm_data_factory.pipeline.id

  activities_json = jsonencode([
    {
      name = "ProcessBlobEvent"
      type = "WebActivity"
      typeProperties = {
        url    = "${azurerm_key_vault.pipeline.vault_uri}secrets/parser-endpoint?api-version=7.0"
        method = "POST"
        headers = {
          "Content-Type" = "application/json"
        }
        authentication = {
          type   = "MSI"
          resource = "https://vault.azure.net"
        }
      }
    }
  ])

  depends_on = [
    azurerm_data_factory_linked_service_azure_blob_storage.blob_storage,
    azurerm_key_vault_secret.storage_connection_string
  ]
}

# ====== EVENT GRID TOPIC ======
resource "azurerm_eventgrid_topic" "file_processing" {
  name                = "eg-${var.environment}-files"
  location            = azurerm_resource_group.file_uploader.location
  resource_group_name = azurerm_resource_group.file_uploader.name

  tags = {
    Environment = var.environment
    Component   = "EventGrid"
  }
}

# ====== EVENT GRID SUBSCRIPTION (Blob → Storage Queue) ======
# Direct subscription on storage account for blob.Created events
resource "azurerm_eventgrid_event_subscription" "blob_uploads_subscription" {
  name  = "sub-blob-to-queue-${var.environment}"
  scope = azurerm_storage_account.file_uploader.id

  event_delivery_schema = "EventGridSchema"

  # Filter for blob creation events in uploads container only
  included_event_types = ["Microsoft.Storage.BlobCreated"]

  subject_filter {
    subject_begins_with = "/blobServices/default/containers/${azurerm_storage_container.uploads.name}"
  }

  # Route events to storage queue for processing
  storage_queue_endpoint {
    storage_account_id = azurerm_storage_account.file_uploader.id
    queue_name         = azurerm_storage_queue.processing_queue.name
  }

  retry_policy {
    event_time_to_live    = 1440  # 1 day
    max_delivery_attempts = 30
  }
}

# ====== STORAGE QUEUES ======
resource "azurerm_storage_queue" "processing_queue" {
  name                 = "file-processing-queue"
  storage_account_name = azurerm_storage_account.file_uploader.name
}

resource "azurerm_storage_queue" "normalized_queue" {
  name                 = "normalized-data-queue"
  storage_account_name = azurerm_storage_account.file_uploader.name
}

# ====== COGNITIVE SERVICES (AI Services) ======
resource "azurerm_cognitive_account" "document_intelligence" {
  name                = "cog-doc-${var.environment}"
  location            = azurerm_resource_group.file_uploader.location
  resource_group_name = azurerm_resource_group.file_uploader.name
  kind                = "FormRecognizer"
  sku_name            = "S0"

  tags = {
    Environment = var.environment
    Component   = "DocumentIntelligence"
  }
}

resource "azurerm_cognitive_account" "speech_service" {
  name                = "cog-speech-${var.environment}"
  location            = azurerm_resource_group.file_uploader.location
  resource_group_name = azurerm_resource_group.file_uploader.name
  kind                = "SpeechServices"
  sku_name            = "S0"

  tags = {
    Environment = var.environment
    Component   = "SpeechService"
  }
}

resource "azurerm_cognitive_account" "openai" {
  name                = "cog-openai-${var.environment}"
  location            = var.openai_location
  resource_group_name = azurerm_resource_group.file_uploader.name
  kind                = "OpenAI"
  sku_name            = "S0"

  tags = {
    Environment = var.environment
    Component   = "OpenAI"
  }
}

# ====== STORE SECRETS IN KEY VAULT ======
resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.file_uploader.primary_connection_string
  key_vault_id = azurerm_key_vault.pipeline.id
}

resource "azurerm_key_vault_secret" "doc_intelligence_key" {
  name         = "document-intelligence-key"
  value        = azurerm_cognitive_account.document_intelligence.primary_access_key
  key_vault_id = azurerm_key_vault.pipeline.id
}

resource "azurerm_key_vault_secret" "speech_service_key" {
  name         = "speech-service-key"
  value        = azurerm_cognitive_account.speech_service.primary_access_key
  key_vault_id = azurerm_key_vault.pipeline.id
}

resource "azurerm_key_vault_secret" "openai_key" {
  name         = "openai-key"
  value        = azurerm_cognitive_account.openai.primary_access_key
  key_vault_id = azurerm_key_vault.pipeline.id
}

# ====== ADDITIONAL AZURE SERVICES FOR 11-STEP GENERALIZED PIPELINE ======

# Azure AI Language (Text Analytics for Enrichment - Step 8)
resource "azurerm_cognitive_account" "ai_language" {
  name                = "cog-language-${var.environment}"
  location            = azurerm_resource_group.file_uploader.location
  resource_group_name = azurerm_resource_group.file_uploader.name
  kind                = "TextAnalytics"
  sku_name            = "S"

  tags = {
    Environment = var.environment
    Component   = "AILanguage"
  }
}

# Synapse Workspace (Data Lake & Spark compute - Steps 4-11)
resource "azurerm_storage_data_lake_gen2_filesystem" "synapse_adls" {
  name               = "synapse-workspace-fs"
  storage_account_id = azurerm_storage_account.file_uploader.id
}

resource "azurerm_synapse_workspace" "analytics" {
  name                                 = "syn-${var.environment}-${substr(md5(azurerm_resource_group.file_uploader.id), 0, 6)}"
  resource_group_name                  = azurerm_resource_group.file_uploader.name
  location                             = azurerm_resource_group.file_uploader.location
  storage_data_lake_gen2_filesystem_id = azurerm_storage_data_lake_gen2_filesystem.synapse_adls.id
  sql_administrator_login              = "sqladminuser"
  sql_administrator_login_password     = var.synapse_admin_password

  identity {
    type = "SystemAssigned"
  }
}

# Synapse Spark Pool for Delta/Cleaning/Pattern execution
resource "azurerm_synapse_spark_pool" "pipeline_spark" {
  name                 = "sparkpool1"
  synapse_workspace_id = azurerm_synapse_workspace.analytics.id
  node_size_family     = "MemoryOptimized"
  node_size            = "Small"
  cache_size           = 100

  auto_scale {
    max_node_count = 5
    min_node_count = 3
  }

  auto_pause {
    delay_in_minutes = 15
  }
}
