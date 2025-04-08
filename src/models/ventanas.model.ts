import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import  DatosObra  from "./Planilla.model";
import { VentanaProps } from "./Planilla.model";

@Table({ tableName: 'ventanas_curvado' })
class ventanas_curvado extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => DatosObra)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare datosObraId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare denominacion: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare ancho: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare alto: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare tipoCarpinteria: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare linea: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare vidrio: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare mano: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare terminaciones: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare mosq: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare ml: number;

  @Column({ type: DataType.TEXT })
  declare observaciones: string;

  @Column({ type: DataType.TEXT })
  declare observacionesExtras: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare esmerilado: boolean;

  @Column({ type: DataType.JSON, allowNull: false })
  declare propiedades: VentanaProps;

  @BelongsTo(() => DatosObra)
  declare datosObra: DatosObra;
}

export default ventanas_curvado