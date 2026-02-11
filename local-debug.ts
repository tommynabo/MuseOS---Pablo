
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const { default: app } = await import('./api/index.ts');

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Debug server running on http://localhost:${PORT}`);
});
