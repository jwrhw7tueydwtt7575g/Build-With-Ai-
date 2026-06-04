"""
Spark Digest Builder
Generates a statistical summary of a Spark DataFrame / Delta Table
for GPT-4o Execution Planner.
"""

import json
from typing import Dict, Any

def build_statistical_digest(df) -> str:
    """
    Builds a compact JSON digest (target ~400 tokens) from a Spark DataFrame.
    """
    total_rows = df.count()
    schema = df.schema.jsonValue()
    
    # Get column metadata
    cols = df.columns
    digest = {
        "dataset_stats": {
            "total_rows": total_rows,
            "column_count": len(cols)
        },
        "columns": []
    }
    
    # Analyze each column
    for col_name in cols:
        col_type = next(f['type'] for f in schema['fields'] if f['name'] == col_name)
        
        # Calculate nulls and distincts
        null_count = df.where(df[col_name].isNull()).count()
        distinct_count = df.select(col_name).distinct().count()
        
        col_info = {
            "name": col_name,
            "type": col_type,
            "null_pct": round((null_count / total_rows) * 100, 2) if total_rows > 0 else 0,
            "distinct_count": distinct_count
        }
        
        # Add sample values or stats
        if col_type in ['integer', 'long', 'double', 'float', 'decimal']:
            stats = df.select(col_name).summary("min", "max", "mean").collect()
            col_info["stats"] = {row['summary']: row[col_name] for row in stats}
        elif col_type == 'string':
            # Get top 3 most frequent values as sample
            samples = df.groupBy(col_name).count().orderBy("count", ascending=False).limit(3).collect()
            col_info["samples"] = [str(row[col_name]) for row in samples]
            
        digest["columns"].append(col_info)
        
    return json.dumps(digest, indent=2)

if __name__ == "__main__":
    # This would be part of a Spark job
    print("Spark Digest Builder Module Loaded")
