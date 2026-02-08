import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI-based engagement evaluation
 * Considers likes, comments, shares holistically
 */
export const evaluatePostEngagement = async (posts: any[]): Promise<any[]> => {
    if (posts.length === 0) return [];

    const postsData = posts.map((p, idx) => ({
        index: idx,
        text: p.text?.substring(0, 200) || '',
        likes: p.likesCount || 0,
        comments: p.commentsCount || 0,
        shares: p.sharesCount || 0
    }));

    const prompt = `
    Analiza estos posts de LinkedIn y determina cuáles tienen ALTO ENGAGEMENT.
    Un post con alto engagement puede tener:
    - Muchos likes (>50)
    - O muchos comentarios (>10)
    - O muchos shares (>5)
    - O una combinación que indica viralidad (ej: 60 likes + 40 shares + 100 comentarios = MUY ALTO)

    POSTS:
    ${JSON.stringify(postsData, null, 2)}

    Devuelve un JSON con los índices de los posts con alto engagement (máximo 5):
    { "high_engagement_indices": [0, 2, 4] }

    Si ninguno tiene alto engagement, devuelve: { "high_engagement_indices": [] }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Eres un experto en métricas de redes sociales." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{"high_engagement_indices": []}');
        const indices = result.high_engagement_indices || [];

        return indices.map((i: number) => posts[i]).filter(Boolean).slice(0, 5);
    } catch (error) {
        console.error("Engagement evaluation error:", error);
        // Fallback: return top 5 by simple metric
        return posts
            .sort((a, b) => ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0)))
            .slice(0, 5);
    }
};

export const generatePostOutline = async (originalContent: string) => {
    const prompt = `Analiza el siguiente contenido y crea un esquema (Outline) estratégico para un post de LinkedIn.
    
    INPUT:
    ${originalContent}
    
    Salida esperada (Markdown):
    ---
    ANÁLISIS: (Resumen en 1 frase)
    HOOKS: (3 opciones: Agresivo, Historia, Dato)
    CUERPO: (4 puntos clave)
    CIERRE: (Frase final)
    ---
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: "Actúa como un Estratega de Contenido Viral." }, { role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
};

/**
 * Rewrite post using the master prompt (custom_instructions) from profile
 */
export const regeneratePost = async (outline: string, originalContent: string, customInstructions: string) => {
    const systemPrompt = customInstructions || `
    Eres un redactor experto en Ghostwriting para LinkedIn.
    - Escribe de forma directa y contundente
    - Usa párrafos cortos
    - Sin emojis
    - Tutea al lector
    `;

    const prompt = `
    Reescribe este contenido para LinkedIn basándote en el outline.
    Mantén la esencia pero adáptalo a MI voz.
    
    [OUTLINE]:
    ${outline}
    
    [TEXTO_ORIGINAL]:
    ${originalContent}
    
    Genera el post final listo para publicar.
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ],
    });

    return response.choices[0].message.content;
};

export const generateIdeasFromResearch = async (postContent: string, researchData: any) => {
    const prompt = `
    SOURCE_POST: ${postContent}
    AUX_RESEARCH: ${JSON.stringify(researchData)}
    
    Genera 5 ideas de contenido viral para LinkedIn basadas en esto.
    Devuelve JSON con esta estructura:
    {
      "ideas": [
        {
          "title": "",
          "hook": "",
          "angle": "",
          "why_it_works": ""
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: "You are a senior LinkedIn content strategist." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
}

