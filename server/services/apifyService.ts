import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
dotenv.config();

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export const searchLinkedInPosts = async (keywords: string[], maxPosts = 5) => {
    // Actor: buIWk2uOUzTmcLsuB (LinkedIn Post Search)
    const input = {
        maxPosts: maxPosts,
        maxReactions: 5,
        scrapeComments: true,
        scrapeReactions: true,
        searchQueries: keywords,
        sortBy: "relevance"
    };

    try {
        const run = await client.actor("buIWk2uOUzTmcLsuB").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        return items;
    } catch (error) {
        console.error("Apify Search Error:", error);
        return [];
    }
};

export const getCreatorPosts = async (profileUrls: string[], maxPosts = 3) => {
    // Actor: A3cAPGpwBEG8RJwse (LinkedIn Profile Scraper / Post Scraper) 
    // Note: The N8N used this actor for profile posts too.
    const input = {
        includeQuotePosts: true,
        includeReposts: true,
        maxComments: 5,
        maxPosts: maxPosts,
        maxReactions: 5,
        postedLimit: "week",
        scrapeComments: true,
        scrapeReactions: true,
        targetUrls: profileUrls
    };

    try {
        const run = await client.actor("A3cAPGpwBEG8RJwse").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        return items;
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
