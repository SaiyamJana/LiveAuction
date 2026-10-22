import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/database.js';

const PORT = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  try {
    // Start listening only after the database is connected.
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });

    // For example: port 5000 is already used by another program.
    server.on('error', (error) => {
      console.error('Server error:', error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start the backend:', error);
    process.exit(1);
  }
}

startServer();
