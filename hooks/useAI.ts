import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Service } from './useServices';
import { useAuth } from '../contexts/AuthContext';

export interface Recommendation {
    service: Service;
    score: number;
    reason: string;
}

import { logger } from '../utils/logger';

export const useAI = () => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [proactiveTip, setProactiveTip] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth(); // Get authenticated user

    const searchServices = async (query: string, allServices: Service[]) => {
        setLoading(true);
        setProactiveTip(null); // Reset tip on new search
        const userId = user?.id; // Extract user ID
        logger.info('AI Search Initiated', { query, userId });

        try {
            // 1. Try to call the Edge Function (Real Implementation)
            const { data, error } = await supabase.functions.invoke('recommend', {
                body: {
                    query,
                    userId // Pass userId to the AI agent
                }
            });

            if (!error && data) {
                logger.info('Edge Function returned results', { resultCount: data.results?.length });

                if (data.results) {
                    setRecommendations(data.results.map((item: any) => ({
                        service: item, // item contains service fields
                        score: item.similarity,
                        reason: 'Baseado na similaridade semântica.'
                    })));
                }

                if (data.proactive_tip) {
                    setProactiveTip(data.proactive_tip);
                }

                return;
            }

            logger.warn('Edge Function failed or unavailable, falling back to local simulation.', { error });

            // 2. Fallback: Local Keyword Matching (Simulation for Demo)
            // ... (keep existing fallback logic)
            // For demo purposes, we can simulate a proactive tip here too if needed
            // but sticking to standard fallback for now.

            const lowerQuery = query.toLowerCase();
            const keywords = lowerQuery.split(' ');

            const scored = allServices.map(service => {
                let score = 0;
                const text = (service.name + ' ' + (service.category || '')).toLowerCase();

                keywords.forEach(word => {
                    if (text.includes(word)) score += 0.3;
                });

                // Boost based on "vibes" (random noise to simulate AI variance)
                score += Math.random() * 0.2;

                return { service, score: Math.min(score, 0.99) };
            });

            const top3 = scored
                .filter(s => s.score > 0.2)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(s => ({
                    ...s,
                    reason: `Combina com "${query}"`
                }));

            setRecommendations(top3);
            logger.info('Local fallback search completed', { resultCount: top3.length, userId });

        } catch (err) {
            logger.error('AI Search Critical Error', err, { query, userId });
        } finally {
            setLoading(false);
        }
    };

    return { recommendations, searchServices, loading, proactiveTip, setProactiveTip };
};
