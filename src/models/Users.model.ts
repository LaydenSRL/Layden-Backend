import { Table, Column, Model, DataType, AllowNull, Default, HasMany, IsEmail } from 'sequelize-typescript';
import Obras from './Planilla.model';

type RendimientoTipo = "ml" | "unidad" | "tapadesague" | "esquinaRemate" | "mm" | "tornillo" | "tapatornillo" | "tornillosMosq";

type Insumo = {
  name: string;
  rendimiento: number;
  tipo: RendimientoTipo;
};

const rendimientoInsumos: Insumo[] = [
  { name: "Tornillo de Colocacion", rendimiento: 500, tipo: "tornillo" },
  { name: "Tapatornillo", rendimiento: 400, tipo: "tapatornillo" },
  { name: "Espuma", rendimiento: 30000, tipo: "ml" },
  { name: "Sellador", rendimiento: 6000, tipo: "ml" },
  { name: "Esquina Remate Interior", rendimiento: 1, tipo: "esquinaRemate" },
  { name: "Tornillo Cabezon", rendimiento: 400, tipo: "ml" },
  { name: "Tornillos Punta Aguja", rendimiento: 600, tipo: "tornillosMosq" },
  { name: "Tapa Desague", rendimiento: 2, tipo: "tapadesague" },
];

type ConfigCalculo = {
  margen: number;
  distancia: number;
  porcentajeReciclado: number;
};

const configCalculo: ConfigCalculo = {
  margen: 300,
  distancia: 700,
  porcentajeReciclado: 50,
};

const insumos = {
  rendimientoInsumos,
  configCalculo
}


@Table({ tableName: 'Users' })
class User extends Model {
  @Column({ type: DataType.STRING, primaryKey: true })
  declare id: string; // UUID generado por Supabase Auth o manualmente

  @Column({ type: DataType.STRING, allowNull: false })
  declare nombre: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare numero: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare rol: string; // ejemplo: 'admin', 'vendedor', etc.

  @IsEmail
  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string

  @Default(true)
  @Column({ type: DataType.STRING })
  declare estado: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  declare createdAt: Date | null;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  declare updatedAt: Date | null;

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  declare vendedores: string[];

  @Column({ type: DataType.JSONB, defaultValue: insumos })
  declare insumos: { rendimientoInsumos: Insumo[]; configCalculo: ConfigCalculo; }
}

export default User;
