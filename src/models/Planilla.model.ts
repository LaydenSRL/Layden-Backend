import { Table, Column, Model, DataType, HasMany, AllowNull } from 'sequelize-typescript';
import VentanaCurvado from './ventanas.model';

interface PanioFijoProps {
  tipoPropiedad: 'PanioFijo';
  divisionesHorizontales: number;
  divisionesVerticales: number;
  soldaduraEnPlanta: boolean;
  anchoSoldadura: number;
}

interface CorredizaProps {
  tipoPropiedad: 'Corrediza';
  hojas: number;
  telescopica: boolean;
  cuartoMedioCuarto: boolean;
  monorriel: boolean;
  hojaFija: boolean;
  asimetrica: boolean;
  tamanioAsimetrica: number;
}

interface AbrirProps {
  tipoPropiedad: 'Abrir';
  hojas: number;
  panioFijo: boolean;
  posPanioFijo: string;
  tamanioPanioFijo: number;
}

interface ProyectanteProps {
  tipoPropiedad: 'Proyectante';
  hojas: number;
  panioFijo: boolean;
  posPanioFijo: string;
  tamanioPanioFijo: number;
}

interface ClaraboyaProps {
  tipoPropiedad: 'Claraboya';
  divisionesVerticales: number;
}

interface BanderolaProps {
  tipoPropiedad: 'Banderola';
  hojas: number;
  panioFijo: boolean;
  posPanioFijo: string;
  tamanioPanioFijo: number;
}

interface PuertaProps {
  tipoPropiedad: 'Puerta';
  umbral: string;
  apertura: string;
  orientacionMachimbre: string;
  digital: boolean;
  rellenoPuerta: string;
  puertaYMedia: string;
  hojaInglesa: string;
  panioFijo: string;
  color: string;
  tamanioMediaPuerta: number;
  tamanioOscilo: number;
  tamanioPanioFijo: number;
  ventilacion: string;
  paneles: string;
  dosHojas: boolean;
  principal: boolean;
}

interface OsciloProps {
  tipoPropiedad: 'Oscilo';
  hojas: number;
  panioFijo: boolean;
  posPanioFijo: string;
  tamanioPanioFijo: number;
}

export type VentanaProps =
  | PanioFijoProps
  | CorredizaProps
  | AbrirProps
  | ProyectanteProps
  | ClaraboyaProps
  | BanderolaProps
  | PuertaProps
  | OsciloProps;

@Table({ tableName: 'Obras' })
class Obras extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare vendedor: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare color: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare entrega: Date;

  @Column({ type: DataType.STRING, allowNull: false })
  declare tipoDeObra: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare cliente: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare obra: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare direccion: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare localidad: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacionesObra: string;

  @HasMany(() => VentanaCurvado)
  declare ventanas: VentanaCurvado[];

  @Column({ type: DataType.STRING, allowNull: false })
  declare clienteId: string

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  declare createdAt: Date | null;

}

export default Obras;