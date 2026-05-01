import { Order } from './shared/nexus/contracts/ops.types';
import { Transaction } from './modules/finance/types';
import { EmployeeSettings as Employee } from './shared/nexus/contracts/settings/hr';

const testOrder: Order = {};
const testTransaction: Transaction = {};
const testEmployee: Employee = {};

console.log(testOrder, testTransaction, testEmployee);
