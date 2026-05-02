const fs = require('fs');
const path = 'src/domain/services/AccessPolicyManager.ts';
let code = fs.readFileSync(path, 'utf8');

const newMethod = `
function canAccessDocument(user: User | null, documentOwnerId: string): boolean {
    if (!user) return false;
    // Social Shield: Un utilisateur RESTRICTED ne peut accéder qu'à ses documents personnels
    if ((user as any).status === 'RESTRICTED') {
        return user.id === documentOwnerId;
    }
    // Admin has super-user bypass
    if (user.role === 'admin') return true;
    return true; // For ACTIVE users
}
`;

code = code.replace('export const AccessPolicyManager = {', newMethod + '\nexport const AccessPolicyManager = {\n    canAccessDocument,');
fs.writeFileSync(path, code);
