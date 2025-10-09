import { Router } from 'express';
import {
  createEmbutido,
  getEmbutidos,
  getEmbutidoById,
  updateEmbutido,
  deleteEmbutido
} from '../handlers/embutidos';

const embutidosRouter = Router();

embutidosRouter.post('/', createEmbutido);
embutidosRouter.get('/', getEmbutidos);
embutidosRouter.get('/:id', getEmbutidoById);
embutidosRouter.put('/:id', updateEmbutido);
embutidosRouter.delete('/:id', deleteEmbutido);

export default embutidosRouter;
