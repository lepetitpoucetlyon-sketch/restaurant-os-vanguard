import { registerAccountingSyncHandler } from '../handlers/AccountingSyncHandler';

/**
 * Handlers finance qui ne peuvent tourner QUE cote serveur.
 *
 * AccountingSyncHandler dechiffre les credentials du connecteur comptable via
 * credentialCipher, qui pose `import 'server-only'`. Monter ce groupe depuis le
 * bootstrap client ferait remonter server-only dans le bundle navigateur — et
 * `next build` echoue. Il n'est donc appele que par registerServerNexusHandlers().
 *
 * Ce n'est pas une perte fonctionnelle : la synchro comptable pousse vers une API
 * tierce avec des secrets, elle n'a rien a faire dans le navigateur.
 */
export function registerFinanceServerHandlers(): Array<() => void> {
  return [registerAccountingSyncHandler()];
}
