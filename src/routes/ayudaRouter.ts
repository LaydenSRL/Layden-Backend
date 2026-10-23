import { Router } from 'express';
import {
  createAyudaVideo,
  deleteAyudaVideo,
  getAyudaVideos,
  updateAyudaVideo
} from '../handlers/ayuda';
import { requireAdmin } from '../middleware/auth';

const ayudaRouter = Router();

// Cualquier usuario logueado ve los videos (requireAuth se aplica al montar
// el router en server.ts); solo un admin los carga, edita o borra.
ayudaRouter.get('/', getAyudaVideos);
ayudaRouter.post('/', requireAdmin, createAyudaVideo);
ayudaRouter.put('/:id', requireAdmin, updateAyudaVideo);
ayudaRouter.delete('/:id', requireAdmin, deleteAyudaVideo);

export default ayudaRouter;
