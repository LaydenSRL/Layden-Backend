import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

export const createDatosObra = async (req: Request, res: Response) => {
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
        clienteId
    } = req.body;

    const timestamp = new Date().toISOString();

    try {
        // 1. Crear obra principal
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
                createdAt: timestamp,
                updatedAt: timestamp
            }])
            .select()
            .single();

        if (obraError) throw obraError;

        // 2. Crear ventanas asociadas si existen
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


// ✅ Obtener obras por cliente
export const getDatosObras = async (req: Request, res: Response) => {
    const { clienteId } = req.params;

    try {
        const { data, error } = await supabase
            .from('Obras')
            .select('*, Ventanas(*)')
            .eq('clienteId', clienteId)
            .order('entrega', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error: any) {
        console.error('Error al obtener datos de obras:', error);
        res.status(500).json({ error: error.message || 'Error al obtener datos de obras' });
    }
};

// ✅ Obtener una obra por ID
export const getDatosObraById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // 1. Obtener la obra
        const { data: obra, error: obraError } = await supabase
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
            ...obra,
            ventanas,
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al obtener datos de obra' });
    }
};

export const updateDatosObra = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ventanas, ...datosObraData } = req.body;

    try {
        // Actualizar la obra
        const { error: errorUpdateObra } = await supabase
            .from('Obras')
            .update(datosObraData)
            .eq('id', id);

        if (errorUpdateObra) throw errorUpdateObra;

        if (ventanas && Array.isArray(ventanas)) {
            // Obtener las ventanas actuales en la base de datos
            const { data: existentes, error: errorExistentes } = await supabase
                .from('Ventanas')
                .select('*')
                .eq('datosObraId', id);

            if (errorExistentes) throw errorExistentes;

            const idsActuales = existentes.map((v) => v.id);
            const idsEnviados = ventanas.filter(v => v.id).map(v => v.id);

            const nuevas = ventanas.filter(v => !v.id);
            const actualizadas = ventanas.filter(v => v.id && idsActuales.includes(v.id));
            const paraEliminar = existentes.filter(v => !idsEnviados.includes(v.id));

            // Actualizar ventanas existentes
            for (const v of actualizadas) {
                const { error: errorUpdate } = await supabase
                    .from('Ventanas')
                    .update(v)
                    .eq('id', v.id);

                if (errorUpdate) throw errorUpdate;
            }

            // Insertar nuevas
            if (nuevas.length > 0) {
                const nuevasConObraId = nuevas.map(v => ({
                    ...v,
                    datosObraId: id,
                }));

                const { error: errorInsert } = await supabase
                    .from('Ventanas')
                    .insert(nuevasConObraId);

                if (errorInsert) throw errorInsert;
            }

            // Eliminar eliminadas
            if (paraEliminar.length > 0) {
                const { error: errorDelete } = await supabase
                    .from('Ventanas')
                    .delete()
                    .in('id', paraEliminar.map(v => v.id));

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

// ✅ Eliminar obra y ventanas relacionadas
export const deleteDatosObra = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
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
