import type { CarType } from "../types/carType";
import { Car } from "./car";

class CarStore {
    private _cars: Car[] = $state([]);

    addCar(carData: CarType) {
        const newCar = new Car(carData);
        this.cars.push(newCar);
    }

    get cars() {
        return this._cars;
    }
}

export const carStore = new CarStore();