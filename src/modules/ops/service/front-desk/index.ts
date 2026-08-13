// Front-desk — Generic front-desk / check-in module (hotel, clinic, co-working, etc.)
export type {
  GuestRecord,
  GuestStatus,
  CheckInInput,
} from './domain/types/front-desk';

export { FrontDeskService } from './application/services/FrontDeskService';
export {
  guestRecordsAtom,
  frontDeskLoadingAtom,
  activeGuestsAtom,
  expectedGuestsAtom,
} from './application/store/frontDeskAtom';
