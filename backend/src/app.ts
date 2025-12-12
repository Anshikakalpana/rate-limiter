import express from 'express';
import cors from 'cors';
import limiterRoutes from './routes/limiter.js';
import type { Request, Response } from 'express';
const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/limiter', limiterRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: Date.now() 
  });
});




export default app;