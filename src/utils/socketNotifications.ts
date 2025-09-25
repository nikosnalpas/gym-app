import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { displayNotification } from "./NotificationUtils";

let socket: Socket | null = null;

/** Connect and listen for user-specific notification channel */
export const connectSocketForUser = async (
  apiBaseUrl: string,
  bearerToken: string,
  userId: number | string
) => {
  if (socket) {
    try {
      socket.disconnect();
    } catch {}
    socket = null;
  }

  socket = io(apiBaseUrl, {
    transports: ["websocket"],
    query: { token: bearerToken },
  });

  socket.on("connect", () => {
    // console.log("Socket connected");
  });

  const uid = String(userId);
  socket.on(`notification-${uid}`, async (data: any) => {
    // Persist last notification if you want
    try {
      await AsyncStorage.setItem("last_notification", JSON.stringify(data));
    } catch {}

    // Show local notification
    displayNotification(data);
  });

  socket.on("disconnect", () => {
    // console.log("Socket disconnected");
  });
};

export const disconnectSocket = () => {
  if (socket) {
    try {
      socket.disconnect();
    } catch {}
    socket = null;
  }
};
