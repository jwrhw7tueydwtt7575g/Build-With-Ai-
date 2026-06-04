#!/bin/bash
# Comprehensive Test Suite for AETHER FLOW Pipeline Fixes

# Move to the root of the project
cd "/home/vivek/Desktop/Build With AI"

# Check if server is already running, if not start it
if ! lsof -i:8000 > /dev/null; then
    echo "Starting FastAPI server..."
    cd server
    source venv/bin/activate
    python main.py &
    SERVER_PID=$!
    cd ..
    sleep 5
else
    echo "Using existing server on port 8000"
    SERVER_PID=""
fi

echo -e "\n\n======================================================="
echo "STEP 1-4: Ingestion & Normalization"
echo "======================================================="
curl -s -X POST "http://localhost:8000/webhook/blob-created" \
     -H "Content-Type: application/json" \
     -d '{
           "url": "/home/vivek/Desktop/Build With AI/wholesale-trade-survey-december-2025-quarter.csv"
         }' | jq

echo -e "\n\n======================================================="
echo "STEP 5-10: Synapse Pipeline (Cleaning, Enrichment, Patterns)"
echo "======================================================="
curl -s -X POST "http://localhost:8000/api/run-synapse-pipeline" \
     -H "Content-Type: application/json" \
     -d '{}' | jq

echo -e "\n\n======================================================="
echo "VERIFYING: /api/stats (Dynamic Footer Data)"
echo "======================================================="
curl -s http://localhost:8000/api/stats | jq

echo -e "\n\n======================================================="
echo "VERIFYING: /apply-execution (Signal vs Noise check)"
echo "======================================================="
# We need to send the execution plan from earlier, but for a smoke test 
# we'll just check if the endpoint returns the signal_vs_noise key
curl -s -X POST "http://localhost:8000/apply-execution" \
     -H "Content-Type: application/json" \
     -d '{"plan": {}}' | jq '.signal_vs_noise'

echo -e "\n\n======================================================="
echo "STEP 11: Real NLQ Layer (GPT-4o Response)"
echo "======================================================="
curl -s -X POST "http://localhost:8000/api/nlq" \
     -H "Content-Type: application/json" \
     -d '{"question": "Summarize the data quality and tell me how many rows were processed."}' | jq

if [ ! -z "$SERVER_PID" ]; then
    echo -e "\n\nStopping background server..."
    kill $SERVER_PID
fi
