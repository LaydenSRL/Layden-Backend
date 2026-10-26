import { Router } from 'express';
import {
    createDatosObra,
    getDatosObras,
    getDatosObraById,
    updateDatosObra,
    deleteDatosObra
} from '../handlers/planilla';
import { getPerfilerasPlanilla, updatePerfilerasPlanilla } from '../handlers/perfilerasPlanilla';
import { requireAdmin, requireOwnClienteId } from '../middleware/auth';

const planillaRouter = Router();

// requireAuth ya corre al montar este router en server.ts. Ademas:
// - /cliente/:clienteId exige que sea el propio cliente (o un admin).
// - getDatosObraById/updateDatosObra/deleteDatosObra verifican la
//   pertenencia de la obra puntual dentro del handler (authorizeObraAccess),
//   porque ahi el "dueño" se conoce recien despues de leer la obra.
//
// Perfileras (marcas, lineas y terminaciones): las lee cualquier usuario con sesion y las edita
// solo un admin (se configuran desde el Dashboard). Van ANTES de '/:id' para que
// "perfileras" no se tome como un id de obra.
planillaRouter.get('/perfileras', getPerfilerasPlanilla);
planillaRouter.put('/perfileras', requireAdmin, updatePerfilerasPlanilla);

planillaRouter.post('/', createDatosObra);
planillaRouter.get('/cliente/:clienteId', requireOwnClienteId, getDatosObras);
planillaRouter.get('/:id', getDatosObraById);
planillaRouter.put('/:id', updateDatosObra);
planillaRouter.delete('/:id', deleteDatosObra);

export default planillaRouter;
