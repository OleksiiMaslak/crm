import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RepositoryDocument = HydratedDocument<Repository>;

@Schema({
  timestamps: true,
  collection: 'repositories',
})
export class Repository {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  owner!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: '' })
  language!: string;

  @Prop({ required: true, min: 0, default: 0 })
  stars!: number;

  @Prop({ required: true, min: 0, default: 0 })
  forks!: number;

  @Prop({ required: true, min: 0, default: 0 })
  openIssues!: number;

  @Prop({ required: true })
  createdAtUtcUnix!: number;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);

RepositorySchema.index({ userId: 1, owner: 1, name: 1 }, { unique: true });
