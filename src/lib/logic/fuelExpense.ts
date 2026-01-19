export class fuelExpense {
    private _id?: number;
    private _date: Date;
    private _liters: number;
    private _pricePerLiter: number;
    private _totalCost: number;

    constructor(date: Date, liters: number, pricePerLiter: number, id?: number) {
        this._id = id;
        this._date = date;
        this._liters = liters;
        this._pricePerLiter = pricePerLiter;
        this._totalCost = this.calculateTotalCost();
    }

    private calculateTotalCost(): number {
        return this._liters * this._pricePerLiter;
    }

    get id(): number | undefined { return this._id; }
    get date(): Date { return this._date; }
    get liters(): number { return this._liters; }
    get pricePerLiter(): number { return this._pricePerLiter; }
    get totalCost(): number { return this._totalCost; }
}