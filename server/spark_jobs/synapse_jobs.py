import pandas as pd
import json
import numpy as np
from typing import Dict

# In a true deployment, this would be a PySpark job using pyspark.sql functions.
# For local testing and simulation, we map the exact Synapse Spark logic via Pandas.

def step5_generate_statistical_digest(delta_table_path: str) -> dict:
    """
    Step 5: Statistical Digest Generation
    Runs on the full Delta table. Generates ~420 tokens representation.
    """
    # Simulated reading of Delta table (using local mock)
    try:
        with open("local_delta_mock.json", "r") as f:
            canonical_json = json.load(f)
    except FileNotFoundError:
        return {}

    df = pd.DataFrame(canonical_json.get("rows", []))
    total_rows = len(df)
    digest = {}
    
    for field in canonical_json.get("fields", []):
        col = field["name"]
        if col not in df.columns:
            continue
            
        # Harden null detection: check for None, empty string, and literal 'null' strings
        null_mask = df[col].isnull() | (df[col] == "") | (df[col].astype(str).str.lower().isin(['null', 'n/a', 'nan']))
        null_count = int(null_mask.sum())
        null_rate = round((null_count / total_rows) * 100, 2) if total_rows > 0 else 0
        
        # Numeric checks
        if field["type"] in ['integer', 'float']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            clean_col = df[col].dropna()
            digest[col] = {
                "type": "numeric",
                "count": total_rows,
                "null_count": null_count,
                "min": float(clean_col.min()) if not clean_col.empty else None,
                "max": float(clean_col.max()) if not clean_col.empty else None,
                "median": float(clean_col.median()) if not clean_col.empty else None,
                "stddev": float(clean_col.std()) if len(clean_col) > 1 else None,
                "outliers_potential": "high" if not clean_col.empty and (clean_col.skew() > 2 or clean_col.skew() < -2) else "low"
            }
        else:
            # Categorical / Text checks
            unique_count = int(df[col].nunique())
            digest[col] = {
                "type": "categorical/text",
                "null_count": null_count,
                "unique_count": unique_count,
                "top_freq": df[col].value_counts().head(3).to_dict()
            }
            
    return digest

def step7_execute_cleaning(plan: dict, delta_table_path: str):
    """
    Step 7: Synapse applies LLM logic field by field on full table.
    """
    # This logic represents Spark mapping over rows
    with open(delta_table_path, "r") as f:
        data = json.load(f)
        
    df = pd.DataFrame(data.get("rows", []))
    initial_rows = len(df)
    # Harden null detection across all columns
    for col in df.columns:
        df[col] = df[col].replace(['', 'null', 'N/A', 'nan', 'NaN'], np.nan)
        
    initial_nulls = df.isnull().sum().sum()
    
    for decision in plan.get("cleaning_decisions", []):
        col = decision["field"]
        rule = decision["rule"]
        if col in df.columns:
            if rule == "fill_null_mode":
                mode = df[col].mode()[0] if not df[col].mode().empty else "Unknown"
                df[col] = df[col].fillna(mode)
            elif rule == "normalize_to_iso8601":
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%dT%H:%M:%SZ')
            elif rule == "drop_null_rows":
                df = df.dropna(subset=[col])
                
    final_rows = len(df)
    final_nulls = df.isnull().sum().sum()
    
    # Intuitive Row-based Quality Score: % of rows that have zero nulls
    rows_with_nulls_pre = df.isnull().any(axis=1).sum() if initial_rows > 0 else 0
    quality_pre = int(max(0, 100 - (rows_with_nulls_pre / max(1, initial_rows)) * 100))
    
    # After clean (simplified mock: assume some rows were dropped or filled)
    rows_with_nulls_post = df.isnull().any(axis=1).sum() if final_rows > 0 else 0
    quality_post = int(max(0, 100 - (rows_with_nulls_post / max(1, final_rows)) * 100))

    data["rows"] = df.to_dict(orient="records")
    
    cleaning_metrics = {
        "quality_score_delta": [quality_pre, quality_post],
        "dropped_nulls": int(initial_nulls - final_nulls),
        "duplicates_removed": int(initial_rows - final_rows)
    }
    data["cleaning_metrics"] = cleaning_metrics

    # Write back isolated updates
    with open(delta_table_path, "w") as f:
        json.dump(data, f, indent=2)
        
    return {"status": "success", "cleaning_metrics": cleaning_metrics}

def step8_run_enrichment(plan: Dict, delta_table_path: str):
    """
    Step 8: AI Enrichment (Batch mode to Azure AI Language).
    Uses the decisions from the planner to determine which fields to enrich.
    """
    with open(delta_table_path, "r") as f:
        data = json.load(f)
        
    df = pd.DataFrame(data.get("rows", []))
    
    enrichment_decisions = plan.get("enrichment_decisions", [])
    added_features_metadata = []
    
    # Process decisions from the plan
    for decision in enrichment_decisions:
        col = decision.get("field")
        if col not in df.columns:
            continue
            
        methods = decision.get("methods", [])
        for method in methods:
            feature_name = f"{col}_{method}"
            if "sentiment" in method:
                df[feature_name] = "Neutral" # Mock
            elif "urgency" in method:
                df[feature_name] = np.random.uniform(0.1, 0.9, len(df)) # Mock
            else:
                df[feature_name] = "Extracted Entity" # Mock
                
            added_features_metadata.append({
                "name": feature_name,
                "reason": decision.get("reason", "Inferred via semantic analysis"),
                "importance": decision.get("importance", "medium")
            })
            
            # Map newly created feature to original fields for the schema
            data["fields"].append({"name": feature_name, "type": "string" if "sentiment" in method else "float"})

    data["rows"] = df.to_dict(orient="records")

    enrichment_summary = {
        "features": added_features_metadata,
        "merged_sources": ["Azure Cognitive AI Language", "Local Domain Extractor"]
    }
    data["enrichment_summary"] = enrichment_summary

    with open(delta_table_path, "w") as f:
        json.dump(data, f, indent=2)
        
    return {"status": "success", "enrichments_added": len(added_features_metadata), "enrichment_summary": enrichment_summary}

def step9_pattern_discovery(delta_table_path: str):
    """
    Step 9: Synapse Spark cross-correlation analysis (Isolation Forest).
    """
    with open(delta_table_path, "r") as f:
        data = json.load(f)
    
    df = pd.DataFrame(data.get("rows", []))
    
    # Explicitly cast fields that are supposed to be numeric
    for field in data.get("fields", []):
        if field.get("type") in ["integer", "float"] and field["name"] in df.columns:
            df[field["name"]] = pd.to_numeric(df[field["name"]], errors='coerce')

    patterns = []
    
    num_df = df.select_dtypes(include=['float64', 'int64', 'float32', 'int32'])
    if not num_df.empty and len(num_df.columns) > 1:
        corr = num_df.corr()
        for i in range(len(corr.columns)):
            for j in range(i+1, len(corr.columns)):
                val = corr.iloc[i, j]
                if abs(val) > 0.7:
                    col1, col2 = corr.columns[i], corr.columns[j]
                    patterns.append({
                        "type": "correlation",
                        "insight": f"High correlation ({val:.2f}) between {col1} and {col2}",
                        "fields": [col1, col2],
                        "severity": "medium",
                        "details": f"Analysis over active records shows strong predictive capability between {col1} and {col2}. Ideal for dimensionality reduction."
                    })
                    break 
        
        for col in num_df.columns:
            # Robust IQR (Interquartile Range) approach for small/medium datasets
            # Much more reliable than 3-sigma for identifying outliers in noisy data
            q1 = num_df[col].quantile(0.25)
            q3 = num_df[col].quantile(0.75)
            iqr = q3 - q1
            
            if iqr > 0:
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                anomalies = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
            else:
                # Fallback to 2-sigma if dataset is too uniform for IQR
                mean = num_df[col].mean()
                std = num_df[col].std()
                anomalies = df[abs(df[col] - mean) > (2 * std)] if std > 0 else []

            if len(anomalies) > 0:
                patterns.append({
                    "type": "anomaly",
                    "insight": f"Outlier collection detected in '{col}'",
                    "fields": [col],
                    "severity": "high",
                    "details": f"Detected {len(anomalies)} records deviating significantly from the main cluster in field '{col}'. Investigated via robust IQR bounds."
                })
                    
    data["patterns"] = patterns
    with open(delta_table_path, "w") as f:
        json.dump(data, f, indent=2)
        
    return patterns
