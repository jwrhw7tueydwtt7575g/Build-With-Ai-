# 🐍 Aether Flow: Analytical Core (Server)

The analytical core is a high-performance FastAPI backend that orchestrates the 11-step autonomous data pipeline.

---

## 🛠️ Technical Architecture

- **Orchestrator**: `main.py` manages the state transition of data as it moves through the steps.
- **Execution Planner**: `planner_logic.py` uses GPT-4o to generate dynamic cleaning and enrichment rules from data digests.
- **Spark Jobs**: `spark_jobs/synapse_jobs.py` maps complex PySpark logic to the local environment, handling cleaning, IQR-based anomaly detection, and enrichment.
- **NLQ Engine**: Real-time grounded Q&A backed by the latest pipeline state.

---

## 🔄 11-Step Pipeline Detail

1.  **Ingestion & Mapping**: Normalize arbitrary CSVs into canonical JSON.
2.  **Statistical Digest**: Automated variance and null-pattern analysis.
3.  **AI Planning**: GPT-4o "scripts" the programmatic cleaning and enrichment logic.
4.  **Refinement**: Spark-driven cleaning and AI Language enrichment.
5.  **Pattern Discovery**: Detection of statistical outliers (IQR) and correlations.
6.  **Synthesis**: Final executive insights and suggested NLQ queries.

---

## 🛠️ Setup

1.  **Environment**: Add your `AZURE_OPENAI_API_KEY` and `ENDPOINT` to `.env`.
2.  **Install**: `pip install -r requirements.txt`
3.  **Run**: `python main.py`

---

## 📦 Core Dependencies

- **FastAPI**: Asynchronous web server.
- **Pandas/NumPy**: Big data manipulation and statistical profiling.
- **Scikit-learn**: Pattern discovery and variance analysis.
- **OpenAI Python SDK**: Deep reasoning and NLQ generation.
