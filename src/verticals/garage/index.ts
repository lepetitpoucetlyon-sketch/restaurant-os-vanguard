import { GarageVertical } from './GarageVertical';

// Export type & core class for internal use
export { GarageVertical } from './GarageVertical';

// Export par défaut pour l'import dynamique par le VerticalRegistry
const garageVertical = new GarageVertical();
export default garageVertical;

export * from './adapters';
