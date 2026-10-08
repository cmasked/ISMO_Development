import { AppConfiguration } from './configuration.interface';
import { validateEnvironment } from './environment.validation';

export default (): AppConfiguration => validateEnvironment(process.env);
