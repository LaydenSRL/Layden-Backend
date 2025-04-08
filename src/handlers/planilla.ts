import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

// ✅ Crear obra + ventanas
export const createDatosObra = async (req: Request, res: Response) => {
    const { vendedor, color, entrega, tipoDeObra, cliente, obra, direccion, localidad, ventanas, clienteId } = req.body;

    try {
        const { data: nuevaObra, error: errorObra } = await supabase
            .from('datos_obras')
            .insert([
                { vendedor, color, entrega, tipoDeObra, cliente, obra, direccion, localidad, clienteId }
            ])
            .select()
            .single();

        if (errorObra) throw errorObra;

        if (ventanas && Array.isArray(ventanas)) {
            const ventanasData = ventanas.map((ventana: any) => ({
                ...ventana,
                datosObraId: nuevaObra.id,
            }));

            const { error: errorVentanas } = await supabase
                .from('ventanas_curvado')
                .insert(ventanasData);

            if (errorVentanas) throw errorVentanas;
        }

        res.status(201).json({
            success: true,
            message: 'Obra creada exitosamente',
            data: nuevaObra,
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
            .from('datos_obras')
            .select('*, ventanas_curvado(*)')
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
        const { data, error } = await supabase
            .from('datos_obras')
            .select('*, ventanas_curvado(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al obtener datos de obra' });
    }
};

// ✅ Actualizar una obra + ventanas
export const updateDatosObra = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ventanas, ...datosObraData } = req.body;

    try {
        const { error: errorUpdateObra } = await supabase
            .from('datos_obras')
            .update(datosObraData)
            .eq('id', id);

        if (errorUpdateObra) throw errorUpdateObra;

        if (ventanas && Array.isArray(ventanas)) {
            // Obtener ventanas existentes
            const { data: existentes, error: errorExistentes } = await supabase
                .from('ventanas_curvado')
                .select('*')
                .eq('datosObraId', id);

            if (errorExistentes) throw errorExistentes;

            const existentesMap = new Map(
                existentes.map((v: { denominacion: string; id: number }) => [v.denominacion, v])
            );

            const nuevas = [];
            const actualizadas = [];

            for (const ventana of ventanas) {
                if (existentesMap.has(ventana.denominacion)) {
                    actualizadas.push({
                        ...ventana,
                        id: (existentesMap.get(ventana.denominacion) as { id: number }).id,
                    });
                } else {
                    nuevas.push({ ...ventana, datosObraId: id });
                }
            }

            // Actualizar ventanas existentes
            for (const v of actualizadas) {
                await supabase
                    .from('ventanas_curvado')
                    .update(v)
                    .eq('id', v.id);
            }

            // Insertar nuevas ventanas
            if (nuevas.length > 0) {
                await supabase
                    .from('ventanas_curvado')
                    .insert(nuevas);
            }

            // Eliminar las que fueron quitadas
            const nuevasDenominaciones = ventanas.map((v) => v.denominacion);
            const paraEliminar = existentes.filter(
                (v: { denominacion: string }) => !nuevasDenominaciones.includes(v.denominacion)
            );

            if (paraEliminar.length > 0) {
                await supabase
                    .from('ventanas_curvado')
                    .delete()
                    .in('id', paraEliminar.map((v) => v.id));
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
            .from('ventanas_curvado')
            .delete()
            .eq('datosObraId', id);

        if (errorVentanas) throw errorVentanas;

        const { error: errorObra } = await supabase
            .from('datos_obras')
            .delete()
            .eq('id', id);

        if (errorObra) throw errorObra;

        res.status(200).json({ message: 'Datos de obra eliminados correctamente' });
    } catch (error: any) {
        console.error('Error al eliminar datos de la obra:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar datos de la obra' });
    }
};
