import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
import { expandSearchQuery } from './openaiService';
import { supabaseAdmin } from '../db';

dotenv.config();

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

/**
 * Searches LinkedIn posts with advanced "Bucket Filling" logic to ensure results.
 * Implements: 
 * 1. Loop until quota met
 * 2. Query variation/expansion on empty results
 * 3. Deduplication (session & historical)
 */
export const searchLinkedInPosts = async (keywords: string[], maxPosts = 5) => {
    // State for the "Bucket Filling" loop
    let accumulatedPosts: any[] = [];
    const sessionProcessedUrls = new Set<string>();
    let attempts = 0;
    const maxAttempts = 5; // Safety break
    
    // Dynamic query list - starts with user keywords, expands if needed
    let searchQueries = [...keywords];

    console.log(`[Bucket Search] Starting search for '${keywords.join(", ")}' (Goal: ${maxPosts})`);

    while (accumulatedPosts.length < maxPosts && attempts < maxAttempts) {
        // 1. SELECT QUERY STRATEGY
        // If we failed initial attempts, try to expand the query using AI
        if (attempts === 1 && accumulatedPosts.length === 0) {
            console.log(`[Bucket Search] Initial search yielded 0 results. Expanding query with AI...`);
            try {
                // Generate 3 variations based on the first keyword
                const expanded = await expandSearchQuery(keywords[0], "Focus on finding popular, high-engagement content.");
                // Add new queries to the front of the queue
                searchQueries = [...expanded, ...searchQueries];
                console.log(`[Bucket Search] New search strategy: ${searchQueries.join(" | ")}`);
            } catch (e) {
                console.error("[Bucket Search] Query expansion failed, continuing with original keywords.");
            }
        }

        // Pick the current query cycling through the list
        const currentQuery = searchQueries[attempts % searchQueries.length];
        
        // 2. FETCH DATA (The "Small Glass")
        console.log(`[Bucket Search] Attempt ${attempts + 1}/${maxAttempts}: Searching for '${currentQuery}'...`);
        
        try {
            // Actor: buIWk2uOUzTmcLsuB (LinkedIn Post Search)
            // We ask for more than needed (maxPosts * 2) to allow for filtering
            const run = await client.actor("buIWk2uOUzTmcLsuB").call({
                searchQueries: [currentQuery],
                maxPosts: maxPosts * 2, 
                maxReactions: 10,
                scrapeComments: true,
                scrapeReactions: true,
                sortBy: "relevance",
                timeframe: "month" // Ensure freshness
            });

            if (!run) {
                console.log(`[Bucket Search] Run failed for '${currentQuery}'`);
                attempts++;
                continue;
            }

            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`[Bucket Search] Raw items found: ${items.length}`);

            // 3. FILTERING FUNNEL & DEDUPLICATION
            for (const item of items) {
                // Stop if bucket is full
                if (accumulatedPosts.length >= maxPosts) break;
                
                const postUrl = (item as any).url || (item as any).postUrl;
                if (!postUrl) continue;

                // A. Session Deduplication
                if (sessionProcessedUrls.has(postUrl)) continue;

                // B. Quality Filter (The "Funnel")
                const likes = (item as any).likesCount || (item as any).likesNumber || 0;
                const comments = (item as any).commentsCount || (item as any).commentsNumber || 0;
                // Heuristic: Must have some engagement (e.g. >10 likes OR >2 comments)
                // Adjust threshold based on attempt number? (Lower standards if desperate)
                const qualityThreshold = attempts > 2 ? 5 : 10; 
                if (likes < qualityThreshold && comments < 2) continue;

                // C. Historical Deduplication (Database check)
                // Check if we already have this post in our 'posts' table
                // We construct the truncated text as stored in DB to check for duplicates
                const truncatedText = ((item as any).text || (item as any).postText || (item as any).content || "").trim().substring(0, 500);

                // Skip if content is empty
                if (!truncatedText) continue;

                const { data: existing } = await supabaseAdmin
                    .from(process.env.DB_TABLE_POSTS || 'posts_pablo') // Fallback to 'posts_pablo'
                    .select('id')
                    .eq('original_content', truncatedText) // Exact match on truncated content
                    .maybeSingle();

                if (existing) {
                   console.log(`[Bucket Search] Skipping duplicate (Database): ${postUrl}`);
                   sessionProcessedUrls.add(postUrl); // Mark as processed so we don't check again
                   continue; 
                }

                // If it passes all checks, add to bucket
                accumulatedPosts.push(item);
                sessionProcessedUrls.add(postUrl);
            }

        } catch (error) {
            console.error(`[Bucket Search] Error in attempt ${attempts + 1}:`, error);
        }

        // Increment attempts
        attempts++;
        
        // If we have enough posts, break early
        if (accumulatedPosts.length >= maxPosts) {
            console.log(`[Bucket Search] Bucket filled! (${accumulatedPosts.length}/${maxPosts})`);
            break;
        }

        console.log(`[Bucket Search] Status: ${accumulatedPosts.length}/${maxPosts} posts. continuing...`);
    }

    // Sort final results by engagement score
    return accumulatedPosts.sort((a: any, b: any) => {
        const scoreA = (a.likesCount || 0) + (a.commentsCount || 0) * 5;
        const scoreB = (b.likesCount || 0) + (b.commentsCount || 0) * 5;
        return scoreB - scoreA;
    });
};

export const getCreatorPosts = async (profileUrls: string[], maxPosts = 3) => {
    // Actor: A3cAPGpwBEG8RJwse (LinkedIn Profile Scraper / Post Scraper) 
    // Fetch posts from high-engagement creators only
    const input = {
        includeQuotePosts: true,
        includeReposts: false, // Don't include reposts to get original content
        maxComments: 10,
        maxPosts: maxPosts * 2, // Fetch 2x more to filter
        maxReactions: 10,
        postedLimit: "month", // Extended to 1 month for more data
        scrapeComments: true,
        scrapeReactions: true,
        targetUrls: profileUrls
    };

    try {
        const run = await client.actor("A3cAPGpwBEG8RJwse").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // Filter by engagement: Relaxed for creators too (>20 likes or >3 comments)
        const qualityPosts = items
            .filter((item: any) => {
                const likes = item.likesCount || item.likesNumber || 0;
                const comments = item.commentsCount || item.commentsNumber || 0;
                return likes > 20 || comments > 3;
            })
            .sort((a: any, b: any) => {
                const scoreA = (a.likesCount || 0) + (a.commentsCount || 0) * 5;
                const scoreB = (b.likesCount || 0) + (b.commentsCount || 0) * 5;
                return scoreB - scoreA;
            })
            .slice(0, maxPosts);

        console.log(`Creator posts: filtered ${items.length} to ${qualityPosts.length} high-engagement posts`);
        return qualityPosts;
    } catch (error) {
        console.error("Apify Creator Posts Error:", error);
        return [];
    }
};

export const searchGoogleNews = async (keywords: string[], maxArticles = 5) => {
    // Actor: 3Z6SK7F2WoPU3t2sg (Google News Scraper)
    const input = {
        extractDescriptions: true,
        keywords: keywords,
        maxArticles: maxArticles,
        region_language: "es-ES", // Changed to Spanish as per user request context
        timeframe: "7d"
    };

    try {
        const run = await client.actor("3Z6SK7F2WoPU3t2sg").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        return items;
    } catch (error) {
        console.error("Apify News Error:", error);
        return [];
    }
}
