import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
  uptimeSeconds: number;
  environment: string;
}

const startTime = Date.now();

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'singapore-psi-serverless-api',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(payload);
}
