import { supabaseAdmin } from './db';

const createPabloUser = async () => {
    // IMPORTANTE: Usar un email DIFERENTE al del proyecto original
    const email = 'pablo.financiero@example.com'; // ← CAMBIAR ESTE EMAIL
    const password = 'pablo123'; // ← CAMBIAR ESTA CONTRASEÑA

    console.log(`\n🔵 Creating Pablo user: ${email}...`);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the user
        user_metadata: {
            name: 'Pablo',
            role: 'Financial Advisor'
        }
    });

    if (error) {
        console.error('❌ Error creating user:', error.message);
        return;
    }

    console.log('✅ User created successfully!');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 UUID:', data.user.id);
    console.log('\n⚠️  IMPORTANTE: Guarda este UUID para migrar datos si es necesario.\n');

    // Create profile entry for Pablo in profiles_pablo table
    const { error: profileError } = await supabaseAdmin
        .from('profiles_pablo')
        .insert({
            id: data.user.id,
            name: 'Pablo',
            role: 'Financial Advisor',
            tone: 'Professional',
            niche_keywords: ['fiscalidad', 'impuestos', 'asesor financiero', 'inversiones'],
            target_creators: [],
            custom_instructions: 'Asesor financiero corporativo especializado en empresas y ejecutivos. Tono profesional y cercano, enfocado en educación financiera y estrategias de inversión.'
        });

    if (profileError) {
        console.error('❌ Error creating profile:', profileError.message);
    } else {
        console.log('✅ Profile created successfully in profiles_pablo table.');
    }

    console.log('\n🎉 SETUP COMPLETO! Ahora puedes:');
    console.log('1. Iniciar sesión en el proyecto Pablo con:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('2. Los datos de Pablo estarán completamente separados del proyecto original.');
    console.log('\n');
};

createPabloUser();
