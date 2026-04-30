import { writable } from "svelte/store";
import type { notificationPayload } from "../types/notificationPayload";
import type { notificationType } from "../types/notificationType";

export class Notification {
  private title: string;
  private type: string;
  private message: string;
  private notificationProperties: notificationType;
  private duration: number;
  private createdAt: number;
  private remainingTime: number;

  private typeData = {
    info: "bg-blue-500",
    error: "bg-red-500",
    success: "bg-green-500",
    warn: "bg-yellow-500",
  };

  public id: number = 0;

  constructor(payload: notificationPayload, id: number) {
    this.title = payload.title;
    this.type = payload.type;
    this.message = payload.message;
    this.notificationProperties = {
      color: this.typeData[payload.type],
    };
    this.id = id;
    this.duration = payload.duration;
    this.createdAt = Date.now();
    this.remainingTime = payload.duration;
  }

  public getTitle() {
    return this.title;
  }

  public getMessage() {
    return this.message;
  }

  public getNotificationType() {
    return this.notificationProperties;
  }

  public getDuration() {
    return this.duration;
  }

  public getNotificationProperties() {
    return [this.type, this.notificationProperties];
  }

  public closeNotification() {
    removeNotification(this.id);
  }

  public getRemainingTime(): number {
    if (this.duration === 0) return 0;
    const elapsed = Date.now() - this.createdAt;
    return Math.max(0, this.duration - elapsed);
  }
}

const MAX_NOTIFICATIONS = 3;

export const notifications = writable<Notification[]>([]);

export const removeNotification = (id: number) => {
  notifications.update((current) => {
    const filteredNotifications = current.filter((notif) => notif.id !== id);

    return filteredNotifications.map((notif, index) => {
      notif.id = index;
      return notif;
    });
  });
};

export const createNewNotification = (payload: notificationPayload) => {
  notifications.update((current) => {
    const newNotif = new Notification(payload, current.length + 1);

    let updatedNotifications = [...current];
    if (updatedNotifications.length >= MAX_NOTIFICATIONS) {
      updatedNotifications.shift();
    }

    updatedNotifications = [...updatedNotifications, newNotif];

    if (payload.duration !== 0) {
      setTimeout(() => {
        removeNotification(newNotif.id);
      }, newNotif.getDuration());
    }

    return updatedNotifications;
  });
};

const returnTrue = () => {
  return true;
};

export const showCloseButton = async (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(returnTrue());
    }, delay);
  });
};
