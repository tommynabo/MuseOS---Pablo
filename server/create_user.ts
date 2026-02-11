import { supabaseAdmin } from './db';

const createUser = async () => {
    const email = 'tomasnivraone@gmail.com';
    const password = '123';

    console.log(`Creating user: ${email}...`);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto-confirm the user
    });

    if (error) {
        console.error('Error creating user:', error.message);
        return;
    }

    console.log('User created successfully:', data.user);

    // Create profile entry for Pablo
    const { error: profileError } = await supabaseAdmin
        .from('profiles_pablo')
        .insert({
            id: data.user.id,
            name: 'Pablo',
            role: 'Financial Advisor',
            tone: 'Professional',
            custom_instructions: 'Asesor financiero corporativo especializado en empresas y ejecutivos. Tono profesional y cercano, enfocado en educación financiera y estrategias de inversión.'
        });

    if (profileError) {
        console.error('Error creating profile:', profileError.message);
    } else {
        console.log('Profile created successfully.');
    }
};

createUser();
