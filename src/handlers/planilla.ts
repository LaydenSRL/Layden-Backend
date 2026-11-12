import { Response } from 'express';
import { supabase } from '../config/supabaseConfig';
import { AuthedRequest } from '../middleware/auth';

// Columnas de una ventana que nunca se toman del body: las pone el backend.
// Sin esto, un cliente podia mandar el datosObraId de una obra ajena o pisar
// las fechas de auditoria.
const limpiarVentana = (ventana: any) => {
    const { id: _id, datosObraId: _obra, createdAt: _creada, updatedAt: _editada, ...resto } = ventana ?? {};
    return resto;
};

// Columnas de Obras que el cliente puede modificar en un update.
const COLUMNAS_EDITABLES_OBRA = new Set([
    'vendedor',
    'color',
    'entrega',
    'tipoDeObra',
    'cliente',
    'obra',
    'direccion',
    'localidad',
    'observacionesObra',
    'perfilera',
    'numPresupuesto',
    'insumosOverride',
]);

export const createDatosObra =async (req: AuthedRequest, res: Response) => {
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
        observacionesObra,
        perfilera
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
                perfilera: perfilera || 'muchtek',
                createdAt: timestamp,
                updatedAt: timestamp
            }])
            .select()
            .single();

        if (obraError) throw obraError;

        let idsVentanas: number[] = [];

        if (ventanas && Array.isArray(ventanas) && ventanas.length > 0) {
            const ventanasConObraId = ventanas.map((ventana: any) => ({
                ...limpiarVentana(ventana),
                datosObraId: obraCreada.id,
                createdAt: timestamp,
                updatedAt: timestamp,
            }));

            const { data: insertadas, error: ventanasError } = await supabase
                .from('Ventanas')
                .insert(ventanasConObraId)
                .select('id');

            if (ventanasError) {
                // Sin esto quedaba una obra vacia colgada en el listado.
                await supabase.from('Obras').delete().eq('id', obraCreada.id);
                throw ventanasError;
            }
            idsVentanas = (insertadas ?? []).map((v) => v.id);
        }

        // `idsVentanas` (en el mismo orden en que llegaron las ventanas) le
        // permite al front conocer los ids: sin ellos, el proximo guardado
        // borraba y reinsertaba todas.
        res.status(201).json({
            success: true,
            message: 'Obra creada exitosamente',
            data: obraCreada,
            idsVentanas,
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

    // Paginado de a 50 (tope 100). Antes el front pedia 200 obras con todas
    // sus ventanas embebidas: con el uso la respuesta pasaba los 4.5 MB que
    // acepta Vercel, y las obras de mas alla de la 200 no se podian ver ni
    // buscar. Ahora el listado trae solo lo que muestra la tabla (la cantidad
    // de ventanas, no las ventanas) y la busqueda corre aca, sobre todas.
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const ascendente = req.query.orden === 'asc';
    // Se sacan los caracteres que rompen el filtro `or` de PostgREST (, ( ) ")
    // y los comodines de LIKE, para que la busqueda sea siempre literal.
    const busqueda = String(req.query.q ?? '').replace(/[%_\\,()"*:]/g, ' ').trim().slice(0, 100);

    try {
        let query = supabase
            .from('Obras')
            .select('id, numPresupuesto, cliente, obra, direccion, localidad, entrega, perfilera, Ventanas(count)', { count: 'exact' })
            .eq('clienteId', clienteId);

        if (busqueda) {
            query = query.or(`obra.ilike.%${busqueda}%,cliente.ilike.%${busqueda}%`);
        }

        const { data, error, count } = await query
            .order('entrega', { ascending: ascendente })
            .order('id', { ascending: ascendente })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        const obras = (data ?? []).map(({ Ventanas, ...obra }: any) => ({
            ...obra,
            cantVentanas: Ventanas?.[0]?.count ?? 0,
        }));

        res.status(200).json({ data: obras, count, limit, offset });
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
    // una obra a otro cliente mandando un clienteId distinto en el body. Lo
    // mismo con id y las fechas, que las maneja el backend.
    // `version` es el updatedAt que el front tenia al abrir la obra (ver mas abajo).
    const {
        ventanas,
        version,
        clienteId: _ignored,
        id: _id,
        createdAt: _creada,
        updatedAt: _editada,
        ...resto
    } = req.body;

    // Solo pasan columnas conocidas de Obras. Antes se mandaba el body entero
    // y cualquier campo de mas (o una columna sin migrar) hacia fallar el
    // PATCH con PGRST204 "column not found".
    const datosObraData = Object.fromEntries(
        Object.entries(resto ?? {}).filter(([campo]) => COLUMNAS_EDITABLES_OBRA.has(campo))
    );

    try {
        const obra = await authorizeObraAccess(req, res, id);
        if (!obra) return;

        const listaVentanas: any[] | null = Array.isArray(ventanas) ? ventanas : null;
        let idsActuales: number[] = [];

        // Se valida ANTES de escribir nada: cada id de ventana que llega tiene
        // que ser de esta obra. Antes el upsert aceptaba cualquier id, y con el
        // de una ventana de otro cliente se la "mudaba" a esta obra (se la
        // robaba y desaparecia de la obra original).
        if (listaVentanas) {
            const { data: existentes, error: errorExistentes } = await supabase
                .from('Ventanas')
                .select('id')
                .eq('datosObraId', id);

            if (errorExistentes) throw errorExistentes;

            idsActuales = (existentes ?? []).map((v) => v.id);
            const idsEnviados = listaVentanas.filter((v) => v?.id != null).map((v) => v.id);

            if (new Set(idsEnviados).size !== idsEnviados.length) {
                return res.status(400).json({ error: 'Hay ventanas repetidas en la obra.' });
            }
            if (idsEnviados.some((vId) => !idsActuales.includes(vId))) {
                return res.status(400).json({ error: 'Alguna de las ventanas no pertenece a esta obra.' });
            }
        }

        // Control de version: el update solo pasa si la obra sigue como la
        // abrio el usuario (mismo updatedAt). Si otra persona del taller, otra
        // pestaña o un doble click en "Guardar" ya la guardo en el medio, este
        // update no matchea ninguna fila y se responde 409 en vez de pisar o
        // duplicar las ventanas. Postgres bloquea la fila, asi que de dos
        // guardados simultaneos pasa uno solo.
        const nuevaVersion = new Date().toISOString();
        let updateObra = supabase
            .from('Obras')
            .update({ ...datosObraData, updatedAt: nuevaVersion })
            .eq('id', id);

        if (version) {
            updateObra = updateObra.eq('updatedAt', version);
        }

        const { data: obraActualizada, error: errorUpdateObra } = await updateObra.select('id');

        if (errorUpdateObra) {
            // PGRST204: la columna no existe en la base (falta correr una
            // migracion de Backend/sql). Se devuelve 400 con el detalle en vez
            // de un 500 generico.
            if (errorUpdateObra.code === 'PGRST204') {
                console.error('Columna faltante en Obras (correr la migracion pendiente):', errorUpdateObra.message);
                return res.status(400).json({
                    error: 'La base de datos no tiene una de las columnas que se intentó guardar. Avisale al administrador.',
                    detalle: errorUpdateObra.message,
                });
            }
            throw errorUpdateObra;
        }

        if (!obraActualizada || obraActualizada.length === 0) {
            return res.status(409).json({
                error: 'Esta obra se guardó desde otro lugar mientras la editabas. Volvé a abrirla para ver los últimos cambios.',
            });
        }

        let idsNuevos: number[] = [];

        if (listaVentanas) {
            const idsEnviados = listaVentanas.filter((v) => v?.id != null).map((v) => v.id);
            const paraEliminar = idsActuales.filter((vId) => !idsEnviados.includes(vId));

            // Existentes y nuevas van por separado: en un upsert mezclado,
            // supabase-js manda id = null en las nuevas y Postgres lo rechaza.
            const existentes = listaVentanas
                .filter((v) => v?.id != null)
                .map((v) => ({ ...limpiarVentana(v), id: v.id, datosObraId: id, updatedAt: nuevaVersion }));
            const nuevas = listaVentanas
                .filter((v) => v?.id == null)
                .map((v) => ({ ...limpiarVentana(v), datosObraId: id, createdAt: nuevaVersion, updatedAt: nuevaVersion }));

            if (existentes.length > 0) {
                const { error: errorUpsert } = await supabase
                    .from('Ventanas')
                    .upsert(existentes, { onConflict: 'id' });

                if (errorUpsert) throw errorUpsert;
            }

            if (nuevas.length > 0) {
                const { data: insertadas, error: errorInsert } = await supabase
                    .from('Ventanas')
                    .insert(nuevas)
                    .select('id');

                if (errorInsert) throw errorInsert;
                idsNuevos = (insertadas ?? []).map((v) => v.id);
            }

            if (paraEliminar.length > 0) {
                const { error: errorDelete } = await supabase
                    .from('Ventanas')
                    .delete()
                    .eq('datosObraId', id)
                    .in('id', paraEliminar);

                if (errorDelete) throw errorDelete;
            }
        }

        // `version` es la que el front tiene que mandar en el proximo guardado;
        // `idsNuevos` son los ids de las ventanas sin id, en el orden en que llegaron.
        res.status(200).json({
            success: true,
            message: 'Obra actualizada exitosamente',
            version: nuevaVersion,
            idsNuevos,
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
