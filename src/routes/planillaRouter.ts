import { Router } from 'express';
import {
    createDatosObra,
    getDatosObras,
    getDatosObraById,
    updateDatosObra,
    deleteDatosObra
} from '../handlers/planilla';

const planillaRouter = Router();

planillaRouter.post('/', createDatosObra);
planillaRouter.get('/cliente/:clienteId', getDatosObras);
planillaRouter.get('/:id', getDatosObraById);
planillaRouter.put('/:id', updateDatosObra);
planillaRouter.delete('/:id', deleteDatosObra);

export default planillaRouter;
