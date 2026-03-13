import { BodyPartEnum } from "$lib/enums/bodyPartEnum";

export class RepairItem {
    private _id?: number;
    private _name: string;
    private _cost: number;
    private _bodyPart?: BodyPartEnum;

    constructor(name: string, cost: number, bodyPart?: BodyPartEnum, id?: number) {
        this._id = id;
        this._name = name;
        this._cost = cost;
        this._bodyPart = bodyPart;
    }

    get id(): number | undefined { return this._id; }
    get name(): string { return this._name; }
    get cost(): number { return this._cost; }
    get bodyPart(): BodyPartEnum | undefined { return this._bodyPart; }

    toJSON() {
        return {
            id: this._id,
            name: this._name,
            cost: this._cost,
            bodyPart: this._bodyPart
        };
    }
}
