#!/bin/bash
set -e

echo "Phase E: Commerce consolidation"
mkdir -p src/modules/commerce/reservations/services
mv src/modules/commerce/orders/GuestOrderService.ts src/modules/commerce/reservations/services/ 2>/dev/null || true

mkdir -p src/modules/commerce/ui/pos
mv src/modules/commerce/payments/PayAtTableService.ts src/modules/commerce/ui/pos/ 2>/dev/null || true
mv src/modules/commerce/pos/CashCountService.ts src/modules/commerce/ui/pos/ 2>/dev/null || true
rm -rf src/modules/commerce/pos

mkdir -p src/modules/commerce/customers/services
mv src/modules/commerce/accounts/CustomerAccountService.ts src/modules/commerce/customers/services/ 2>/dev/null || true
rm -rf src/modules/commerce/accounts

mkdir -p src/modules/commerce/loyalty/services
mv src/modules/commerce/loyalty/GiftCardService.ts src/modules/commerce/loyalty/services/ 2>/dev/null || true
mv src/modules/commerce/loyalty/LoyaltyEngine.ts src/modules/commerce/loyalty/services/ 2>/dev/null || true

mkdir -p src/modules/commerce/marketing/services
mv src/modules/commerce/domain/marketing/YieldEngine.ts src/modules/commerce/marketing/services/ 2>/dev/null || true

echo "Phase E completed"
