// Função serverless única da Vercel: todas as rotas /api/* chegam aqui (ver vercel.json).
import { handle } from '../lib/app.js';
export default function handler(req, res) { return handle(req, res); }
