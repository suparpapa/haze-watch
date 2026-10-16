import type { Request, Response } from 'express';

const ONEMAP_SEARCH_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const searchVal = String(req.query.searchVal || '178903');
  const returnGeom = String(req.query.returnGeom || 'Y');
  const getAddrDetails = String(req.query.getAddrDetails || 'Y');
  const pageNum = String(req.query.pageNum || '1');

  try {
    const targetUrl = new URL(ONEMAP_SEARCH_URL);
    targetUrl.searchParams.set('searchVal', searchVal);
    targetUrl.searchParams.set('returnGeom', returnGeom);
    targetUrl.searchParams.set('getAddrDetails', getAddrDetails);
    targetUrl.searchParams.set('pageNum', pageNum);

    const upstreamRes = await fetch(targetUrl.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Singapore-PSI-Monitor/1.0',
      },
    });

    const data = await upstreamRes.json();
    res.status(upstreamRes.status).json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Failed to fetch from OneMap',
      message: error.message || 'Unknown network error',
    });
  }
}
