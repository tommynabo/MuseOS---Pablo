import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { supabaseAdmin, getSupabaseUserClient } from './db';
import { getCreatorPosts, searchLinkedInPosts, searchGoogleNews } from './services/apifyService';
import { generatePostOutline, regeneratePost, generateIdeasFromResearch, evaluatePostEngagement } from './services/openaiService';

const app = express();

app.use(cors());
app.use(express.json());

// ===== AUTH MIDDLEWARE =====
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

// ===== INTERFACES =====
interface ApifyPost {
    id?: string;
    url?: string;
    text?: string;
    author?: { name?: string };
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
}

// ===== HELPERS =====
const getUserSupabase = (req: Request) => {
    const token = (req as any).token;
    return getSupabaseUserClient(token);
};

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get creators
app.get('/api/creators', requireAuth, async (req, res) => {
    const supabase = getUserSupabase(req);
    const { data, error } = await supabase.from('creators').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Add creator
app.post('/api/creators', requireAuth, async (req, res) => {
    const { name, linkedinUrl, headline } = req.body;
    const supabase = getUserSupabase(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase
        .from('creators')
        .insert({ user_id: user.id, name, linkedin_url: linkedinUrl, headline })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Get posts
app.get('/api/posts', requireAuth, async (req, res) => {
    const supabase = getUserSupabase(req);
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ===== UNIFIED WORKFLOW =====
app.post('/api/workflow/generate', requireAuth, async (req, res) => {
    const { source } = req.body; // 'keywords' or 'creators'

    const supabase = getUserSupabase(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    try {
        // Get profile
        const { data: profile } = await supabase.from('profiles').select('*').single();
        if (!profile) {
            res.status(400).json({ error: "Profile not found. Configure settings first." });
            return;
        }

        const keywords = profile.niche_keywords || [];
        const customInstructions = profile.custom_instructions || '';
        let allPosts: ApifyPost[] = [];

        if (source === 'keywords') {
            console.log(`Searching LinkedIn for keywords: ${keywords.join(', ')}`);
            if (keywords.length === 0) {
                res.status(400).json({ error: "No keywords configured. Add keywords in Settings." });
                return;
            }
            for (const keyword of keywords.slice(0, 5)) {
                const posts = await searchLinkedInPosts([keyword], 5) as ApifyPost[];
                allPosts = [...allPosts, ...posts];
            }
        } else {
            const { data: creators } = await supabase.from('creators').select('linkedin_url');
            if (!creators || creators.length === 0) {
                res.status(400).json({ error: "No creators configured. Add creators in Settings." });
                return;
            }
            const creatorUrls = creators.map((c: any) => c.linkedin_url);
            console.log(`Scraping posts from ${creatorUrls.length} creators...`);
            allPosts = await getCreatorPosts(creatorUrls, 10) as ApifyPost[];
        }

        console.log(`Fetched ${allPosts.length} total posts`);

        // AI engagement evaluation
        const highEngagementPosts = await evaluatePostEngagement(allPosts);
        console.log(`AI selected ${highEngagementPosts.length} high-engagement posts`);

        if (highEngagementPosts.length === 0) {
            res.json({ status: 'success', data: [], message: "No high-engagement posts found" });
            return;
        }

        // Process posts
        const processedPosts = [];
        for (const post of highEngagementPosts.slice(0, 5)) {
            if (!post.text) continue;

            const outline = await generatePostOutline(post.text);
            const rewritten = await regeneratePost(outline || '', post.text, customInstructions);

            await supabase.from('posts').insert({
                user_id: user.id,
                original_post_id: post.id || 'unknown',
                original_url: post.url || '',
                original_content: post.text,
                original_author: post.author?.name || 'Unknown',
                generated_content: rewritten,
                type: source === 'keywords' ? 'research' : 'parasite',
                status: 'drafted',
                meta: {
                    outline,
                    engagement: { likes: post.likesCount, comments: post.commentsCount, shares: post.sharesCount }
                }
            });

            processedPosts.push({
                original: post.text.substring(0, 200) + '...',
                generated: rewritten,
                engagement: { likes: post.likesCount, comments: post.commentsCount, shares: post.sharesCount }
            });
        }

        res.json({ status: 'success', source, postsProcessed: processedPosts.length, data: processedPosts });

    } catch (error: any) {
        console.error("Generate workflow error:", error);
        res.status(500).json({ error: error.message || "Workflow failed" });
    }
});

// Legacy endpoints for backwards compatibility
app.post('/api/workflow/parasite', requireAuth, async (req, res) => {
    (req.body as any).source = 'creators';
    // Forward to generate
    const supabase = getUserSupabase(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { data: creators } = await supabase.from('creators').select('linkedin_url');
        if (!creators || creators.length === 0) {
            res.status(400).json({ error: "No creators found." });
            return;
        }

        const creatorUrls = creators.map((c: any) => c.linkedin_url);
        const rawPosts = await getCreatorPosts(creatorUrls, 10) as ApifyPost[];
        const highEngagementPosts = await evaluatePostEngagement(rawPosts);

        const { data: profile } = await supabase.from('profiles').select('*').single();
        const customInstructions = profile?.custom_instructions || '';

        const processedPosts = [];
        for (const post of highEngagementPosts.slice(0, 5)) {
            if (!post.text) continue;
            const outline = await generatePostOutline(post.text);
            const rewritten = await regeneratePost(outline || '', post.text, customInstructions);

            await supabase.from('posts').insert({
                user_id: user.id,
                original_content: post.text,
                generated_content: rewritten,
                type: 'parasite',
                meta: { outline }
            });

            processedPosts.push({ original: post.text.substring(0, 200), generated: rewritten });
        }

        res.json({ status: 'success', data: processedPosts });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/workflow/research', requireAuth, async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        res.status(400).json({ error: "Topic is required" });
        return;
    }

    const supabase = getUserSupabase(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    try {
        const linkedInPosts = await searchLinkedInPosts([topic], 5) as ApifyPost[];
        const results = [];

        for (const post of linkedInPosts) {
            if (!post.text) continue;
            const news = await searchGoogleNews([topic], 3);
            const ideas = await generateIdeasFromResearch(post.text, news);

            await supabase.from('posts').insert({
                user_id: user.id,
                original_content: post.text,
                type: 'research',
                meta: { news, ideas }
            });

            results.push({ sourcePost: post.text, research: news, ideas });
        }

        res.json({ status: 'success', data: results });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default app;
