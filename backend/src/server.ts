import app from './app.js';
import redis from './utils/redis.js';


const PORT =  3000;
async function startServer() {
  try {
   
   
    console.log(' Redis connected');

  
    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n Shutting down...');
  process.exit(0);
});

startServer();