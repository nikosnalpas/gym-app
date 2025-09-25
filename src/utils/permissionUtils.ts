import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Ask for notifications + camera, store the results */
export const askPermissions = async () => {
  // Notifications
  const notif = await Notifications.requestPermissionsAsync();
  const hasNotificationAccess =
    notif.status === "granted" || notif.status === "provisional";

  // Camera
  const cam = await Camera.requestCameraPermissionsAsync();
  const hasCameraAccess = cam.status === "granted" ? "granted" : "denied";

  await AsyncStorage.setItem("hasCameraAccess", hasCameraAccess);
  await AsyncStorage.setItem(
    "hasNotificationAccess",
    String(hasNotificationAccess)
  );
};

export const retrievePermissions = async (
  cameraCb: (v: string | null) => void,
  notificationCb: (v: string | null) => void
) => {
  const hasCameraAccess = await AsyncStorage.getItem("hasCameraAccess");
  const hasNotificationAccess = await AsyncStorage.getItem(
    "hasNotificationAccess"
  );
  cameraCb(hasCameraAccess);
  notificationCb(hasNotificationAccess);
};

export const handlePermissions = async (
  setHasCameraAccess: (v: string | null) => void,
  setHasNotificationAccess: (v: string | null) => void
) => {
  await retrievePermissions(setHasCameraAccess, setHasNotificationAccess);
};
