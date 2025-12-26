import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    payment_method: string;
    date: string;
    appointment?: {
        id: string;
        client: { name: string } | null;
        service: { name: string } | null;
    } | null;
}

export const useFinancials = (startDate?: Date, endDate?: Date) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, [startDate, endDate]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('transactions')
                .select(`
          id,
          amount,
          type,
          category,
          payment_method,
          date,
          appointment:appointment_id (
            id,
            client:client_id (name),
            service:service_id (name)
          )
        `)
                .order('date', { ascending: false });

            // Apply date filters if provided
            if (startDate) {
                query = query.gte('date', startDate.toISOString());
            }
            if (endDate) {
                query = query.lte('date', endDate.toISOString());
            }

            const { data, error: err } = await query;

            if (err) throw err;

            const formattedData: Transaction[] = (data || []).map((item: any) => ({
                id: item.id,
                amount: item.amount,
                type: item.type,
                category: item.category,
                payment_method: item.payment_method,
                date: item.date,
                appointment: item.appointment ? {
                    id: item.appointment.id,
                    client: item.appointment.client,
                    service: item.appointment.service
                } : null
            }));

            setTransactions(formattedData);

            // Calculate Summary
            const inc = formattedData.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
            const exp = formattedData.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
            setSummary({ income: inc, expense: exp, total: inc - exp });

        } catch (err: any) {
            console.error('Error fetching transactions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { transactions, summary, loading, error, refetch: fetchTransactions };
};
