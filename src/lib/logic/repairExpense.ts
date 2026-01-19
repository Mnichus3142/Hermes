export class repairExpense {
    private _id?: number;
    private _date: Date;
    private _description: string;
    private _cost: number;
    private _mileage?: number;

    constructor(date: Date, description: string, cost: number, mileage?: number, id?: number) {
        this._id = id;
        this._date = date;
        this._description = description;
        this._cost = cost;
        this._mileage = mileage;
    }

    get id(): number | undefined { return this._id; }
    get date(): Date { return this._date; }
    get description(): string { return this._description; }
    get cost(): number { return this._cost; }
    get mileage(): number | undefined { return this._mileage; }
}
