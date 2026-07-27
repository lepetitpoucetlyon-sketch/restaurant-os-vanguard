const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  { from: /@\/modules\/commerce\/orders\/GuestOrderService/g, to: '@/modules/commerce/reservations/services/GuestOrderService' },
  { from: /@\/modules\/commerce\/payments\/PayAtTableService/g, to: '@/modules/commerce/ui/pos/PayAtTableService' },
  { from: /@\/modules\/commerce\/pos\/CashCountService/g, to: '@/modules/commerce/ui/pos/CashCountService' },
  { from: /@\/modules\/commerce\/accounts\/CustomerAccountService/g, to: '@/modules/commerce/customers/services/CustomerAccountService' },
  { from: /@\/modules\/commerce\/loyalty\/GiftCardService/g, to: '@/modules/commerce/loyalty/services/GiftCardService' },
  { from: /@\/modules\/commerce\/loyalty\/LoyaltyEngine/g, to: '@/modules/commerce/loyalty/services/LoyaltyEngine' },
  { from: /@\/modules\/commerce\/domain\/marketing\/YieldEngine/g, to: '@/modules/commerce/marketing/services/YieldEngine' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      if (content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

processDirectory(directoryPath);
console.log("Done updating imports for Phase E.");
