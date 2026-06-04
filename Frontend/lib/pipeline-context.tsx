'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PipelineState {
    currentStep: number;
    status: 'idle' | 'processing' | 'completed' | 'error';
    data: any[];
    insights: any;
    patterns: any[] | null;
    signal_vs_noise: any[] | null;
    planning: any;
    cleaning_metrics: any;
    enrichment_summary: any;
    audit_trail: any[];
    nlq_result: any | null;
    error: string | null;
    pipelineStartTime: number | null;
    pipelineEndTime: number | null;
    suggestedQueries: string[];
}

interface PipelineContextType extends PipelineState {
    startPipeline: (file: File) => Promise<void>;
    updateStep: (step: number) => void;
    resetPipeline: () => void;
    runNlq: (question: string) => Promise<void>;
}

const INITIAL_STATE: PipelineState = {
    currentStep: 0,
    status: 'idle',
    data: [],
    insights: null,
    patterns: null,
    signal_vs_noise: null,
    planning: null,
    cleaning_metrics: null,
    enrichment_summary: null,
    audit_trail: [],
    nlq_result: null,
    error: null,
    pipelineStartTime: null,
    pipelineEndTime: null,
    suggestedQueries: [],
};

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function PipelineProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<PipelineState>(INITIAL_STATE);

    const updateStep = (step: number) => {
        setState((prev) => ({ ...prev, currentStep: step }));
    };

    const startPipeline = async (file: File) => {
        try {
            const startTime = Date.now();
            setState({
                ...INITIAL_STATE,
                currentStep: 1,
                status: 'processing',
                pipelineStartTime: startTime,
            });

            const api = await import('./api');

            // Steps 1-5: Ingestion, Detection, Normalization, Storage, Digest
            updateStep(3);
            const initialResult = await api.uploadAndNormalize(file);
            setState(prev => ({
                ...prev,
                data: initialResult.data || [],
                audit_trail: initialResult.audit_trail || [],
            }));

            // Step 4-5
            updateStep(5);

            // Step 6: LLM Execution Planning
            updateStep(6);
            const planResult = await api.generatePlan({
                digest: initialResult.digest,
                schema: initialResult.canonical_schema,
            });
            setState(prev => ({ ...prev, planning: planResult }));

            // Steps 7-9: Cleaning, Enrichment, Pattern Discovery
            updateStep(7);
            const executionResult = await api.applyExecution({
                plan: planResult,
                data: initialResult.data,
            });
            setState(prev => ({
                ...prev,
                cleaning_metrics: executionResult.cleaning_metrics,
                enrichment_summary: executionResult.enrichment_summary,
                patterns: executionResult.patterns || [],           // ← was missing
                signal_vs_noise: executionResult.signal_vs_noise || [], // ← was missing
            }));

            // Step 8-9 visual advance
            updateStep(9);

            // Step 10: Actionable Insight Synthesis
            updateStep(10);
            const insightResult = await api.generateInsights({
                summary: initialResult.digest,
                cleaning: executionResult.cleaning_metrics,
                enrichment: executionResult.enrichment_summary,
            });
            setState(prev => ({ ...prev, insights: insightResult }));

            // Step 11: SQL Layer Activation and Final Completion
            // Fetch final stats which now contains suggested queries
            const statsRes = await fetch('http://localhost:8000/api/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.suggested_queries) {
                    setState(prev => ({ ...prev, suggestedQueries: statsData.suggested_queries }));
                }
            }

            setState(prev => ({
                ...prev,
                currentStep: 12,
                status: 'completed',
                pipelineEndTime: Date.now(),
            }));
        } catch (err: any) {
            setState(prev => ({ ...prev, status: 'error', error: err.message }));
        }
    };

    const runNlq = async (question: string) => {
        const response = await fetch('http://localhost:8000/api/nlq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
        });
        if (!response.ok) throw new Error('NLQ failed');
        const result = await response.json();
        setState(prev => ({ ...prev, nlq_result: result }));
    };

    const resetPipeline = () => {
        setState(INITIAL_STATE);
    };

    return (
        <PipelineContext.Provider value={{ ...state, startPipeline, updateStep, resetPipeline, runNlq }}>
            {children}
        </PipelineContext.Provider>
    );
}

export function usePipeline() {
    const context = useContext(PipelineContext);
    if (context === undefined) {
        throw new Error('usePipeline must be used within a PipelineProvider');
    }
    return context;
}
