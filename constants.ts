import { ClientProfile, ContentPiece, Stats } from './types';

export const CLIENT_PROFILES: Record<string, ClientProfile> = {
  psychologist: {
    id: 'psychologist',
    name: 'Lilih M.',
    role: 'Psicóloga Clínica',
    avatar: 'https://picsum.photos/id/64/200/200',
    tone: 'Empático y Suave',
    nicheKeywords: ['Dependencia Emocional', 'Relaciones Tóxicas', 'Ansiedad', 'Autoestima', 'Psicología'],
    targetCreators: ['https://linkedin.com/in/brenebrown', 'https://linkedin.com/in/estherperel'],
    customInstructions: "Usa lenguaje inclusivo ('nosotros'). Evita jerga clínica complicada. Enfócate en la sensación de alivio y validación emocional.",
  },
  financial_advisor: {
    id: 'financial_advisor',
    name: 'Pablo R.',
    role: 'Asesor Fiscal y Patrimonial',
    avatar: 'https://picsum.photos/id/91/200/200',
    tone: 'Autoritario y Directo',
    nicheKeywords: ['Fiscalidad España', 'Autónomos', 'Gestión Patrimonial', 'Ley Fiscal'],
    targetCreators: ['https://linkedin.com/in/raydalio', 'https://linkedin.com/in/finance-guru'],
    customInstructions: "Cumplimiento legal estricto. Sin promesas de retornos garantizados. Enfócate en mitigación de riesgos y normativa de Hacienda.",
  },
};

export const MOCK_STATS: Record<string, Stats> = {
  psychologist: {
    impressions: 12540,
    postsReady: 3,
    ideasGenerated: 12,
    engagementRate: 4.2,
  },
  financial_advisor: {
    impressions: 8900,
    postsReady: 5,
    ideasGenerated: 8,
    engagementRate: 2.8,
  },
};

export const INITIAL_CONTENT: ContentPiece[] = [
  // Scenario A: Psychologist
  {
    id: 'idea-1',
    sourceType: 'creator_reference',
    originalAuthor: 'Simon Sinek',
    originalUrl: 'https://linkedin.com/post/xyz',
    originalText: "Leadership is not about being in charge. It is about taking care of those in your charge. When people feel safe, they innovate.",
    viralMetrics: { likes: 14000, comments: 230 },
    tags: ['Referencia Viral'],
    status: 'idea',
    targetDate: new Date(Date.now() + 86400000).toISOString(),
    generatedDraft: {
      hook: "No necesitas 'arreglar' a tu pareja. Necesitas entenderla.",
      body: "En las relaciones, a menudo confundimos el control con el cuidado. Intentamos moldear a alguien en una versión que nos haga sentir seguros a *nosotros*.\n\nPero la verdadera conexión ocurre cuando soltamos el resultado.\n\nCuando dejamos de intentar ser el 'líder' de la relación y empezamos a ser un compañero en el proceso de sanación.",
      cta: "¿Cuándo fue la última vez que escuchaste sin intentar resolver el problema?",
      researchNotes: ["Referencia: Teoría del Apego (Bowlby)", "Concepto: Sostener el espacio"],
    },
  },
  // Scenario B: Financial
  {
    id: 'idea-2',
    sourceType: 'keyword_search',
    originalAuthor: 'El País Economía',
    originalText: "Hacienda intensifica las inspecciones a los autónomos que trabajan desde casa en relación con las deducciones de suministros.",
    viralMetrics: { likes: 450, comments: 120 },
    tags: ['Noticia', 'Alta Urgencia'],
    status: 'drafted',
    targetDate: new Date(Date.now() + 172800000).toISOString(),
    generatedDraft: {
      hook: "🚨 Hacienda está vigilando tus facturas de luz y agua si trabajas desde casa.",
      body: "Muchos autónomos siguen deduciendo el 100% de sus suministros domésticos. Esto es un error que te puede costar una inspección.\n\nLa ley actual solo permite deducir el 30% de la proporción de metros cuadrados afectos a la actividad.\n\nEjemplo: Si tu despacho es el 10% de tu casa, solo puedes deducir el 30% de ese 10%.",
      cta: "Comenta 'AUDITORÍA' y te envío mi checklist de gastos deducibles 2024.",
      researchNotes: ["Ley 35/2006 IRPF", "Consulta Vinculante V0000-00"],
    },
  },
];