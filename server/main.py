from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
from dotenv import load_dotenv
import os
import json
import csv
import pandas as pd
import numpy as np
from io import StringIO, BytesIO
from typing import Dict
from planner_logic import ExecutionPlanner
import openai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AETHER FLOW - Generalized API",
    description="Enterprise AI Data Pipeline based on 11-step Azure Blueprint",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI Client
client = openai.AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", "https://mock-endpoint"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY", "mock-key"),
    api_version="2023-05-15"
)

# --- MOCK AZURE SERVICES FOR PIPELINE ---

def download_blob_content(blob_url: str) -> bytes:
    """Mock download from Azure Blob Storage."""
    if os.path.exists(blob_url):
        logger.info(f"Loading local file for testing: {blob_url}")
        with open(blob_url, "rb") as f:
            return f.read()
    return b"mock,data,csv\n1,test,file\n"

def parse_with_content_understanding(file_content: bytes, ext: str) -> list:
    """Step 2: Format Detection & Parsing."""
    logger.info(f"Targeting parser for: {ext}")
    # Simulating Azure Content Understanding / Document Intelligence
    if ext == 'csv':
        decoded = file_content.decode('utf-8', errors='ignore')
        reader = csv.DictReader(StringIO(decoded))
        rows = []
        for row in reader:
            # Treat empty strings as None for reliable null detection downstream
            processed_row = {k: (v if v != "" else None) for k, v in row.items()}
            rows.append(processed_row)
        return rows
    elif ext == 'json':
        data = json.loads(file_content.decode('utf-8'))
        return data if isinstance(data, list) else [data]
    else:
        # Fallback to Text Extractor
        return [{"raw_text_block": file_content.decode('utf-8', errors='ignore')}]

def write_to_synapse_delta(canonical_json: dict):
    """Step 4: Storage in Azure Synapse Analytics (Delta Lake)."""
    # Simulate writing Canonical JSON to Delta Table
    logger.info("Writing Canonical JSON to Synapse Delta Table.")
    with open("local_delta_mock.json", "w") as f:
         json.dump(canonical_json, f, indent=2)
    return True

# --- PIPELINE ENDPOINTS ---

@app.post("/webhook/blob-created", tags=["Ingestion: Step 1-4"])
async def trigger_pipeline(request: Request, background_tasks: BackgroundTasks):
    """
    Step 1: Event Grid Trigger - Blob Created.
    Expected Payload: EventGridEvent Schema (or direct invoke payload for testing)
    """
    try:
        body = await request.json()
        
        # Handle EventGrid Validation
        if isinstance(body, list) and len(body) > 0 and 'eventType' in body[0]:
            if body[0]['eventType'] == 'Microsoft.EventGrid.SubscriptionValidationEvent':
                return {"validationResponse": body[0]['data']['validationCode']}
            
            event_data = body[0]['data']
            blob_url = event_data.get('url', 'test.csv')
        else:
            # Direct invokation for testing purposes
            blob_url = body.get('url', 'test.csv')
            
        filename = blob_url.split('/')[-1]
        ext = filename.split('.')[-1].lower() if '.' in filename else 'csv'
        
        # Step 2: Download & Extract Raw Content
        file_content = download_blob_content(blob_url)
        raw_rows = parse_with_content_understanding(file_content, ext)
        
        # Step 3: GPT-4o Universal Normalization
        sample_rows = raw_rows[:50]
        planner = ExecutionPlanner(client)
        
        canonical_json = planner.generate_canonical_schema(
            filename=filename,
            sample_rows=sample_rows,
            deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
        )
        
        # Embed the raw data as requested initially (Normally only samples are kept, or pointers to raw)
        canonical_json['rows'] = sample_rows
        
        # Step 4: Storage in Azure Synapse Analytics
        write_to_synapse_delta(canonical_json)
        
        # Trigger Downstream Async Tasks (Step 5+)
        # background_tasks.add_task(trigger_synapse_job_step5, canonical_json)
        
        return {
            "status": "Accepted",
            "message": "Steps 1-4 executed successfully.",
            "canonical_schema": canonical_json
        }
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from spark_jobs.synapse_jobs import step5_generate_statistical_digest, step7_execute_cleaning, step8_run_enrichment, step9_pattern_discovery

@app.post("/api/run-synapse-pipeline", tags=["Synapse Execution: Steps 5-10"])
async def run_synapse_pipeline():
    """
    Triggers Steps 5 through 10 directly on the Delta Lake data.
    """
    planner = ExecutionPlanner(client)
    
    # Step 5
    digest = step5_generate_statistical_digest("local_delta_mock.json")
    
    with open("local_delta_mock.json", "r") as f:
        schema = json.load(f)
        
    # Step 6
    plan = planner.generate_plan(json.dumps(digest), json.dumps(schema.get("fields", [])[:50]))
    
    # Step 7
    step7_execute_cleaning(plan, "local_delta_mock.json")
    
    # Step 8
    step8_run_enrichment(plan, "local_delta_mock.json")
    
    # Step 9
    patterns = step9_pattern_discovery("local_delta_mock.json")
    
    # Step 10
    # Reload latest state after enrichment and pattern discovery
    with open("local_delta_mock.json", "r") as f:
        final_data = json.load(f)
        
    enriched_summary_str = f"Patterns Found: {json.dumps(patterns)}. Schema Info: {json.dumps(final_data.get('fields'))}"
    insights = planner.generate_insights(enriched_summary_str)
    
    # Reload latest state to capture enrichment_summary and other updates from spark jobs
    with open("local_delta_mock.json", "r") as f:
        latest_data = json.load(f)
        
    # Merge Step 10 insights into latest data
    latest_data["insights"] = insights.get("insights", [])
    latest_data["suggested_queries"] = insights.get("suggested_nlq_queries", [])
    
    with open("local_delta_mock.json", "w") as f:
        json.dump(latest_data, f, indent=2)
        
    return {
        "status": "Pipeline Steps 5-10 Complete",
        "plan": plan,
        "insights": insights
    }

@app.post("/api/nlq", tags=["Step 11: NLQ Layer"])
async def nlq_query(request: Request):
    """
    Step 11: Natural Language Query Layer — real GPT-4o answer grounded in dataset context.
    """
    body = await request.json()
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    # Load full pipeline state as context for GPT-4o
    try:
        with open("local_delta_mock.json", "r") as f:
            data_context = json.load(f)
    except FileNotFoundError:
        data_context = {}

    planner = ExecutionPlanner(client)
    result = planner.chat_with_data(
        question=question,
        data_context=data_context,
        deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    )
    return result


@app.get("/api/stats", tags=["Step 11: NLQ Layer"])
async def get_pipeline_stats():
    """
    Returns real-time computed statistics from the latest pipeline run.
    Used by the frontend footer and Execution Intelligence panel.
    """
    try:
        with open("local_delta_mock.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        return {"total_rows": 0, "field_count": 0, "quality_score": 0, "pattern_count": 0,
                "insight_count": 0, "token_estimate": 0, "avg_confidence": 0, "insight_clusters": 0}

    rows = data.get("rows", [])
    fields = data.get("fields", [])
    patterns = data.get("patterns", [])
    insights = data.get("insights", [])
    cleaning_metrics = data.get("cleaning_metrics", {})

    # Rough GPT token estimate: each row × field pair ≈ 4 tokens
    token_estimate = len(rows) * max(len(fields), 1) * 4

    # Data quality from cleaning step
    quality_delta = cleaning_metrics.get("quality_score_delta", [0, 0])
    quality_score = quality_delta[1] if len(quality_delta) > 1 else 0

    # Average model confidence from insight cards
    avg_confidence = 0.0
    if insights:
        scores = [i.get("confidence_score", 0) for i in insights if isinstance(i, dict)]
        avg_confidence = round((sum(scores) / len(scores)) * 100, 1) if scores else 0.0

    return {
        "total_rows": len(rows),
        "field_count": len(fields),
        "quality_score": quality_score,
        "pattern_count": len(patterns),
        "insight_count": len(insights),
        "token_estimate": token_estimate,
        "avg_confidence": avg_confidence,
        "insight_clusters": len(patterns) + len(insights),
        "suggested_queries": data.get("suggested_queries", [])
    }

@app.post("/normalize", tags=["Legacy Frontend Support"])
async def support_normalize(file: UploadFile = File(...)):
    content = await file.read()
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'csv'
    raw_rows = parse_with_content_understanding(content, ext)
    
    sample_rows = raw_rows[:50]
    planner = ExecutionPlanner(client)
    
    canonical_json = planner.generate_canonical_schema(
        filename=file.filename,
        sample_rows=sample_rows,
        deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    )
    canonical_json['rows'] = sample_rows
    write_to_synapse_delta(canonical_json)
    
    digest = step5_generate_statistical_digest("local_delta_mock.json")
    
    return {
        "data": sample_rows,
        "audit_trail": [{"action": "Ingested via /normalize", "details": "File parsed and normalized", "timestamp": str(datetime.now())}],
        "digest": digest,
        "canonical_schema": canonical_json
    }

@app.post("/generate-plan", tags=["Legacy Frontend Support"])
async def support_generate_plan(request: Request):
    body = await request.json()
    planner = ExecutionPlanner(client)
    plan = planner.generate_plan(json.dumps(body.get("digest")), json.dumps(body.get("schema", {}).get("fields", [])[:50]))
    return plan

@app.post("/apply-execution", tags=["Legacy Frontend Support"])
async def support_apply_execution(request: Request):
    body = await request.json()
    plan = body.get("plan", {})
    step7_execute_cleaning(plan, "local_delta_mock.json")
    step8_run_enrichment(plan, "local_delta_mock.json")
    patterns = step9_pattern_discovery("local_delta_mock.json")

    with open("local_delta_mock.json", "r") as f:
        data = json.load(f)

    # Compute Signal vs Noise weights from numeric field statistics
    # Each field gets an importance score based on its relative standard deviation
    signal_vs_noise = []
    rows = data.get("rows", [])
    if rows:
        import pandas as pd
        df = pd.DataFrame(rows)
        num_cols = df.select_dtypes(include=['float64', 'int64', 'float32', 'int32']).columns.tolist()
        # Also coerce fields declared as numeric in schema
        for field in data.get("fields", []):
            if field.get("type") in ["integer", "float"] and field["name"] in df.columns:
                df[field["name"]] = pd.to_numeric(df[field["name"]], errors='coerce')
                if field["name"] not in num_cols:
                    num_cols.append(field["name"])

        variances = {}
        for col in num_cols:
            std = df[col].dropna().std()
            mean = abs(df[col].dropna().mean())
            if mean > 0:
                variances[col] = float(std / mean)  # Coefficient of Variation

        total_variance = sum(variances.values()) or 1
        signal_vs_noise = [
            {"feature": col, "importance": round(v / total_variance, 4)}
            for col, v in sorted(variances.items(), key=lambda x: -x[1])[:8]
        ]

    return {
        "cleaning_metrics": data.get("cleaning_metrics", {"quality_score_delta": [50, 95], "dropped_nulls": 0, "duplicates_removed": 0}),
        "enrichment_summary": data.get("enrichment_summary", {"added_features": [], "merged_sources": []}),
        "patterns": patterns,
        "signal_vs_noise": signal_vs_noise
    }

@app.post("/generate-insights", tags=["Legacy Frontend Support"])
async def support_generate_insights(request: Request):
    body = await request.json()
    planner = ExecutionPlanner(client)
    
    with open("local_delta_mock.json", "r") as f:
        final_data = json.load(f)
        
    enriched_summary_str = f"Schema Info: {json.dumps(final_data.get('fields'))}"
    insights = planner.generate_insights(enriched_summary_str)
    
    final_data["insights"] = insights.get("insights", [])
    final_data["suggested_queries"] = insights.get("suggested_nlq_queries", [])
    with open("local_delta_mock.json", "w") as f:
        json.dump(final_data, f, indent=2)
        
    return insights.get("insights", [])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
