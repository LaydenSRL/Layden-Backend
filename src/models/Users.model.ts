import { Table, Column, Model, DataType, AllowNull, Default, HasMany } from 'sequelize-typescript';
import Obras from './Planilla.model';

@Table({ tableName: 'Users' })
class User extends Model {
  @Column({ type: DataType.STRING, primaryKey: true })
  declare id: string; // UUID generado por Supabase Auth o manualmente

  @Column({ type: DataType.STRING, allowNull: false })
  declare nombre: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare rol: string; // ejemplo: 'admin', 'vendedor', etc.

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  declare estado: boolean;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  declare createdAt: Date | null;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  declare updatedAt: Date | null;

  // Si querés asociar obras al usuario:
  @HasMany(() => Obras)
  declare obras: Obras[];
}

export default User;
