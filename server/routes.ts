import express, { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, getSupabaseUserClient } from './db';
import { getCreatorPosts, searchLinkedInPosts, searchGoogleNews } from './services/apifyService';
import { generatePostOutline, regeneratePost, generateIdeasFromResearch } from './services/openaiService';

const router = express.Router();

/**
 * Middleware to extract Bearer Token
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Missing Authorization header' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Invalid token format' });
        return;
    }
    (req as any).token = token;
    next();
};

// Interfaces
interface ApifyPost {
    id?: string;
    url?: string;
    text?: string;
    author?: {
        name?: string;
    };
}

interface CreateCreatorRequest {
    name: string;
    linkedinUrl: string;
    headline?: string;
}

interface ResearchRequest {
    topic: string;
}

/**
 * HELPERS
 */
const getUserSupabase = (req: Request) => {
    const token = (req as any).token;
    return getSupabaseUserClient(token);
};

/**
 * CREATORS - Management (Protected)
 */
router.get('/creators', requireAuth, async (req, res) => {
    const supabase = getUserSupabase(req);
    const { data, error } = await supabase.from('creators').select('*');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.post('/creators', requireAuth, async (req, res) => {
    const { name, linkedinUrl, headline } = req.body;
    const supabase = getUserSupabase(req);

    // Get User ID (handled by RLS automatically on insert, but we need to ensure session exists)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase
        .from('creators')
        .insert({
            user_id: user.id,
            name,
            linkedin_url: linkedinUrl,
            headline
        })
        .select() // Return the inserted row
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

/**
 * WORKFLOW 1: VIRAL POST REPLICATION (Parasite)
 */
router.post('/workflow/parasite', requireAuth, async (req, res) => {
    const supabase = getUserSupabase(req);

    // Get User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    try {
        // Step 1: Get creators
        const { data: creators, error: creatorError } = await supabase.from('creators').select('linkedin_url');
        if (creatorError) throw creatorError;

        if (!creators || creators.length === 0) {
            res.status(400).json({ error: "No creators found." });
            return;
        }

        const creatorUrls = creators.map((c: any) => c.linkedin_url);

        // Step 2: Scrape Posts
        console.log(`Scraping posts for ${creatorUrls.length} creators...`);
        const rawPosts = await getCreatorPosts(creatorUrls, 3) as ApifyPost[];

        const processedPosts = [];

        // Step 3: Get User Profile (Persona)
        const { data: profile } = await supabase.from('profiles').select('*').single();
        const persona = profile ? {
            personality: profile.tone,
            keywords: profile.niche_keywords,
            tone: profile.tone
        } : {}; // Fallback or empty

        for (const post of rawPosts) {
            if (!post.text) continue;

            // Generate Outline
            const outline = await generatePostOutline(post.text);

            // Regenerate Content
            const rewritten = await regeneratePost(outline || '', post.text, persona);

            // Save to DB
            await supabase.from('posts').insert({
                user_id: user.id,
                original_post_id: post.id || 'unknown',
                original_url: post.url || '',
                original_content: post.text,
                original_author: post.author?.name || 'Unknown',
                generated_content: rewritten,
                type: 'parasite',
                meta: { outline }
            });

            processedPosts.push({
                original: post.text,
                generated: rewritten,
                outline: outline
            });
        }

        res.json({ status: 'success', data: processedPosts });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || "Workflow failed" });
    }
});

/**
 * WORKFLOW 2: AUTOMATED CONTENT RESEARCH
 */
router.post('/workflow/research', requireAuth, async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        res.status(400).json({ error: "Topic is required" });
        return;
    }

    const supabase = getUserSupabase(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    try {
        // Step 1: Search LinkedIn
        console.log(`Searching LinkedIn for: ${topic}`);
        const linkedInPosts = await searchLinkedInPosts([topic], 5) as ApifyPost[];

        const results = [];

        for (const post of linkedInPosts) {
            if (!post.text) continue;

            // Step 2: Deep Research
            const news = await searchGoogleNews([topic], 3);

            // Step 3: Ideas
            const ideas = await generateIdeasFromResearch(post.text, news);

            // Save Research
            await supabase.from('posts').insert({
                user_id: user.id,
                original_content: post.text, // The "Search Result"
                type: 'research',
                meta: { news, ideas }
            });

            results.push({
                sourcePost: post.text,
                research: news,
                ideas: ideas
            });
        }

        res.json({ status: 'success', data: results });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || "Research failed" });
    }
});

/**
 * CRON: Scheduled Research (Admin/Service Role)
 */
router.post('/cron/research', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const topics = ["Inteligencia Artificial", "Growth Marketing", "Emprendimiento"];
        console.log(`[CRON] Starting scheduled research...`);

        // We need a user to assign these posts to. 
        // For now, we might need a "System User" or loop through all active users (complex).
        // Simplification: We'll store them for a specific Admin User ID or just leave user_id NULL if schema allows
        // But schema says NOT NULL. 
        // Strategy: Get all users with 'research_enabled' flag? 
        // For this MVP: Fetch first user or specific ID from env.

        // Fallback: This cron logic needs refinement for Multi-tenancy.
        // We will just Log for now.
        console.log("Cron executed. Multi-tenant cron pending implementation.");

        res.json({ status: 'success', message: "Cron executed (Dry Run)" });

    } catch (error) {
        console.error("[CRON] Error:", error);
        res.status(500).json({ error: "Cron job failed" });
    }
});

/**
 * GENERAL: Get Generated Posts
 */
router.get('/posts', requireAuth, async (req, res) => {
    const supabase = getUserSupabase(req);
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

export default router;
