import { supabase, type Registration } from '../supabase';

/**
 * Register a user for an event
 */
export async function registerForEvent(
    eventId: string,
    walletAddress: string,
    email?: string
): Promise<Registration> {
    // Check if already registered
    const { data: existing } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('wallet_address', walletAddress)
        .single();

    if (existing) {
        return existing as Registration;
    }

    // Create new registration
    const { data, error } = await supabase
        .from('registrations')
        .insert({
            event_id: eventId,
            wallet_address: walletAddress,
            email
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to register: ${error.message}`);
    }

    return data as Registration;
}

/**
 * Get all registrations for an event
 */
export async function getEventRegistrations(
    eventId: string
): Promise<Registration[]> {
    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch registrations: ${error.message}`);
    }

    return data as Registration[];
}

/**
 * Check if a wallet is registered for an event
 */
export async function isRegistered(
    eventId: string,
    walletAddress: string
): Promise<boolean> {
    const { data } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('wallet_address', walletAddress)
        .single();

    return !!data;
}

/**
 * Mark registration as attended
 */
export async function markAsAttended(
    eventId: string,
    walletAddress: string
): Promise<void> {
    const { error } = await supabase
        .from('registrations')
        .update({ attended: true })
        .eq('event_id', eventId)
        .eq('wallet_address', walletAddress);

    if (error) {
        throw new Error(`Failed to mark as attended: ${error.message}`);
    }
}

/**
 * Get registration statistics
 */
export async function getRegistrationStats(eventId: string): Promise<{
    total: number;
    attended: number;
    pending: number;
}> {
    const { data, error } = await supabase
        .from('registrations')
        .select('attended')
        .eq('event_id', eventId);

    if (error) {
        throw new Error(`Failed to fetch stats: ${error.message}`);
    }

    const total = data.length;
    const attended = data.filter(r => r.attended).length;
    const pending = total - attended;

    return { total, attended, pending };
}
