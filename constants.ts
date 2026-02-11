import { ClientProfile, ContentPiece, Stats } from './types';

export const CLIENT_PROFILES: Record<string, ClientProfile> = {
  financial_advisor: {
    id: 'financial_advisor',
    name: 'Pablo',
    role: 'Asesor Financiero / Gestor Patrimonial',
    avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200',
    tone: 'Cercano pero Profesional',
    nicheKeywords: ['Fiscalidad España', 'Jubilación', 'Fondos de Inversión', 'Cuentas de Depósitos', 'Planes de Pensiones', 'Inflación', 'Gestión Patrimonial'],
    targetCreators: ['https://linkedin.com/in/marcvidal', 'https://linkedin.com/in/juanrallo', 'https://linkedin.com/in/raydalio'],
    customInstructions: "Eres Pablo, un Asesor Financiero y Gestor Patrimonial independiente en España con más de 25 años de experiencia. Tienes 56 años, eres padre de familia y hablas desde la voz de la experiencia, la seguridad y la prudencia financiera.Tu objetivo es educar a profesionales y familias sobre cómo proteger su dinero frente a la inflación, optimizar su fiscalidad (específicamente en España) y planificar su jubilación de forma inteligente.Tono y Estilo:Cercano pero Profesional: Eres el asesor de confianza de toda la vida. Usas un tono educado, directo, sin vender humo ni prometer rendimientos mágicos. No usas lenguaje de 'criptobro' ni de 'lobo de Wall Street'.Prudente: Siempre recalcas la importancia de la diversificación y el perfil de riesgo.Formato de Escritura: Párrafos muy cortos (1-2 líneas), uso estratégico de saltos de línea y emojis sobrios (📉, 💡, 🏛️).Regla de Oro: NUNCA menciones a la empresa 'Safe Bro'. Hablas siempre como profesional independiente.Instrucción de Tarea:Vas a recibir un tema o un post viral sobre finanzas. Tu trabajo es reescribirlo usando tu tono y experiencia. El post debe tener:Un 'Hook' (gancho) que hable de un dolor real (pagar muchos impuestos, perder poder adquisitivo).Una explicación sencilla de un concepto complejo.Un CTA (Call to Action) al final pidiendo a la gente que te contacte o comente si quieren revisar su salud financiera.",
  },
};

export const MOCK_STATS: Record<string, Stats> = {
  financial_advisor: {
    impressions: 8900,
    postsReady: 5,
    ideasGenerated: 24,
    engagementRate: 2.8,
  },
};

export const INITIAL_CONTENT: ContentPiece[] = [
  // Scenario A: Financial News
  {
    id: 'idea-1',
    sourceType: 'keyword_search',
    originalAuthor: 'El País Economía',
    originalUrl: 'https://elpais.com/economia',
    originalText: "Hacienda intensifica las inspecciones a los autónomos que trabajan desde casa en relación con las deducciones de suministros.",
    viralMetrics: { likes: 450, comments: 120 },
    tags: ['Noticia', 'Fiscalidad'],
    status: 'idea',
    targetDate: new Date(Date.now() + 86400000).toISOString(),
    generatedDraft: {
      hook: "🚨 Hacienda está vigilando tus facturas de luz y agua si trabajas desde casa.",
      body: "Muchos autónomos siguen deduciendo el 100% de sus suministros domésticos. Esto es un error que te puede costar una inspección.\n\nLa ley actual solo permite deducir el 30% de la proporción de metros cuadrados afectos a la actividad.\n\nEjemplo: Si tu despacho es el 10% de tu casa, solo puedes deducir el 30% de ese 10%.",
      cta: "¿Tienes dudas sobre qué puedes deducir? Comenta 'AUDITORÍA' y lo revisamos.",
      researchNotes: ["Ley 35/2006 IRPF", "Consulta Vinculante V0000-00"],
      viralityAnalysis: {
        viralityReason: "El contenido genera miedo controlado (fear appeal) que convierte lectores en savers/sharers. Los autónomos comparten para proteger a colegas.",
        bottleneck: "Aunque genera urgencia, puede resultar cínica o alarmista si no se incluye el contexto legal completo.",
        engagement_trigger: "El CTA 'comenta AUDITORÍA' genera engagement directo. Los autónomos comentan por miedo y por ayudar a otros.",
        audience_relevance: "Altamente relevante para autónomos y profesionales independientes en España."
      }
    },
    aiAnalysis: {
        hook: { type: "Urgency", text: "🚨 Hacienda está vigilando tus facturas", effectiveness: 85, why_it_works: "Miedo a la autoridad" },
        virality_score: { overall: 85, verdict: "High Probability" }
    }
  },
  // Scenario B: Investment Wisdom
  {
    id: 'idea-2',
    sourceType: 'creator_reference',
    originalAuthor: 'Ray Dalio',
    originalText: "Cash is trash. You need to be diversified.",
    viralMetrics: { likes: 15000, comments: 800 },
    tags: ['Inversión', 'Mentalidad'],
    status: 'drafted',
    targetDate: new Date(Date.now() + 172800000).toISOString(),
    generatedDraft: {
      hook: "¿Sigues guardando todo tu dinero en la cuenta corriente?",
      body: "Con la inflación actual, dejar el dinero quieto es perder poder adquisitivo día a día. \n\nNo se trata de hacerse rico rápido, se trata de proteger lo que tanto te ha costado ganar.\n\nLa diversificación no es solo una estrategia, es un seguro de vida para tu patrimonio.",
      cta: "Si quieres saber cómo proteger tus ahorros este año, escríbeme.",
      researchNotes: ["Datos inflación INE", "Principios de Ray Dalio"],
      viralityAnalysis: {
        viralityReason: "Toca el dolor de la pérdida de valor del dinero (aversión a la pérdida).",
        bottleneck: "Puede parecer un consejo genérico si no se acompaña de datos actuales.",
        engagement_trigger: "Pregunta retórica inicial que invita a la reflexión.",
        audience_relevance: "Relevante para familias y ahorradores preocupados por el futuro."
      }
    },
    aiAnalysis: {
        hook: { type: "Question", text: "¿Sigues guardando todo tu dinero...?", effectiveness: 75, why_it_works: "Curiosity gap" },
        virality_score: { overall: 70, verdict: "Medium Probability" }
    }
  },
];