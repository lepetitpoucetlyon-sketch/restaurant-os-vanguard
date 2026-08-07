import { HealthVertical } from './HealthVertical';

// Export type & core class for internal use
export { HealthVertical } from './HealthVertical';

// Export par défaut pour l'import dynamique par le VerticalRegistry
const healthVertical = new HealthVertical();
export default healthVertical;

export * from './adapters';
