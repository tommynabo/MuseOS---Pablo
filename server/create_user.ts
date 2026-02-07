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

    // Create profile entry
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: data.user.id,
            name: 'Tomas',
            role: 'Admin',
            tone: 'Professional',
            custom_instructions: 'Default instructions'
        });

    if (profileError) {
        console.error('Error creating profile:', profileError.message);
    } else {
        console.log('Profile created successfully.');
    }
};

createUser();
