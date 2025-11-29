import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file and restart the dev server.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Event = {
    id: string;
    name: string;
    description?: string;
    organizer_address: string;
    max_attendees: number;
    codes_merkle_root?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    created_at: string;
    contract_event_id?: string;
    is_active: boolean;
};

export type VerificationCode = {
    id: string;
    event_id: string;
    code: string;
    used: boolean;
    used_by?: string;
    used_at?: string;
    merkle_proof?: any;
    created_at: string;
};

export type Registration = {
    id: string;
    event_id: string;
    wallet_address: string;
    email?: string;
    registered_at: string;
    attended: boolean;
};

export type AttendanceProof = {
    id: string;
    event_id: string;
    attendee_address: string;
    proof_hash: string;
    tx_hash: string;
    verified_at: string;
};
