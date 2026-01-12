import { createClient } from '@supabase/supabase-js';
import GameContainer from '../components/GameContainer';
import GrandPrixLeaderboard from '../components/GrandPrixLeaderboard';

// Force dynamic rendering (SSR) because data changes daily/weekly
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server-side Supabase client (read-only for public data)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bsvbxevkmqltxhicrjem.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdmJ4ZXZrbXFsdHhoaWNyamVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzk0OTUsImV4cCI6MjA4Mjk1NTQ5NX0.pHO_Difnub7KD5VmTIqNxTvLIf15xFLZm1rxsAk_Os4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getDailyCar() {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    const { data, error } = await supabase
        .from('daily_games')
        .select(`
        *,
        make:makes(name),
        model:models(name)
    `)
        .eq('date', today)
        .single();

    if (error) {
        console.error("Error fetching daily car:", error);
        return null;
    }

    if (data) {
        return {
            ...data,
            make: data.make.name,
            model: data.model.name,
            transformOrigin: data.transform_origin,
            maxZoom: data.max_zoom,
            funFacts: data.fun_facts,
        };
    }
    return null;
}

async function getLeaderboard() {
    const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .limit(10);

    if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
    return data || [];
}

export default async function Home() {
    const dailyCarData = await getDailyCar();
    const leaderboardData = await getLeaderboard();

    return (
        <div className="main-container">
            <div className="game-column">
                <GameContainer initialDailyCar={dailyCarData} />
            </div>

            <div className="sidebar-column">
                <GrandPrixLeaderboard initialLeaderboard={leaderboardData} />
            </div>
        </div>
    );
}
