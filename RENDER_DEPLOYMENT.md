# ☁️ Deploying Aether Flow to Render

Aether Flow is configured to deploy seamlessly to [Render](https://render.com/) using the IaC "Blueprint" method. 
We have already generated a `render.yaml` file at the root of the project to automatically configure both the FastAPI Backend and the Next.js Frontend.

## 🚀 1-Click Deployment Steps

1. **Push your code to GitHub**: Make sure the your latest branch with `render.yaml` and the newly updated `lib/api.ts` is pushed to GitHub.
   ```bash
   git add .
   git commit -m "Ready for Render Deployment"
   git push origin main
   ```

2. **Connect to Render**:
   - Go to the Render Dashboard (https://dashboard.render.com).
   - Click **New** > **Blueprint**.

3. **Select Repository**:
   - Connect your GitHub account and select your repository: `jwrhw7tueydwtt7575g/Build-With-Ai-`.
   - Render will automatically detect the `render.yaml` file.

4. **Environment Variables**:
   When Render parses the blueprint, it will prompt you to enter the missing environment variables for the Backend service:
   - `AZURE_OPENAI_ENDPOINT` = `https://<YOUR_ENDPOINT>.openai.azure.com/`
   - `AZURE_OPENAI_API_KEY` = `<YOUR_KEY>`
   
   *(Note: The frontend `NEXT_PUBLIC_API_URL` is automatically wired to the backend by the Blueprint).*

5. **Deploy**:
   - Click **Apply**.
   - Render will spin up two services parallelly:
     - `aether-flow-backend` (Python FastApi)
     - `aether-flow-frontend` (NextJS)
   - Wait ~2-3 minutes for the build to finish. Your dashboard will be live at the frontend URL! 🎉

---
### ⚠️ Why this works
- The Frontend `lib/api.ts` was updated to read `process.env.NEXT_PUBLIC_API_URL` dynamically.
- The Backend allows CORS so the two separate Render instances can communicate smoothly.
