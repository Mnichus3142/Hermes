import type { CarType } from "../types/carType";
import { Car } from "./car";

class CarStore {
    private _cars: Car[] = $state([]);

    setCars(carsData: CarType[]) {
        this._cars = carsData.map(carData => new Car(carData));
    }

    addCar(carData: CarType) {
        const newCar = new Car(carData);
        this._cars.push(newCar);
    }

    get cars() {
        return this._cars;
    }
}

export const carStore = new CarStore();