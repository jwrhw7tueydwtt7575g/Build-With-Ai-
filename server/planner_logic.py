"""
GPT-4o Planner Logic
Orchestrates the Execution Plan and Insight Generation.
"""

import json
from typing import List, Dict

UNIVERSAL_NORMALIZATION_PROMPT = """
You are a Staff Data Engineer setting up the foundation for an Enterprise AI Data Pipeline.
Based on the file identity and a 50-row sample of raw data, infer a universal Canonical JSON Schema.

File Source: {filename}
Sample Rows (up to 50): 
{sample_rows}

### OBJECTIVE:
Generate a single Canonical JSON object that will be stored in Synapse Delta tables.

### REQUIRED JSON STRUCTURE:
{{
  "file_identity": "name of the file",
  "domain_detection": {{
    "domain": "e.g., customer_support, financial_transactions",
    "entity": "e.g., complaint, invoice"
  }},
  "fields": [
    {{
      "name": "Column Name",
      "type": "string | integer | float | boolean | timestamp",
      "semantic_label": "e.g., User Email, Transaction Amount",
      "sample": "Example value from rows",
      "anomaly_flags": [],
      "quality_score": 100
    }}
  ],
  "meta": {{
    "total_row_count_estimate": 0,
    "null_rates_estimate": 0.0,
    "pipeline_version": "v1.0"
  }}
}}

Rules:
- Be precise and ensure output is strictly valid JSON format.
- Deduce the correct data types and semantic labels from the data.
"""

PLANNER_PROMPT = """
You are a Lead Data Pipeline Architect. Based on the statistical digest of a full dataset and its canonical schema, generate a structured JSON Execution Plan for cleaning, anomaly detection, and enrichment.

### DATASET DIGEST (Step 5 Output):
{digest}

### CANONICAL SCHEMA (Step 3 Output):
{schema}

### OBJECTIVE:
Generate a valid JSON execution plan following Step 6 requirements.

### REQUIRED JSON STRUCTURE:
{{
  "cleaning_decisions": [
    {{
      "field": "Column Name",
      "rule": "normalize_to_iso8601 | fill_null_mode | drop_null_rows | cast_to_numeric",
      "reason": "Why this rule was chosen based on null rates or format inconsistencies"
    }}
  ],
  "anomaly_decisions": [
    {{
      "field": "Numeric Column Name",
      "action": "isolation_forest_scan",
      "reason": "Extreme outliers detected in histogram/stats"
    }}
  ],
  "enrichment_decisions": [
    {{
      "field": "Text/Categorical Column Name",
      "methods": ["sentiment_analysis", "entity_extraction", "urgency_scoring"],
      "reason": "Why this field was enriched (e.g., detected customer sentiment patterns)",
      "importance": "high | medium | low"
    }}
  ],
  "skip_list": [
    {{
      "field": "Column Name",
      "reason": "Why this field was skipped (e.g., boolean already clean, numeric no outliers)"
    }}
  ]
}}

Rules:
- Cleaning: If null rate > 2% or types mismatch, assign a rule.
- Anomaly: Only for numeric fields with statistical spikes.
- Enrichment: Only for free-text/categorical fields.
- Ensure the output is strictly valid JSON.
"""

INSIGHT_PROMPT = """
You are a Lead Data Scientist and Business Analyst. Based on the final enriched digest below (post-cleaning, with patterns discovered), generate a comprehensive analytical report in JSON format.

Enriched Summary & Patterns:
{enriched_summary}

### REQUIRED JSON STRUCTURE:
  "insights": [
    {{
      "headline": "Plain-English executive takeaway (e.g., 67% of complaints ...)",
      "evidence_fields": ["List of fields supporting this finding"],
      "confidence_score": 0.95,
      "recommended_action": "Specific business action to take based on this finding"
    }}
  ],
  "suggested_nlq_queries": [
    "A natural language question grounded in the specific fields found (e.g. 'How many rows have null Temperature?')",
    "A question about a specific pattern discovered",
    "A question about specific anomalies detected"
  ]
}}

Rules:
- Generate 3 to 5 actionable insight cards.
- Be factual, specific, and grounded entirely in the digested summary, correlations, and patterns.
- Ensure the output is strictly valid JSON.
"""

class ExecutionPlanner:
    def __init__(self, openai_client):
        self.client = openai_client

    def generate_canonical_schema(self, filename: str, sample_rows: List[Dict], deployment_name: str = "gpt-4o") -> Dict:
        """Step 3: Calls Azure OpenAI to generate canonical schema."""
        response = self.client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": "You are a lead data engineering AI."},
                {"role": "user", "content": UNIVERSAL_NORMALIZATION_PROMPT.format(
                    filename=filename,
                    sample_rows=json.dumps(sample_rows[:50])
                )}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    def generate_plan(self, digest: str, schema: str, deployment_name: str = "gpt-4o") -> Dict:
        """Step 6: Calls Azure OpenAI to generate the execution plan based on the digest."""
        response = self.client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": "You are a lead pipeline architect."},
                {"role": "user", "content": PLANNER_PROMPT.format(digest=digest, schema=schema)}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    def generate_insights(self, enriched_summary: str, deployment_name: str = "gpt-4o") -> Dict:
        """Calls Azure OpenAI to generate business insights in JSON format."""
        response = self.client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": "You are a data scientist and business analyst."},
                {"role": "user", "content": INSIGHT_PROMPT.format(enriched_summary=enriched_summary)}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    def chat_with_data(self, question: str, data_context: Dict, deployment_name: str = "gpt-4o") -> Dict:
        """Step 11: Conversational NLQ backed by real data context."""
        fields = data_context.get("fields", [])
        sample_rows = data_context.get("rows", [])[:10]  # send first 10 rows as context
        patterns = data_context.get("patterns", [])
        insights = data_context.get("insights", [])
        cleaning_metrics = data_context.get("cleaning_metrics", {})
        enrichment_summary = data_context.get("enrichment_summary", {})

        system_prompt = f"""You are a Senior Data Intelligence Agent embedded in an enterprise AI pipeline.
You have full access to a dataset that was uploaded and processed through an 11-step Azure Synapse pipeline.

=== DATASET SCHEMA ===
{json.dumps(fields, indent=2)}

=== SAMPLE ROWS (first 10) ===
{json.dumps(sample_rows, indent=2)}

=== AUTOMATED ENRICHMENTS (AI Justifications) ===
{json.dumps(enrichment_summary, indent=2)}

=== DISCOVERED PATTERNS & ANOMALIES ===
{json.dumps(patterns, indent=2)}

=== EXECUTIVE INSIGHTS ===
{json.dumps(insights, indent=2)}

=== DATA QUALITY METRICS ===
{json.dumps(cleaning_metrics, indent=2)}

You MUST answer ONLY based on this data. Do NOT hallucinate fields or rows not present. 
When appropriate, generate a Synapse-compatible SQL query for the user's question.
Respond in JSON with this exact structure:
{{
    "human_readable_answer": "Plain English answer grounded in the dataset",
    "sql": "SELECT ... (or null if not applicable)",
    "confidence": 0.95
}}"""

        response = self.client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

