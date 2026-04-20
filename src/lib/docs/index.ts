import { DocCategory } from '@/types';
import { dashboard } from './dashboard';
import { reservations } from './reservations';
import { floorPlan } from './floor-plan';
import { pos } from './pos';
import { kds } from './kds';
import { kitchen } from './kitchen';
import { customer } from './customer';
import { intelligence } from './intelligence';
import { inventory } from './inventory';
import { haccp } from './haccp';
import { bar } from './bar';
import { accounting } from './accounting';
import { planning } from './planning';
import { analytics } from './analytics';
import { socialMarketing } from './social-marketing';
import { aiReferencing } from './ai-referencing';
import { seo } from './seo';
import { onboarding } from './onboarding';
import { staff } from './staff';
import { settings } from './settings';
import { general } from './general';

export * from '@/types';

export const CATEGORY_DOCS: Record<string, DocCategory> = {
    general,
    dashboard,
    reservations,
    'floor-plan': floorPlan,
    pos,
    kds,
    kitchen,
    customer,
    intelligence,
    inventory,
    haccp,
    bar,
    accounting,
    planning,
    analytics,
    'social-marketing': socialMarketing,
    'ai-referencing': aiReferencing,
    seo,
    onboarding,
    staff,
    settings
};
