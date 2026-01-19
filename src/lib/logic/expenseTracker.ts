import { fuelExpense } from "./fuelExpense";
import { repairExpense } from "./repairExpense";

export class ExpenseTracker {
    private _fuelExpenses: fuelExpense[] = [];
    private _repairExpenses: repairExpense[] = [];

    get expenses() {
        return this._fuelExpenses;
    }

    get repairs() {
        return this._repairExpenses;
    }

    async loadExpenses(vin: string) {
        try {
            const response = await fetch('/api/expenses/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carVin: vin })
            });
            const data = await response.json();
            if (data.success) {
                // Parse Fuel
                this._fuelExpenses = data.expenses
                    .filter((e: any) => e.category === 'FUEL')
                    .map((e: any) => {
                         const liters = e.liters || 0;
                         const pricePerLiter = liters > 0 ? (e.amount / liters) : 0;
                         return new fuelExpense(new Date(e.date), liters, pricePerLiter, e.id);
                    });
                this._fuelExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());

                // Parse Repairs
                this._repairExpenses = data.expenses
                    .filter((e: any) => e.category === 'REPAIR')
                    .map((e: any) => {
                        return new repairExpense(
                            new Date(e.date), 
                            e.description, 
                            e.amount, 
                            e.mileage, 
                            e.id
                        );
                    });
                this._repairExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
            }
        } catch (e) {
            console.error("Failed to load expenses", e);
        }
    }

    // --- FUEL METHODS ---
    async addFuelExpense(vin: string, date: Date, liters: number, pricePerLiter: number, mileage?: number): Promise<boolean> {
        const expense = new fuelExpense(date, liters, pricePerLiter);

        try {
            const response = await fetch('/api/expenses/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    carVin: vin,
                    date: date.toISOString(),
                    description: 'Refueling',
                    amount: expense.totalCost,
                    category: 'FUEL',
                    mileage: mileage,
                    liters: liters
                })
            });

            const result = await response.json();

            if (result.success) {
                if (result.expense && result.expense.id) {
                     this._fuelExpenses.push(new fuelExpense(date, liters, pricePerLiter, result.expense.id));
                } else {
                     this._fuelExpenses.push(expense);
                }
                
                this._fuelExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to add expense", e);
            return false;
        }
    }

    async deleteFuelExpense(vin: string, id: number): Promise<boolean> {
        try {
            const response = await fetch('/api/expenses/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carVin: vin, id: id })
            });

            const result = await response.json();

            if (result.success) {
                this._fuelExpenses = this._fuelExpenses.filter(e => e.id !== id);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to delete expense", e);
            return false;
        }
    }

    async updateFuelExpense(vin: string, id: number, date: Date, liters: number, pricePerLiter: number, mileage?: number): Promise<boolean> {
         const expense = new fuelExpense(date, liters, pricePerLiter, id);

        try {
            const response = await fetch('/api/expenses/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    carVin: vin,
                    date: date.toISOString(),
                    description: 'Refueling',
                    amount: expense.totalCost,
                    category: 'FUEL',
                    mileage: mileage,
                    liters: liters
                })
            });

            const result = await response.json();

            if (result.success) {
                const index = this._fuelExpenses.findIndex(e => e.id === id);
                if (index !== -1) {
                    this._fuelExpenses[index] = expense;
                    this._fuelExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
                }
                return true;
            }
            return false;
        } catch (e) {
             console.error("Failed to update expense", e);
             return false;
        }
    }

    calculateTotalFuelExpenses(): number {
        return this._fuelExpenses.reduce((total, expense) => total + expense.totalCost, 0);
    }

    // --- REPAIR METHODS ---

    async addRepairExpense(vin: string, date: Date, description: string, cost: number, mileage?: number): Promise<boolean> {
        const repair = new repairExpense(date, description, cost, mileage);

        try {
            const response = await fetch('/api/expenses/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    carVin: vin,
                    date: date.toISOString(),
                    description: description,
                    amount: cost,
                    category: 'REPAIR',
                    mileage: mileage
                })
            });

            const result = await response.json();

            if (result.success) {
                 if (result.expense && result.expense.id) {
                     this._repairExpenses.push(new repairExpense(date, description, cost, mileage, result.expense.id));
                } else {
                     this._repairExpenses.push(repair);
                }
                this._repairExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to add repair", e);
            return false;
        }
    }

    async deleteRepairExpense(vin: string, id: number): Promise<boolean> {
        try {
            const response = await fetch('/api/expenses/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carVin: vin, id: id })
            });

            const result = await response.json();

            if (result.success) {
                this._repairExpenses = this._repairExpenses.filter(e => e.id !== id);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to delete repair", e);
            return false;
        }
    }

    async updateRepairExpense(vin: string, id: number, date: Date, description: string, cost: number, mileage?: number): Promise<boolean> {
         const repair = new repairExpense(date, description, cost, mileage, id);

        try {
            const response = await fetch('/api/expenses/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    carVin: vin,
                    date: date.toISOString(),
                    description: description,
                    amount: cost,
                    category: 'REPAIR',
                    mileage: mileage
                })
            });

            const result = await response.json();

            if (result.success) {
                const index = this._repairExpenses.findIndex(e => e.id === id);
                if (index !== -1) {
                    this._repairExpenses[index] = repair;
                    this._repairExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
                }
                return true;
            }
            return false;
        } catch (e) {
             console.error("Failed to update repair", e);
             return false;
        }
    }

    calculateTotalRepairExpenses(): number {
        return this._repairExpenses.reduce((total, expense) => total + expense.cost, 0);
    }
}