// SINGLE FILE API - All code inline to avoid Vercel ESM resolution issues
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';

// ===== CONFIGURATION =====
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

// ===== CLIENTS =====
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const apifyClient = new ApifyClient({ token: APIFY_TOKEN });

const openai = new OpenAI({ apiKey: OPENAI_KEY });

const getSupabaseUserClient = (accessToken: string) => {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });
};

// ===== EXPRESS APP =====
const app = express();
app.use(cors());
app.use(express.json());

// ===== AUTH MIDDLEWARE =====
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });
    (req as any).token = token;
    next();
};

const getUserSupabase = (req: Request) => getSupabaseUserClient((req as any).token);

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

// ===== APIFY FUNCTIONS =====
async function searchLinkedInPosts(keywords: string[], maxPosts = 5): Promise<ApifyPost[]> {
    try {
        const run = await apifyClient.actor("buIWk2uOUzTmcLsuB").call({
            maxPosts, maxReactions: 5, scrapeComments: true, scrapeReactions: true,
            searchQueries: keywords, sortBy: "relevance"
        });
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        return items as ApifyPost[];
    } catch (error) {
        console.error("Apify Search Error:", error);
        return [];
    }
}

async function getCreatorPosts(profileUrls: string[], maxPosts = 3): Promise<ApifyPost[]> {
    try {
        const run = await apifyClient.actor("A3cAPGpwBEG8RJwse").call({
            includeQuotePosts: true, includeReposts: true, maxComments: 5, maxPosts,
            maxReactions: 5, postedLimit: "week", scrapeComments: true, scrapeReactions: true,
            targetUrls: profileUrls
        });
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        return items as ApifyPost[];
    } catch (error) {
        console.error("Apify Creator Posts Error:", error);
        return [];
    }
}

// ===== OPENAI FUNCTIONS =====
async function evaluatePostEngagement(posts: ApifyPost[]): Promise<ApifyPost[]> {
    if (posts.length === 0) return [];

    const postsData = posts.map((p, idx) => ({
        index: idx,
        text: p.text?.substring(0, 200) || '',
        likes: p.likesCount || 0,
        comments: p.commentsCount || 0,
        shares: p.sharesCount || 0
    }));

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Eres un experto en métricas de redes sociales." },
                {
                    role: "user", content: `Analiza estos posts y devuelve los índices con alto engagement (máx 5):
                ${JSON.stringify(postsData)}
                Responde JSON: { "indices": [0, 2, 4] }` }
            ],
            response_format: { type: "json_object" }
        });
        const result = JSON.parse(response.choices[0].message.content || '{"indices": []}');
        return (result.indices || []).map((i: number) => posts[i]).filter(Boolean).slice(0, 5);
    } catch (error) {
        console.error("Engagement evaluation error:", error);
        return posts.sort((a, b) => ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0))).slice(0, 5);
    }
}

async function generatePostOutline(content: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: "Actúa como un Estratega de Contenido Viral." },
            { role: "user", content: `Crea un outline estratégico para este post de LinkedIn:\n${content}\n\nDevuelve: ANÁLISIS, HOOKS (3), CUERPO (4 puntos), CIERRE` }
        ]
    });
    return response.choices[0].message.content || '';
}

async function regeneratePost(outline: string, original: string, customInstructions: string): Promise<string> {
    const systemPrompt = customInstructions || "Eres un redactor experto en Ghostwriting. Párrafos cortos. Sin emojis. Tutea.";
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Reescribe este post basándote en el outline:\n[OUTLINE]: ${outline}\n[ORIGINAL]: ${original}\n\nGenera el post final.` }
        ]
    });
    return response.choices[0].message.content || '';
}

// ===== ROUTES =====
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/creators', requireAuth, async (req, res) => {
    const supabase = getUserSupabase(req);
    const { data, error } = await supabase.from('creators').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/creators', requireAuth, async (req, res) => {
    const { name, linkedinUrl, headline } = req.body;
    const supabase = getUserSupabase(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase.from('creators')
        .insert({ user_id: user.id, name, linkedin_url: linkedinUrl, headline })
        .select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.delete('/api/creators/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const supabase = getUserSupabase(req);
    const { error } = await supabase.from('creators').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ status: 'deleted' });
});

app.get('/api/posts', requireAuth, async (req, res) => {
    const supabase = getUserSupabase(req);
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ===== MAIN WORKFLOW =====
app.post('/api/workflow/generate', requireAuth, async (req, res) => {
    const { source } = req.body; // 'keywords' or 'creators'
    const supabase = getUserSupabase(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { data: profile } = await supabase.from('profiles').select('*').single();
        if (!profile) return res.status(400).json({ error: "Configure settings first." });

        const keywords = profile.niche_keywords || [];
        const customInstructions = profile.custom_instructions || '';
        let allPosts: ApifyPost[] = [];

        if (source === 'keywords') {
            if (keywords.length === 0) return res.status(400).json({ error: "No keywords configured." });
            for (const kw of keywords.slice(0, 5)) {
                allPosts = [...allPosts, ...await searchLinkedInPosts([kw], 5)];
            }
        } else {
            const { data: creators } = await supabase.from('creators').select('linkedin_url');
            if (!creators?.length) return res.status(400).json({ error: "No creators configured." });
            allPosts = await getCreatorPosts(creators.map((c: any) => c.linkedin_url), 10);
        }

        console.log(`Fetched ${allPosts.length} posts`);
        const highEngagement = await evaluatePostEngagement(allPosts);
        console.log(`Selected ${highEngagement.length} high-engagement posts`);

        if (highEngagement.length === 0) return res.json({ status: 'success', data: [], message: "No high-engagement posts" });

        const results = [];
        for (const post of highEngagement.slice(0, 5)) {
            if (!post.text) continue;
            const outline = await generatePostOutline(post.text);
            const rewritten = await regeneratePost(outline, post.text, customInstructions);

            await supabase.from('posts').insert({
                user_id: user.id, original_content: post.text, generated_content: rewritten,
                type: source === 'keywords' ? 'research' : 'parasite', status: 'drafted',
                meta: { outline, engagement: { likes: post.likesCount, comments: post.commentsCount, shares: post.sharesCount } }
            });

            results.push({ original: post.text.substring(0, 200) + '...', generated: rewritten });
        }

        res.json({ status: 'success', postsProcessed: results.length, data: results });
    } catch (error: any) {
        console.error("Workflow error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Legacy endpoints
app.post('/api/workflow/parasite', requireAuth, async (req, res) => {
    req.body.source = 'creators';
    return app._router.handle(req, res, () => { });
});

app.post('/api/workflow/research', requireAuth, async (req, res) => {
    req.body.source = 'keywords';
    return app._router.handle(req, res, () => { });
});

export default app;
