import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

export const regeneratePost = async (outline: string, originalContent: string, persona: any) => {
    const prompt = `
    Actúa como mi "Gemelo Digital". Reescribe el contenido basándote en el outline para que suene EXACTAMENTE como yo.
    
    [OUTLINE]: ${outline}
    [TEXTO_ORIGINAL]: ${originalContent}
    
    ESTILO DE VOZ:
    - Personalidad: ${persona.personality || "Directo, contundente, energía desbordante."}
    - Expresiones: ${persona.keywords ? persona.keywords.join(", ") : "BRUTAL, TREMENDO, FUEEEEERA de lo normal"}
    - Tono: ${persona.tone || "Conversacional y energico"}
    
    Reglas:
    - Párrafos cortos.
    - Sin emojis si el estilo lo dicta.
    - Háblale de "tú".
    
    Genera el post final.
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: "Eres un redactor experto en Ghostwriting." }, { role: "user", content: prompt }],
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
