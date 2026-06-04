output "resource_group_name" {
  description = "Name of the Resource Group"
  value       = azurerm_resource_group.file_uploader.name
}

# ====== STORAGE OUTPUTS ======
output "storage_account_name" {
  description = "Name of the created Storage Account"
  value       = azurerm_storage_account.file_uploader.name
}

output "storage_account_id" {
  description = "ID of the created Storage Account"
  value       = azurerm_storage_account.file_uploader.id
}

output "blob_endpoint" {
  description = "Blob Storage endpoint URL"
  value       = azurerm_storage_account.file_uploader.primary_blob_endpoint
}

output "blob_container_name" {
  description = "Name of the Blob Container"
  value       = azurerm_storage_container.uploads.name
}

output "storage_primary_connection_string" {
  description = "Primary connection string for Storage Account"
  value       = azurerm_storage_account.file_uploader.primary_connection_string
  sensitive   = true
}

output "storage_account_sas_token" {
  description = "SAS Token for Storage Account access"
  value       = data.azurerm_storage_account_sas.file_uploader_sas.sas
  sensitive   = true
}

# ====== KEY VAULT OUTPUTS ======
output "key_vault_id" {
  description = "ID of the Key Vault"
  value       = azurerm_key_vault.pipeline.id
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.pipeline.vault_uri
}

# ====== MANAGED IDENTITY OUTPUTS ======
output "managed_identity_id" {
  description = "ID of the Managed Identity"
  value       = azurerm_user_assigned_identity.pipeline.id
}

output "managed_identity_principal_id" {
  description = "Principal ID of the Managed Identity"
  value       = azurerm_user_assigned_identity.pipeline.principal_id
}

# ====== FUNCTION APP OUTPUTS ======
# NOTE: Function App deployment skipped due to App Service Plan quota limits
# Alternative: Deploy Azure Logic App or keep parsing logic in FastAPI server

# ====== DATA FACTORY OUTPUTS ======
output "data_factory_id" {
  description = "ID of the Data Factory"
  value       = azurerm_data_factory.pipeline.id
}

output "data_factory_name" {
  description = "Name of the Data Factory"
  value       = azurerm_data_factory.pipeline.name
}

output "adf_pipeline_name" {
  value = azurerm_data_factory_pipeline.ingest_pipeline.name
}

output "fabric_workspace" {
  value = var.fabric_workspace_name
}

output "fabric_lakehouse" {
  value = var.fabric_lakehouse_name
}

# ====== EVENT GRID OUTPUTS ======
output "event_grid_topic_id" {
  description = "ID of the Event Grid Topic"
  value       = azurerm_eventgrid_topic.file_processing.id
}

output "event_grid_topic_endpoint" {
  description = "Endpoint of the Event Grid Topic"
  value       = azurerm_eventgrid_topic.file_processing.endpoint
}

# ====== QUEUE OUTPUTS ======
output "processing_queue_name" {
  description = "Name of the file processing queue"
  value       = azurerm_storage_queue.processing_queue.name
}

output "normalized_queue_name" {
  description = "Name of the normalized data queue"
  value       = azurerm_storage_queue.normalized_queue.name
}

# ====== COGNITIVE SERVICES OUTPUTS ======
output "document_intelligence_endpoint" {
  description = "Endpoint for Document Intelligence"
  value       = azurerm_cognitive_account.document_intelligence.endpoint
}

output "document_intelligence_key" {
  description = "API Key for Document Intelligence"
  value       = azurerm_cognitive_account.document_intelligence.primary_access_key
  sensitive   = true
}

output "speech_service_endpoint" {
  description = "Endpoint for Speech Service"
  value       = azurerm_cognitive_account.speech_service.endpoint
}

output "speech_service_key" {
  description = "API Key for Speech Service"
  value       = azurerm_cognitive_account.speech_service.primary_access_key
  sensitive   = true
}

output "openai_endpoint" {
  description = "Endpoint for OpenAI"
  value       = azurerm_cognitive_account.openai.endpoint
}

output "openai_key" {
  description = "API Key for OpenAI"
  value       = azurerm_cognitive_account.openai.primary_access_key
  sensitive   = true
}

# ====== CONTAINER NAMES ======
output "processed_container_name" {
  description = "Name of the processed files container"
  value       = azurerm_storage_container.processed.name
}

output "raw_text_container_name" {
  description = "Name of the raw text container"
  value       = azurerm_storage_container.raw_text.name
}

output "normalized_json_container_name" {
  description = "Name of the normalized JSON container"
  value       = azurerm_storage_container.normalized_json.name
}
