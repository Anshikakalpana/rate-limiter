import express from 'express';
import cors from 'cors';
import limiterRoutes from './routes/limiter.js';

const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/limiter', limiterRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: Date.now() 
  });
});


app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

export default app;