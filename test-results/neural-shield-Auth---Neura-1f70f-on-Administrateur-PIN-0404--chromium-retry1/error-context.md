# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: neural-shield.test.ts >> Auth - Neural Shield Audit >> Verification de la connexion Administrateur (PIN 0404)
- Location: tests/e2e/neural-shield.test.ts:14:9

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*(dashboard|pos|account)/
Received string:  "https://restaurant-os-web.web.app/onboarding/setup"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    18 × unexpected value "https://restaurant-os-web.web.app/onboarding/setup"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic:
      - complementary [ref=e3]:
        - button [ref=e5] [cursor=pointer]:
          - img [ref=e7]
        - navigation [ref=e9]:
          - link [ref=e14] [cursor=pointer]:
            - /url: /
            - img [ref=e17]
          - generic [ref=e24]:
            - link [ref=e26] [cursor=pointer]:
              - /url: /intelligence
              - img [ref=e29]
            - link [ref=e33] [cursor=pointer]:
              - /url: "#"
              - img [ref=e36]
          - generic [ref=e40]:
            - link [ref=e42] [cursor=pointer]:
              - /url: /pos
              - img [ref=e45]
            - link [ref=e50] [cursor=pointer]:
              - /url: /floor-plan
              - img [ref=e53]
            - link [ref=e56] [cursor=pointer]:
              - /url: /kds
              - img [ref=e59]
          - generic [ref=e63]:
            - link [ref=e65] [cursor=pointer]:
              - /url: /reservations
              - img [ref=e68]
            - link [ref=e71] [cursor=pointer]:
              - /url: /omnichannel-reservations
              - img [ref=e74]
            - link [ref=e78] [cursor=pointer]:
              - /url: /crm
              - img [ref=e81]
            - link [ref=e84] [cursor=pointer]:
              - /url: /quotes
              - img [ref=e87]
            - link [ref=e91] [cursor=pointer]:
              - /url: /groups
              - img [ref=e94]
          - generic [ref=e102]:
            - link [ref=e104] [cursor=pointer]:
              - /url: /kitchen
              - img [ref=e107]
            - link [ref=e110] [cursor=pointer]:
              - /url: /bar
              - img [ref=e113]
            - link [ref=e116] [cursor=pointer]:
              - /url: /storage-map
              - img [ref=e119]
            - link [ref=e122] [cursor=pointer]:
              - /url: /inventory
              - img [ref=e125]
            - link [ref=e130] [cursor=pointer]:
              - /url: /haccp
              - img [ref=e133]
            - link [ref=e138] [cursor=pointer]:
              - /url: /quality
              - img [ref=e141]
          - generic [ref=e146]:
            - link [ref=e148] [cursor=pointer]:
              - /url: /onboarding
              - img [ref=e151]
            - link [ref=e155] [cursor=pointer]:
              - /url: /staff
              - img [ref=e158]
            - link [ref=e164] [cursor=pointer]:
              - /url: /planning
              - img [ref=e167]
            - link [ref=e170] [cursor=pointer]:
              - /url: /leaves
              - img [ref=e173]
            - link [ref=e179] [cursor=pointer]:
              - /url: /recruitment
              - img [ref=e182]
          - generic [ref=e187]:
            - link [ref=e189] [cursor=pointer]:
              - /url: /analytics
              - img [ref=e192]
            - link [ref=e195] [cursor=pointer]:
              - /url: /analytics-integration
              - img [ref=e198]
            - link [ref=e201] [cursor=pointer]:
              - /url: /social-marketing
              - img [ref=e204]
            - link [ref=e208] [cursor=pointer]:
              - /url: /ai-referencing
              - img [ref=e211]
            - link [ref=e215] [cursor=pointer]:
              - /url: /seo
              - img [ref=e218]
          - link [ref=e225] [cursor=pointer]:
            - /url: /finance
            - img [ref=e228]
          - link [ref=e235] [cursor=pointer]:
            - /url: /accounting
            - img [ref=e238]
          - link [ref=e244] [cursor=pointer]:
            - /url: /registre
            - img [ref=e247]
          - generic [ref=e252]:
            - link [ref=e254] [cursor=pointer]:
              - /url: /settings
              - img [ref=e257]
            - link [ref=e261] [cursor=pointer]:
              - /url: /account-settings
              - img [ref=e264]
        - button [ref=e277]:
          - img [ref=e278]
        - button "Bascule de profil désactivée" [ref=e284]:
          - img [ref=e285]
      - button "Ouvrir le menu" [ref=e287] [cursor=pointer]:
        - img [ref=e288]
    - generic [ref=e290]:
      - banner [ref=e291]:
        - generic [ref=e295]:
          - button "Ouvrir le tutoriel de cette page" [ref=e296]:
            - img [ref=e297]
          - heading "Onboarding." [level=1] [ref=e299]: Onboarding.
        - generic [ref=e301]:
          - button [ref=e302]:
            - img [ref=e304]
          - button "🇫🇷" [ref=e308]:
            - generic [ref=e310]: 🇫🇷
          - button "88" [ref=e311]:
            - img [ref=e313]
            - generic [ref=e316]: "88"
          - button [ref=e318]
          - button [ref=e326]:
            - img [ref=e328]
      - main [ref=e331]:
        - generic [ref=e336]:
          - generic [ref=e337]:
            - generic [ref=e339]: OS
            - heading "Restaurant OS | Founder Tunnel" [level=1] [ref=e340]
          - generic [ref=e341]:
            - generic [ref=e342]:
              - img [ref=e344]
              - generic [ref=e348]:
                - heading "Identité de Marque" [level=2] [ref=e349]
                - paragraph [ref=e350]: Définissez l'ADN de votre établissement
            - generic [ref=e351]:
              - generic [ref=e352]:
                - text: Nom de l'Instance
                - 'textbox "ex: Le Grand Restaurant" [ref=e353]'
              - generic [ref=e354]:
                - text: Slogan / Signature
                - 'textbox "ex: L''excellence au service du goût" [ref=e355]'
              - button "Valider l'Identité" [ref=e356]:
                - text: Valider l'Identité
                - img [ref=e357]
        - button [ref=e366]:
          - img [ref=e368]
        - button [ref=e373]:
          - img [ref=e375]
  - alert [ref=e380]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * 🛡️ Shadow Run : Audit de la Sécurité "Neural Shield" (Argon2id)
  5  |  * Version 2.0 - Sélecteurs robustes pour PinLogin Premium.
  6  |  */
  7  | test.describe('Auth - Neural Shield Audit', () => {
  8  |     
  9  |     test.beforeEach(async ({ page }) => {
  10 |         // Redirection vers l'URL de production ou locale
  11 |         await page.goto('https://restaurant-os-web.web.app/');
  12 |     });
  13 | 
  14 |     test('Verification de la connexion Administrateur (PIN 0404)', async ({ page }) => {
  15 |         // 1. Attente de la pile de profils
  16 |         // On cherche le texte "Admin" ou "Administrateur" dans un bouton
  17 |         const adminProfile = page.locator('button', { hasText: /Admin/i }).first();
  18 |         await adminProfile.waitFor({ state: 'visible', timeout: 20000 });
  19 |         
  20 |         // 2. Sélection du profil Admin
  21 |         await adminProfile.click();
  22 |         
  23 |         // 3. Saisie du PIN (0404)
  24 |         // Les boutons du clavier contiennent le chiffre directement
  25 |         for (const digit of '0404') {
  26 |             await page.locator(`button`, { hasText: new RegExp(`^${digit}$`) }).click();
  27 |         }
  28 |         
  29 |         // 4. Clic sur le bouton de soumission (Icône LogIn)
  30 |         // Le bouton "submit" est le dernier du clavier
  31 |         await page.locator('button', { has: page.locator('svg') }).filter({ has: page.locator('lucide-log-in, .lucide-log-in') }).click();
  32 |         
  33 |         // 5. Validation et Redirection (Dashboard ou POS)
  34 |         // On laisse un peu de temps pour la redirection vers / dashboard ou /pos
> 35 |         await expect(page).toHaveURL(/.*(dashboard|pos|account)/, { timeout: 15000 });
     |                            ^ Error: expect(page).toHaveURL(expected) failed
  36 |         
  37 |         // 6. Capture de réussite
  38 |         await page.screenshot({ path: 'shadow_runs/auth_success.png' });
  39 |     });
  40 | 
  41 |     test('Rejet d\'un PIN incorrect (9999)', async ({ page }) => {
  42 |         const adminProfile = page.locator('button', { hasText: /Admin/i }).first();
  43 |         await adminProfile.waitFor({ state: 'visible' });
  44 |         await adminProfile.click();
  45 |         
  46 |         for (const digit of '9999') {
  47 |             await page.locator(`button`, { hasText: new RegExp(`^${digit}$`) }).click();
  48 |         }
  49 |         
  50 |         await page.locator('button', { has: page.locator('svg') }).filter({ has: page.locator('lucide-log-in, .lucide-log-in') }).click();
  51 |         
  52 |         // L'URL ne doit pas changer vers le dashboard
  53 |         await expect(page).not.toHaveURL(/.*(dashboard|pos|account)/);
  54 |         
  55 |         // Capture d'échec
  56 |         await page.screenshot({ path: 'shadow_runs/auth_failure.png' });
  57 |     });
  58 | });
  59 | 
```