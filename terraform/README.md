# 🏗️ Aether Flow: Infrastructure (Terraform)

This directory contains the Infrastructure-as-Code (IaC) configuration for the Aether Flow platform, ensuring a secure and scalable Azure-native deployment.

---

## 🛠️ Resources Provisioned

- **Azure Data Lake Storage Gen2 (ADLS)**: The primary storage backbone with hierarchical namespace.
  - *Zones*: `landing` (raw ingestion) and `curated` (processed Delta tables).
- **Azure Synapse Analytics Workspace**: The central engine for Spark-based cleaning and SQL-based NLQ.
  - *Spark Pools*: Configured for auto-scaling during Step 6-8 execution.
  - *Serverless SQL*: Used to power the natural language query layer in Step 11.
- **Azure AI Services**:
  - *Azure OpenAI (GPT-4o)*: The reasoning and planning engine.
  - *Azure AI Language*: Powering sentiment and entity enrichment.
- **Azure Key Vault**: Stores API keys, SQL connection strings, and storage keys.
- **Managed Identities**: System-assigned identity for Synapse, enabling zero-trust access to ADLS and Key Vault.

---

## 🚀 Deployment Guide

1.  **Initialize**:
    ```bash
    terraform init
    ```
2.  **Configure**: Update `terraform.tfvars` with your Azure region and naming prefixes.
3.  **Plan**:
    ```bash
    terraform plan -out=tfplan
    ```
4.  **Apply**:
    ```bash
    terraform apply "tfplan"
    ```

---

## 🛡️ Security Architecture

The infrastructure implements **Identity-based access control** instead of hardcoded keys:
- Synapse Spark jobs authenticate to ADLS via **Storage Blob Data Contributor** role assigned to its Managed Identity.
- All secrets are fetched at runtime from **Key Vault** via `main.py`.
