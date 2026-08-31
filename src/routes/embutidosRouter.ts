import { Router } from 'express';
import {
  createEmbutido,
  getEmbutidos,
  getEmbutidoById,
  updateEmbutido,
  deleteEmbutido
} from '../handlers/embutidos';
import { requireAdmin } from '../middleware/auth';

const embutidosRouter = Router();

// Catalogo compartido: cualquier usuario logueado lo puede leer (requireAuth
// ya se aplica al montar el router en server.ts), pero solo un admin puede
// modificarlo -antes cualquiera con la URL podia crear/editar/borrar.
embutidosRouter.post('/', requireAdmin, createEmbutido);
embutidosRouter.get('/', getEmbutidos);
embutidosRouter.get('/:id', getEmbutidoById);
embutidosRouter.put('/:id', requireAdmin, updateEmbutido);
embutidosRouter.delete('/:id', requireAdmin, deleteEmbutido);

export default embutidosRouter;
