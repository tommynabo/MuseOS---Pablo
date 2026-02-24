# 🧠 Sistema de Feedback Loop - "El Cerebro"

## Resumen Ejecutivo

El sistema de feedback loop es un mecanismo de aprendizaje continuo donde la IA aprende de tus gustos y disgustos para mejorar constantemente el contenido que genera. **Cada vez que haces like o dislike, la próxima generación de ideas será más acorde con tus preferencias.**

---

## 1. Los Botones: Me Gusta / No Me Gusta

En el **Banco de Ideas** (status = "idea"), cada tarjeta muestra dos botones prominentes:

- 👍 **Me gusta**: Comunica a la IA "este tipo de contenido me interesa"
- 👎 **No me gusta**: Comunica "este tema/ángulo/estilo no me atrae"

### Características

- Solo aparecen en el Banco de Ideas (no en borradores ni posts aprobados)
- Se pueden cambiar en cualquier momento (un click reemplaza el otro)
- Visual: Botones a todo ancho con colores claros (verde para like, rojo para dislike)
- **Sin fricción**: 2 clicks por post

---

## 2. Cómo Funciona El Cerebro

Cuando generas nuevas ideas, el sistema:

### Paso 1: Analiza Tu Historial
Examina todos los posts que has marcado como liked/disliked en las últimas sesiones.

### Paso 2: Construye Tu Perfil de Preferencias
Usa IA (GPT-4o) para analizar patrones y crear un "contexto de preferencias" que describe:
- ✅ **Temas que te interesan**: "Historias de aprendizaje, datos concretos, frameworks"
- ❌ **Temas a evitar**: "Motivación genérica, posts políticamente polarizados"
- 💬 **Tono preferido**: "Conversacional, empático pero directo"
- 📐 **Formatos que funcionan**: "Listas numeradas, narrativa con conflicto"

---

## 3. Las 3 Fases donde El Cerebro Actúa

### 🔍 Fase 1: La Búsqueda (expandSearchQuery)

**Sin feedback:**
```
Busca posts sobre "Marketing"
→ Encuentra posts genéricos sobre marketing
```

**Con feedback:**
```
Busca posts sobre "Marketing" QUE SEAN:
- Historias de aprendizaje 
- Datos reales/métricas
- Contraintuitivos
(Porque sabemos que eso te atrae)
→ Encuentra contenido específico que te interesa
```

---

### ⚡ Fase 2: El Filtro (evaluatePostEngagement)

Después de traer posts, la IA selecciona cuáles procesar.

**Sin feedback:**
```
Criterio: "Elige posts con más engagement (likes/comments)"
→ Selecciona las tendencias virales del momento
```

**Con feedback:**
```
Criterio: "Elige posts con buen engagement QUE ENCAJEN con tus gustos"
→ Rechaza posts que todos aman pero a ti no te gustan
→ Evita "ruido viral" (tendencias que no te interesan)
```

---

### ✍️ Fase 3: La Redacción (regeneratePost)

Al escribir el nuevo contenido:

**Sin feedback:**
```
Instrucción: "Escribe siguiendo esta estructura probada"
```

**Con feedback:**
```
Instrucción: "Escribe siguiendo esta estructura PERO:
- Evita con severidad los temas que no le gustan
- Favorece los temas que le gustan
- Mantén su estilo y voz preferida"
→ Output respeta tu voz más con cada iteración
```

---

## 4. El Ciclo de Retroalimentación - Ejemplo Real

### Día 1
- Generas 5 ideas
- Marcas 3 como "Me gusta" (todas sobre psicología)
- Sistema registra: "Psicología = liked"

### Día 2  
- Generas 5 ideas
- **Resultado**: Más contenido sobre psicología, menos sobre finanzas
- Sistema refinó: "Le gusta psicología, menos interés en finanzas"

### Día 3+
- Cada generación se vuelve más afinada
- Sistema evita temas que rechazaste
- Prioriza ángulos que te sirven

---

## 5. Datos que El Sistema Recuerda

El feedback se guarda en el campo `meta` de cada post:

```json
{
  "id": 123,
  "original_content": "...",
  "meta": {
    "feedback": "like",                    // ← El feedback
    "feedback_updated_at": "2025-02-24T10:30:00Z",
    "engagement": {                        // ← Métricas originales (preserved)
      "likes": 245,
      "comments": 12,
      "shares": 3
    },
    "structure": {...},                    // ← Otros datos (preserved)
    "ai_analysis": {...}
  }
}
```

**Clave**: El sistema **NO borra información anterior**, solo añade feedback. Todo es preservado.

---

## 6. Arquitectura Técnica

### Backend

#### Endpoint: `POST /api/feedback`
Guarda el like/dislike del usuario.

```typescript
// Request
{
  "postId": 123,
  "feedback": "like" | "dislike" | "neutral"
}

// Response
{
  "status": "success",
  "message": "Feedback saved: like"
}
```

#### Función: `buildPreferencesContext(userId)`
Analiza historial y crea el "contexto de preferencias".

```typescript
// Devuelve un string como:
// "Usuario prefiere: Historias de aprendizaje con datos concretos, 
//  evitar motivación genérica, tono conversacional"
```

#### Integración en 3 funciones clave:

1. **expandSearchQuery(topic, userPreferences)**
   - Genera queries de búsqueda personalizadas

2. **evaluatePostEngagement(posts, userPreferences)**
   - Filtra posts según las preferencias

3. **regeneratePost(structure, content, instructions, userPreferences)**
   - Redacta respetando preferencias

### Frontend

#### Componente: `IdeaCard`
- Muestra botones Me gusta / No me gusta
- Estados visuales claros (verde/rojo cuando seleccionados)
- Solo para status = "idea"

#### Handler: `ContentManager.handleFeedback()`
```typescript
const handleFeedback = async (id: string, feedback: 'like' | 'dislike') => {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ postId: id, feedback })
  });
  // Actualiza estado local
}
```

---

## 7. Flujo Completo del Feedback Loop

```
┌─────────────────────────────────────┐
│ Usuario generas ideas               │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ IdeaCard muestra botones Like/Dislike│
└─────────────────┬───────────────────┘
                  │
          ┌───────┴───────┐
          │               │
          ▼               ▼
    Usuario da      Usuario da
    Like (👍)       Dislike (👎)
          │               │
          └───────┬───────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ POST /api/feedback                   │
│ Guarda en meta.feedback              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ buildPreferencesContext()            │
│ Lee historial liked/disliked         │
│ Crea contexto de preferencias        │
└─────────────────┬───────────────────┘
                  │
├─────────────────┼─────────────────┐
│                 │                 │
▼                 ▼                 ▼
Phase 1:      Phase 2:           Phase 3:
expandQuery   evaluatePost      regeneratePost
Búsqueda      Filtro             Redacción
ideal         mejor              personalizada
│                 │                 │
└─────────────────┴─────────────────┘
                  │
                  ▼
        Próximas ideas son
        ✨ Más relevantes ✨
        ✨ Más afines      ✨
```

---

## 8. Beneficios Principales

✅ **Cada generación mejora**: Menos basura, más relevancia
✅ **Personalización progresiva**: La IA te conoce mejor cada día
✅ **Evita ciclos de contenido**: No repite temas aburridos
✅ **Mantiene tu voz**: Respeta tu estilo y preferencias únicas
✅ **Sin fricción**: Solo 2 clicks per post

---

## 9. ¿Cuándo Se Activa?

El feedback se use automáticamente cada vez que:

- ✅ Generas ideas nuevas (`POST /workflow/generate`)
- ✅ El sistema expande búsquedas (`expandSearchQuery`)
- ✅ La IA filtra posts por virality (`evaluatePostEngagement`)
- ✅ Se reescribe contenido (`regeneratePost`)

**No necesitas hacer nada más que dar like/dislike. El resto es automático.**

---

## 10. Roadmap Futuro

- [ ] Dashboard de preferencias: Ver qué le gusta al usuario
- [ ] A/B testing: "Este post tipo X generó X % más engagement"
- [ ] Feedback por categoría: Like en general vs. like en estructura
- [ ] Export preferencias: "Usa mis preferencias en otro proyecto"
- [ ] Predicción de éxito: "Este post tiene X% probabilidad de viralidad basado en tus gustos"

---

## Notas de Implementación

- **Base de datos**: Feedback guardado en `posts.meta.feedback` (JSONB)
- **Privacidad**: El feedback es privado por usuario (RLS policies)
- **Performance**: `buildPreferencesContext()` cacheable para no llamar cada vez
- **Escalabilidad**: Sistema preparado para múltiples usuarios sin conflictos
