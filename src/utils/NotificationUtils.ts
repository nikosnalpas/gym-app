import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

type TapCb = (url?: string) => void;

/** Show a local notification immediately */
export const displayNotification = async (data: any) => {
  const title =
    data?.data?.title ?? data?.notification?.title ?? data?.title ?? "";
  const body =
    data?.data?.text ??
    data?.data?.body ??
    data?.body ??
    data?.text ??
    data?.notification?.body ??
    data?.notification?.text ??
    "";

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null, // fire now
  });
};

/** Get Expo push token (use later if you wire push via Expo’s push service) */
export const getNotificationToken = async (
  onToken?: (token: string) => void
) => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    if (!Device.isDevice) return; // Simulator won’t get a token

    // Works without EAS projectId in dev; for production push, set projectId
    const projectId =
      // @ts-ignore (handles different Expo versions)
      Constants?.expoConfig?.extra?.eas?.projectId ||
      // @ts-ignore
      Constants?.easConfig?.projectId;

    // @ts-ignore
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    onToken?.(token);
    return token;
  } catch {
    return;
  }
};

/** Foreground tap handler + make notifications show while app is open */
export const registerForegroundNotification = (onPress?: TapCb) => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const sub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const url = (response.notification.request.content.data as any)
        ?.notification_link;
      if (onPress && url) onPress(url);
    }
  );
  return () => sub.remove();
};

/** Placeholder: background behavior for push (needs EAS build for real bg) */
export const registerBackgroundNotification = () => {
  // No-op for Expo Go. When you EAS-build, you can add background handling.
};
