import { CarEnum } from "../enums/carEnum.js";
import type { CarType } from "../types/carType.js";

export class Car {
    private car: CarType;

    constructor(
        car : CarType
    ) {
        this.car = car;
        this.car.insuranceValid = car.insuranceValidUntil > new Date();
        this.car.technicalInspectionValid = car.technicalInspectionValidUntil > new Date();
    }

    getCarInfo() {
        return {
            car: this.car
        };
    }
}