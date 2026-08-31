import { Response } from 'express';
import { supabase } from '../config/supabaseConfig';
import { AuthedRequest } from '../middleware/auth';

export const createDatosObra = async (req: AuthedRequest, res: Response) => {
    const {
        vendedor,
        color,
        entrega,
        tipoDeObra,
        cliente,
        obra,
        direccion,
        localidad,
        ventanas,
        observacionesObra
    } = req.body;

    // clienteId nunca se toma del body: lo pone el token verificado por
    // requireAuth, para que nadie pueda crear una obra a nombre de otro
    // cliente mandando un clienteId distinto.
    const clienteId = req.user!.id;

    const timestamp = new Date().toISOString();

    try {
        const { data: obraCreada, error: obraError } = await supabase
            .from('Obras')
            .insert([{
                vendedor,
                color,
                entrega,
                tipoDeObra,
                cliente,
                obra,
                direccion,
                localidad,
                clienteId,
                observacionesObra,
                createdAt: timestamp,
                updatedAt: timestamp
            }])
            .select()
            .single();

        if (obraError) throw obraError;

        if (ventanas && Array.isArray(ventanas)) {
            const ventanasConObraId = ventanas.map((ventana: any) => ({
                ...ventana,
                datosObraId: obraCreada.id,
                createdAt: timestamp,
                updatedAt: timestamp,
            }));

            const { error: ventanasError } = await supabase
                .from('Ventanas')
                .insert(ventanasConObraId);

            if (ventanasError) throw ventanasError;
        }

        res.status(201).json({
            success: true,
            message: 'Obra creada exitosamente',
            data: obraCreada,
        });

    } catch (error: any) {
        console.error('Error al crear datos de la obra:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear datos de la obra',
            error: error.message || error,
        });
    }
};

// Confirma que la obra pertenece al usuario autenticado (o que es admin)
// antes de dejarlo leer/editar/borrar. Devuelve la obra si esta autorizado,
// o null si ya respondio el error correspondiente (404/403).
const authorizeObraAccess = async (req: AuthedRequest, res: Response, obraId: string) => {
    const { data: obra, error } = await supabase
        .from('Obras')
        .select('id, clienteId')
        .eq('id', obraId)
        .single();

    if (error || !obra) {
        res.status(404).json({ error: 'Obra no encontrada.' });
        return null;
    }

    if (req.user?.rol !== 'admin' && obra.clienteId !== req.user?.id) {
        res.status(403).json({ error: 'No tenes permisos para acceder a esta obra.' });
        return null;
    }

    return obra;
};

export const getDatosObras = async (req: AuthedRequest, res: Response) => {
    const { clienteId } = req.params;

    // Paginado: sin parametros devuelve las primeras 50 (mas recientes),
    // antes traia la tabla entera de un cliente en una sola respuesta.
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    try {
        const { data, error, count } = await supabase
            .from('Obras')
            .select('*, Ventanas(*)', { count: 'exact' })
            .eq('clienteId', clienteId)
            .order('entrega', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.status(200).json({ data, count, limit, offset });
    } catch (error: any) {
        console.error('Error al obtener datos de obras:', error);
        res.status(500).json({ error: error.message || 'Error al obtener datos de obras' });
    }
};

export const getDatosObraById = async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;

    try {
        const obra = await authorizeObraAccess(req, res, id);
        if (!obra) return;

        const { data: obraCompleta, error: obraError } = await supabase
            .from('Obras')
            .select('*')
            .eq('id', id)
            .single();

        if (obraError) throw obraError;

        const { data: ventanas, error: ventanasError } = await supabase
            .from('Ventanas')
            .select('*')
            .eq('datosObraId', id)
            .order('orden', { ascending: true });

        if (ventanasError) throw ventanasError;

        res.status(200).json({
            ...obraCompleta,
            ventanas,
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al obtener datos de obra' });
    }
};

export const updateDatosObra = async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    // clienteId tampoco se acepta en el update: no se puede "transferir"
    // una obra a otro cliente mandando un clienteId distinto en el body.
    const { ventanas, clienteId: _ignored, ...datosObraData } = req.body;

    try {
        const obra = await authorizeObraAccess(req, res, id);
        if (!obra) return;

        const { error: errorUpdateObra } = await supabase
            .from('Obras')
            .update(datosObraData)
            .eq('id', id);

        if (errorUpdateObra) throw errorUpdateObra;

        if (ventanas && Array.isArray(ventanas)) {
            const { data: existentes, error: errorExistentes } = await supabase
                .from('Ventanas')
                .select('id')
                .eq('datosObraId', id);

            if (errorExistentes) throw errorExistentes;

            const idsActuales = existentes.map((v) => v.id);
            const idsEnviados = ventanas.filter(v => v.id).map(v => v.id);
            const paraEliminar = idsActuales.filter(vId => !idsEnviados.includes(vId));

            // Un solo upsert en vez de un update por ventana (evita N+1
            // queries en obras con muchas ventanas): las que tienen id
            // existente se actualizan, las que no, se insertan.
            const ventanasConObraId = ventanas.map(v => ({
                ...v,
                datosObraId: id,
            }));

            if (ventanasConObraId.length > 0) {
                const { error: errorUpsert } = await supabase
                    .from('Ventanas')
                    .upsert(ventanasConObraId, { onConflict: 'id' });

                if (errorUpsert) throw errorUpsert;
            }

            if (paraEliminar.length > 0) {
                const { error: errorDelete } = await supabase
                    .from('Ventanas')
                    .delete()
                    .in('id', paraEliminar);

                if (errorDelete) throw errorDelete;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Obra actualizada exitosamente',
        });
    } catch (error: any) {
        console.error('Error al actualizar datos de la obra:', error);
        res.status(500).json({ error: error.message || 'Error al actualizar datos de la obra' });
    }
};

export const deleteDatosObra = async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;

    try {
        const obra = await authorizeObraAccess(req, res, id);
        if (!obra) return;

        const { error: errorVentanas } = await supabase
            .from('Ventanas')
            .delete()
            .eq('datosObraId', id);

        if (errorVentanas) throw errorVentanas;

        const { error: errorObra } = await supabase
            .from('Obras')
            .delete()
            .eq('id', id);

        if (errorObra) throw errorObra;

        res.status(200).json({ message: 'Datos de obra eliminados correctamente' });
    } catch (error: any) {
        console.error('Error al eliminar datos de la obra:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar datos de la obra' });
    }
};
