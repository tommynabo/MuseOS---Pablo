-- =========================================
-- MIGRACIÓN DE DATOS: Usuario Anterior → Usuario Pablo
-- =========================================
-- Este script copia todos los datos del usuario anterior
-- a las tablas del nuevo usuario de Pablo.

-- ⚠️ IMPORTANTE: Reemplaza 'UUID_USUARIO_ANTERIOR' con el UUID real del usuario anterior
-- El UUID del usuario anterior es probablemente: tomasnivraone@gmail.com
-- Puedes encontrarlo en Supabase → Authentication → Users

-- UUID del nuevo usuario de Pablo (ya creado)
-- pablo.financiero@example.com → 343fe57b-c17f-4aea-bfbf-addc5b790db0

-- =========================================
-- PASO 1: Copiar el perfil
-- =========================================

-- Primero, eliminar el perfil auto-generado si existe
DELETE FROM profiles_pablo WHERE id = '343fe57b-c17f-4aea-bfbf-addc5b790db0';

-- Copiar el perfil del usuario anterior, cambiando el ID al nuevo usuario
INSERT INTO profiles_pablo (id, name, role, avatar, tone, niche_keywords, target_creators, custom_instructions, created_at, updated_at)
SELECT
    '343fe57b-c17f-4aea-bfbf-addc5b790db0' as id, -- Nuevo UUID de Pablo
    name,
    role,
    avatar,
    tone,
    niche_keywords,
    target_creators,
    custom_instructions,
    created_at,
    updated_at
FROM profiles
WHERE id = 'UUID_USUARIO_ANTERIOR'; -- ← REEMPLAZAR con el UUID del usuario anterior

-- =========================================
-- PASO 2: Copiar los creadores
-- =========================================

INSERT INTO creators_pablo (user_id, name, linkedin_url, headline, created_at)
SELECT
    '343fe57b-c17f-4aea-bfbf-addc5b790db0' as user_id, -- Nuevo UUID de Pablo
    name,
    linkedin_url,
    headline,
    created_at
FROM creators
WHERE user_id = 'UUID_USUARIO_ANTERIOR'; -- ← REEMPLAZAR con el UUID del usuario anterior

-- =========================================
-- PASO 3: Copiar los posts
-- =========================================

INSERT INTO posts_pablo (user_id, original_post_id, original_url, original_content, original_author, generated_content, type, meta, status, created_at, updated_at)
SELECT
    '343fe57b-c17f-4aea-bfbf-addc5b790db0' as user_id, -- Nuevo UUID de Pablo
    original_post_id,
    original_url,
    original_content,
    original_author,
    generated_content,
    type,
    meta,
    status,
    created_at,
    updated_at
FROM posts
WHERE user_id = 'UUID_USUARIO_ANTERIOR'; -- ← REEMPLAZAR con el UUID del usuario anterior

-- =========================================
-- VERIFICACIÓN
-- =========================================

-- Ver cuántos datos se migraron
SELECT 'Perfil' as tipo, COUNT(*) as cantidad FROM profiles_pablo WHERE id = '343fe57b-c17f-4aea-bfbf-addc5b790db0'
UNION ALL
SELECT 'Creadores' as tipo, COUNT(*) as cantidad FROM creators_pablo WHERE user_id = '343fe57b-c17f-4aea-bfbf-addc5b790db0'
UNION ALL
SELECT 'Posts' as tipo, COUNT(*) as cantidad FROM posts_pablo WHERE user_id = '343fe57b-c17f-4aea-bfbf-addc5b790db0';
