const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function uploadAndNormalize(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/normalize`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Normalization failed');
    }

    return response.json();
}

export async function generatePlan(request: any) {
    const response = await fetch(`${API_BASE_URL}/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Plan generation failed');
    }

    return response.json();
}

export async function applyExecution(request: any) {
    const response = await fetch(`${API_BASE_URL}/apply-execution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Full-data execution failed');
    }

    return response.json();
}

export async function generateInsights(summary: any) {
    const response = await fetch(`${API_BASE_URL}/generate-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
    });

    if (!response.ok) {
        throw new Error('Insight generation failed');
    }

    return response.json();
}

export async function getStats() {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    if (!response.ok) {
        throw new Error('Stats fetch failed');
    }
    return response.json();
}
