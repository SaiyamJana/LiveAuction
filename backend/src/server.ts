
import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const PORT = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the backend:', error);
    process.exit(1);
  }
}

startServer();
