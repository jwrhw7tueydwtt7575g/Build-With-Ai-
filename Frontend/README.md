# ⚛️ Aether Flow: Interactive Dashboard (Frontend)

A premium Next.js 14 dashboard designed for high-altitude observability of autonomous data pipelines.

---

## 🎨 Design Principles

- **Glassmorphism**: Sleek, transparent UI elements with subtle borders and backdrop blurs.
- **Micro-Animations**: Framer Motion powered transitions for data updates and card entry.
- **Aetheric Theme**: A deep, futuristic dark mode tailored for enterprise intelligence.

---

## 🏗️ Project Structure

- **`lib/pipeline-context.tsx`**: The reactive heartbeat. It polls the backend and distributes the 11-step state to all components.
- **`components/rich-dashboard.tsx`**: The main insight grid featuring quality scores, enrichment tooltips, and signal analysis.
- **`components/nlq-panel.tsx`**: The conversational hub with dynamic query suggestions.
- **`components/anomaly-explorer.tsx`**: Interactive visualization of statistical outliers.

---

## 🚀 Execution

1.  **Install**: `npm install`
2.  **Dev Mode**: `npm run dev`
3.  **Build**: `npm run build`

---

## 🔧 Component Library

Built using a curated selection of **Shadcn UI** primitives, customized with Framer Motion for a premium, alive feel.
- **Icons**: Lucide React.
- **Styling**: Tailwind CSS with custom `glass-effect` utilities.
