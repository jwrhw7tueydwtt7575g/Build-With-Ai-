variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  sensitive   = true
}

variable "client_id" {
  description = "Azure Service Principal Client ID (App ID)"
  type        = string
  sensitive   = true
}

variable "client_secret" {
  description = "Azure Service Principal Client Secret"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure Tenant ID"
  type        = string
  sensitive   = true
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "rg-file-uploader"
}

variable "location" {
  description = "Azure Region for resources"
  type        = string
  default     = "eastus"
}

variable "storage_account_name" {
  description = "Name of the Storage Account (must be globally unique, lowercase alphanumeric)"
  type        = string
  default     = "fileuploadersa"
}

variable "blob_container_name" {
  description = "Name of the Blob Storage Container"
  type        = string
  default     = "uploads"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "openai_location" {
  description = "Azure region for OpenAI (may differ from main region)"
  type        = string
  default     = "eastus"
}

variable "adf_pipeline_name" {
  description = "The name of the ADF pipeline"
  type        = "string"
  default     = "IngestNormalizePipeline"
}

# ====== MICROSOFT FABRIC / ONELAKE ======
variable "fabric_workspace_name" {
  description = "The name of the Microsoft Fabric workspace"
  type        = "string"
  default     = "FileProcessing"
}

variable "fabric_lakehouse_name" {
  description = "The name of the Microsoft Fabric lakehouse"
  type        = "string"
  default     = "FileProcessorLakehouse"
}

variable "parser_function_endpoint" {
  description = "HTTP endpoint for format detection parser (FastAPI server)"
  type        = string
  default     = "http://localhost:8000/detect-format"
}

variable "onelake_workspace" {
  description = "Microsoft Fabric OneLake workspace name (for Delta table storage)"
  type        = string
  default     = ""
}

variable "onelake_lakehouse" {
  description = "Microsoft Fabric OneLake lakehouse name (for Delta table storage)"
  type        = string
  default     = ""
}

variable "onelake_table" {
  description = "Table name in OneLake for canonical normalized data"
  type        = string
  default     = "normalized_data"
}

variable "synapse_admin_password" {
  description = "SQL Administrator password for Synapse Workspace. Must meet Azure complexity requirements."
  type        = string
  sensitive   = true
}
