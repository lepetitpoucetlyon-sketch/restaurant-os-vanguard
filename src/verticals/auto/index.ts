import { AutoVertical } from './AutoVertical';

// Export type & core class for internal use
export { AutoVertical } from './AutoVertical';

// Export par défaut pour l'import dynamique par le VerticalRegistry
const autoVertical = new AutoVertical();
export default autoVertical;

export * from './adapters';
