import * as fs from 'fs';

const path = 'src/domain/schemas/users.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export const UserSchema_v2 = z\.object\(\{([\s\S]*?)\}\);/,
  `export const UserSchema_v2 = z.object({$1  preferences2FA: z.object({
    email_enabled: z.boolean().default(false),
    sms_enabled: z.boolean().default(false)
  }).optional(),
});`
);

fs.writeFileSync(path, content, 'utf8');
