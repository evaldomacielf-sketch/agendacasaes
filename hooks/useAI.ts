import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Service } from './useServices';

export interface Recommendation {
    service: Service;
    score: number;
    reason: string;
}

import { logger } from '../utils/logger';

export const useAI = () => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(false);

    const searchServices = async (query: string, allServices: Service[]) => {
        setLoading(true);
        logger.info('AI Search Initiated', { query });

        try {
            // 1. Try to call the Edge Function (Real Implementation)
            const { data, error } = await supabase.functions.invoke('recommend', {
                body: { query }
            });

            if (!error && data) {
                logger.info('Edge Function returned results', { resultCount: data.length });
                setRecommendations(data.map((item: any) => ({
                    service: item, // item contains service fields
                    score: item.similarity,
                    reason: 'Baseado na similaridade semântica.'
                })));
                return;
            }

            logger.warn('Edge Function failed or unavailable, falling back to local simulation.', { error });

            // 2. Fallback: Local Keyword Matching (Simulation for Demo)
            // This ensures the user sees functionality even without the backend deployed.
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
            logger.info('Local fallback search completed', { resultCount: top3.length });

        } catch (err) {
            logger.error('AI Search Critical Error', err, { query });
        } finally {
            setLoading(false);
        }
    };

    return { recommendations, searchServices, loading };
};
