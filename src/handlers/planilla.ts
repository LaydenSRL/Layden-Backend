import { Request, Response } from 'express';
import DatosObra from '../models/Planilla.model';
import VentanaCurvado from '../models/ventanas.model';

export const createDatosObra = async (req: Request, res: Response) => {
    const { vendedor, color, entrega, tipoDeObra, cliente, obra, direccion, localidad, ventanas, clienteId } = req.body;

    try {
        const nuevaObra = await DatosObra.create({
            vendedor,
            color,
            entrega,
            tipoDeObra,
            cliente,
            obra,
            direccion,
            localidad,
            clienteId
        });

        if (ventanas && Array.isArray(ventanas)) {
            const ventanasData = ventanas.map((ventana: any) => ({
                ...ventana,
                datosObraId: nuevaObra.id,
            }));
            await VentanaCurvado.bulkCreate(ventanasData);
        }

        res.status(201).json({
            success: true,
            message: 'Obra creada exitosamente',
            data: nuevaObra,
        });
    } catch (error) {
        console.error('Error al crear datos de la obra:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear datos de la obra',
            error: error.message || error,
        });
    }
};

export const getDatosObras = async (req: Request, res: Response) => {
    const { clienteId } = req.params
    console.log(clienteId)
    try {
        const datosObras = await DatosObra.findAll({
            where: {clienteId},
            include: [{ model: VentanaCurvado }],
            order: [['entrega', 'DESC']],
        });
        res.status(200).json(datosObras);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos de obras' });
    }
};

export const getDatosObraById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const datosObra = await DatosObra.findByPk(id, {
            include: [{ model: VentanaCurvado }],
        });

        if (!datosObra) {
            return res.status(404).json({ error: 'Datos de obra no encontrados' });
        }

        res.status(200).json(datosObra);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos de obra' });
    }
};

export const updateDatosObra = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ventanas, ...datosObraData } = req.body;

    try {
        const datosObra = await DatosObra.findByPk(id, {
            include: [{ model: VentanaCurvado }],
        });

        if (!datosObra) {
            return res.status(404).json({ error: 'Datos de obra no encontrados' });
        }

        await datosObra.update(datosObraData);

        if (ventanas && Array.isArray(ventanas)) {
            const ventanasExistentes = await VentanaCurvado.findAll({
                where: { datosObraId: id },
            });

            const ventanasMap = new Map(
                ventanasExistentes.map((ventana) => [ventana.denominacion, ventana])
            );

            for (const ventana of ventanas) {
                if (ventanasMap.has(ventana.denominacion)) {
                    await VentanaCurvado.update(ventana, {
                        where: { id: ventanasMap.get(ventana.denominacion).id },
                    });
                } else {
                    await VentanaCurvado.create({
                        ...ventana,
                        datosObraId: datosObra.id,
                    });
                }
            }

            const denominacionesNuevas = ventanas.map((v) => v.denominacion);
            const ventanasAEliminar = ventanasExistentes.filter(
                (v) => !denominacionesNuevas.includes(v.denominacion)
            );

            if (ventanasAEliminar.length > 0) {
                await VentanaCurvado.destroy({
                    where: { id: ventanasAEliminar.map((v) => v.id) },
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Obra actualizada exitosamente',
            data: datosObra,
        });
    } catch (error) {
        console.error('Error al actualizar datos de la obra:', error);
        res.status(500).json({ error: 'Error al actualizar datos de la obra' });
    }
};


export const deleteDatosObra = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const datosObra = await DatosObra.findByPk(id);

        if (!datosObra) {
            return res.status(404).json({ error: 'Datos de obra no encontrados' });
        }

        await VentanaCurvado.destroy({ where: { datosObraId: datosObra.id } });
        await datosObra.destroy();

        res.status(200).json({ message: 'Datos de obra eliminados correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar datos de la obra' });
    }
};