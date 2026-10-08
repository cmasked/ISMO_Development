import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import configuration from '../config/configuration';
import { buildDatabaseOptions } from './database.options';

export default new DataSource(buildDatabaseOptions(configuration().database));
