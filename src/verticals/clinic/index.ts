import { ClinicVertical } from './ClinicVertical';

// Export type & core class for internal use
export { ClinicVertical } from './ClinicVertical';

// Export par défaut pour l'import dynamique par le VerticalRegistry
const clinicVertical = new ClinicVertical();
export default clinicVertical;

export * from './adapters';
