import OpenAI from 'openai';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../db';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🧠 BRAIN FUNCTION: Build Preferences Context from User Feedback
 * Analyzes user's likes/dislikes to create a preferences context for AI alignment
 */
export const buildPreferencesContext = async (userId: string): Promise<string> => {
    try {
        // Query posts with feedback (meta.feedback exists)
        const { data: postsWithFeedback } = await supabaseAdmin
            .from(process.env.DB_TABLE_POSTS || 'posts_pablo')
            .select('original_content, generated_content, meta')
            .eq('user_id', userId)
            .not('meta', 'is', null);

        if (!postsWithFeedback || postsWithFeedback.length === 0) {
            return ''; // No feedback yet, return empty context
        }

        // Extract feedback data
        const likes: string[] = [];
        const dislikes: string[] = [];

        postsWithFeedback.forEach((post: any) => {
            const meta = post.meta || {};
            if (meta.feedback === 'like') {
                likes.push(post.original_content?.substring(0, 100) || '');
            } else if (meta.feedback === 'dislike') {
                dislikes.push(post.original_content?.substring(0, 100) || '');
            }
        });

        // Only generate context if there's feedback
        if (likes.length === 0 && dislikes.length === 0) {
            return '';
        }

        // Use AI to analyze patterns in likes/dislikes
        const analysisPrompt = `
        Analiza los gustos y disgustos de un usuario de LinkedIn para crear un perfil de preferencias.
        
        POSTS QUE LE HAN GUSTADO (${likes.length}):
        ${likes.slice(0, 10).map((l, i) => `${i + 1}. "${l}..."`).join('\n')}
        
        POSTS QUE NO LE HAN GUSTADO (${dislikes.length}):
        ${dislikes.slice(0, 10).map((d, i) => `${i + 1}. "${d}..."`).join('\n')}
        
        Crea un perfil de preferencias EN UNA SOLA LÍNEA que describe:
        - Temas que le interesan
        - Formatos/ángulos que le gustan
        - Temas a evitar
        - Tono preferido
        
        Devuelve SOLO el texto, sin explicaciones.
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'Eres un analista de preferencias de contenido.' },
                { role: 'user', content: analysisPrompt }
            ]
        });

        const preferencesContext = response.choices[0].message.content || '';
        console.log(`[Preferences] Built context for user ${userId}: "${preferencesContext.substring(0, 100)}..."`);
        return preferencesContext;
    } catch (error) {
        console.error('Error building preferences context:', error);
        return ''; // Fail gracefully
    }
};

/**
 * 1. QUERY EXPANSION: Transform simple keywords into intent-based search queries
 */
export const expandSearchQuery = async (topic: string, userPreferences?: string): Promise<string[]> => {
    const prompt = `
    Actúa como un experto en búsqueda avanzada de LinkedIn.
    Transforma el tema "${topic}" en 3 búsquedas booleanas específicas para encontrar contenido de ALTO VALOR (no genérico).
    ${userPreferences ? `\nTÉN EN CUENTA ESTAS PREFERENCIAS AL GENERAR BÚSQUEDAS:\n${userPreferences}\n` : ''}
    Genera 3 variaciones:
    1. "Historia/Aprendizaje": "${topic}" AND ("error" OR "aprendí" OR "lección" OR "historia")
    2. "Táctico/How-To": "${topic}" AND ("cómo" OR "paso a paso" OR "guía" OR "estrategia")
    3. "Contraintuitivo/Viral": "${topic}" AND ("nadie te dice" OR "mentira" OR "verdad" OR "contra")
    
    Devuelve SOLO un JSON con las 3 strings de búsqueda:
    {
      "queries": [
        "${topic} AND ...",
        "${topic} AND ...",
        "${topic} AND ..."
      ]
    }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: "Eres un experto en boolean search." }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{"queries": []}');
        // Fallback if AI fails: just return the topic as array
        return result.queries.length > 0 ? result.queries : [topic];
    } catch (error) {
        console.error("Query expansion error:", error);
        return [topic];
    }
};

/**
 * 2. RELATIVE VIRALITY SCORING (The Sniffer)
 * Finds "Hidden Gems" by analyzing engagement ratios, not just raw volume.
 */
export const evaluatePostEngagement = async (posts: any[], userPreferences?: string): Promise<any[]> => {
    if (posts.length === 0) return [];

    // Pre-calculate metrics for the AI to make it easier
    const postsData = posts.map((p, idx) => {
        const likes = p.likesCount || p.likesNumber || p.likes || p.reactionCount || 0;
        const comments = p.commentsCount || p.commentsNumber || p.comments || 0;
        const shares = p.sharesCount || p.sharesNumber || p.shares || 0;

        // Avoid division by zero
        const safeLikes = likes > 0 ? likes : 1;

        return {
            index: idx,
            text: (p.text || p.postText || p.content || p.description || '').substring(0, 300), // Shorter preview
            metrics: {
                likes,
                comments,
                shares,
                // THE RATIOS
                comments_to_likes: (comments / safeLikes).toFixed(2), // > 0.1 is good conversation
                shares_to_likes: (shares / safeLikes).toFixed(2)      // > 0.05 is viral/saveable
            }
        };
    });

    const prompt = `
    Analiza estos posts y selecciona los "HIDDEN GEMS" (Joyas Ocultas).
    NO busques solo los que tienen millones de likes.
    Busca posts que tengan:
    1. ALTO DEBATE: Ratio comentarios/likes alto (> 0.1). Indica que el tema tocó una fibra.
    2. ALTA UTILIDAD: Ratio shares/likes alto. Indica que la gente lo guarda.
    ${userPreferences ? `\nIMPORTANTE - PREFERENCIAS DEL USUARIO:\nPenaliza severamente y NO SELECCIONES posts que hablen de temas que "NO LE GUSTA" al usuario. Prioriza temas que "LE GUSTA".\n${userPreferences}\n` : ''}
    DATA:
    ${JSON.stringify(postsData, null, 2)}
    
    Devuelve un JSON con los índices de los 3-5 mejores posts ordenados por calidad de engagement:
    { "high_engagement_indices": [2, 0, 5] }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Eres un cazador de tendencias virales. Ignoras las métricas de vanidad y buscas engagement real." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{"high_engagement_indices": []}');
        let indices = result.high_engagement_indices || [];

        if (indices.length === 0) {
            // Fallback: Use our calculated ratios manually if AI fails
            console.log("AI selected 0 posts. Using manual ratio fallback.");
            return posts
                .map((p, i) => ({ ...p, originalIndex: i }))
                .sort((a, b) => {
                    const likesA = a.likesCount || 0;
                    const commentsA = a.commentsCount || 0;
                    const ratioA = likesA > 0 ? commentsA / likesA : 0;

                    const likesB = b.likesCount || 0;
                    const commentsB = b.commentsCount || 0;
                    const ratioB = likesB > 0 ? commentsB / likesB : 0;

                    return ratioB - ratioA; // Sort by conversation ratio
                })
                .slice(0, 5);
        }

        return indices.map((i: number) => posts[i]).filter(Boolean);
    } catch (error) {
        console.error("Engagement evaluation error:", error);
        return posts.slice(0, 5); // Worst case fallback
    }
};

/**
 * 3. THE ARCHITECT: Extract Structural DNA
 * Instead of "summarizing", we extract the psychological structure.
 */
export const extractPostStructure = async (originalContent: string) => {
    const prompt = `
    Analiza este post viral y extrae su "ESQUELETO ESTRUCTURAL" (no el contenido, sino la forma).
    
    INPUT POST:
    "${originalContent}"
    
    Tu salida debe ser un JSON que guíe a un redactor a replicar el éxito:
    {
      "hook_type": "ej: Afirmación Contraintuitiva / Historia Personal / Pregunta Retórica",
      "structure_steps": [
        "Paso 1: [Descripción de qué hace el autor aquí, ej: Establece credibilidad con un número]",
        "Paso 2: [ej: Introduce el conflicto o el error común]",
        "Paso 3: [ej: Presenta la solución en una lista de 3 puntos]",
        "Paso 4: [ej: Cierre inspiracional]"
      ],
      "tone_analysis": "ej: Autoritario pero empático",
      "psychological_trigger": "ej: Miedo a perderse algo (FOMO) / Validación de estatus"
    }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: "Eres un analista experto en ingeniería inversa de contenido viral." }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        return response.choices[0].message.content; // Returns the JSON string
    } catch (error) {
        console.error("Structure extraction error:", error);
        return null; // Handle null in caller
    }
};

/**
 * 4. THE WRITER: Fill the structure with new content
 */
export const regeneratePost = async (structureJson: string, originalContent: string, customInstructions: string, userPreferences?: string) => {
    const systemPrompt = customInstructions || `
    Eres un redactor experto en Ghostwriting para LinkedIn.
    Tu objetivo es escribir contenido nuevo que se sienta tuyo, pero usando una estructura probada.
    `;

    const prompt = `
    Instrucciones:
    1. Tienes un "ESQUELETO ESTRUCTURAL" de un post viral.
    2. Tienes un TEMA (o usa el tema del post original si no se provee uno).
    3. ESCRIBE un post NUEVO sobre el tema, siguiendo PASO A PASO la estructura provista.
    ${userPreferences ? `\n⭐ IMPORTANTE - PREFERENCIAS DEL USUARIO:\n${userPreferences}\nFavorecer estos temas/estilos. Evitar con severidad los que no le gustan.\n` : ''}
    
    ESTRUCTURA A SEGUIR (JSON):
    ${structureJson}
    
    CONTEXTO ORIGEN (Solo referencia):
    ${originalContent.substring(0, 500)}...
    
    OUTPUT:
    Escribe el post final. Sin preámbulos.
    - Usa párrafos cortos.
    - Sin hashtags excesivos.
    - Tono directo y conversacional.
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

// Keep for compatibility if needed, but we prefer extractPostStructure
export const generatePostOutline = async (originalContent: string) => {
    return extractPostStructure(originalContent);
};

export const generateViralityAnalysis = async (postContent: string, originalMetrics?: { likes: number; comments: number }) => {
    const prompt = `
    Eres un experto en análisis de viralidad de contenido en LinkedIn. Analiza este post profesionalmente.
    
    CONTENIDO:
    "${postContent}"
    
    MÉTRICAS ORIGINALES (si las hay): ${originalMetrics ? `${originalMetrics.likes} likes, ${originalMetrics.comments} comentarios` : 'No disponibles'}
    
    Proporciona un análisis profesional en JSON con EXACTAMENTE estos campos (sin símbolos ### ni markdown):
    {
      "viralityReason": "string - Explicación concisa de por qué este post podría volverse viral (máximo 150 caracteres)",
      "bottleneck": "string - Qué limita el alcance de este post (máximo 150 caracteres)",
      "engagement_trigger": "string - Qué elemento específico genera comentarios/shares (máximo 150 caracteres)",
      "audience_relevance": "string - A qué audiencia le importa más este contenido (máximo 150 caracteres)"
    }
    
    IMPORTANTE:
    - No incluyas markdown
    - No uses ## ni # para títulos
    - Sé específico y profesional
    - Mantén cada campo bajo 150 caracteres
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Eres un experto en metrics de redes sociales y análisis de contenido viral. Responde SIEMPRE en JSON válido, sin markdown." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result;
    } catch (error) {
        console.error("Virality analysis error:", error);
        return {
            viralityReason: "Análisis no disponible",
            bottleneck: "Análisis no disponible",
            engagement_trigger: "Análisis no disponible",
            audience_relevance: "Análisis no disponible"
        };
    }
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
