import { CarEnum } from "../enums/carEnum.js";
import type { CarType } from "../types/carType.js";

export class Car {
    private car: CarType;

    constructor(
        car : CarType
    ) {
        this.car = car;
        this.car.insuranceValid = car.insuranceValidUntil ? car.insuranceValidUntil > new Date() : false;
        this.car.technicalInspectionValid = car.technicalInspectionValidUntil ? car.technicalInspectionValidUntil > new Date() : false;
    }

    getCarInfo() {
        return {
            car: this.car
        };
    }
}