
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // fallback to .env
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRLS() {
    console.log('🔒 Testing Row Level Security (RLS)...');
    console.log(`Target: ${SUPABASE_URL}`);

    // Test 1: Try to access appointments of a non-existent/random tenant
    const randomTenantId = 'tenant-uuid-' + Math.random().toString(36).substring(7);
    console.log(`\n1. Attempting to access data for arbitrary tenant_id: ${randomTenantId}`);

    const { data: tenantData, error: tenantError } = await supabase
        .from('appointments')
        .select('*')
        .eq('unit_id', randomTenantId);

    if (tenantError) {
        console.error('❌ Query Error:', tenantError.message);
    } else {
        if (tenantData && tenantData.length > 0) {
            console.error('❌ SECURITY ALERT: Data found for random tenant! RLS might be missing or misconfigured.');
            console.table(tenantData);
        } else {
            console.log('✅ PASS: No data returned for arbitrary tenant (Access Denied or No Data).');
        }
    }

    // Test 2: Try to access ALL appointments (no filter)
    console.log('\n2. Attempting to dump ALL appointments (Global Access Check)');
    const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.log('✅ PASS: Query blocked or failed as expected for anonymous user.'); // Assume denial is good if expecting authed-only
    } else {
        if (count === null || count === 0) {
            console.log('✅ PASS: Table appears empty or inaccessible to anonymous users.');
        } else {
            console.warn(`⚠️  WARNING: Anonymous user can see ${count} records. Check if this public access is intentional.`);
        }
    }
}

testRLS().catch(console.error);
