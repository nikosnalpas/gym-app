// app/web.tsx
import React, { useMemo, useRef, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
import { WEB_BASE_URL } from "@/constants/config";

export default function WebScreen() {
  const { token: routeToken } = useLocalSearchParams<{ token?: string }>();

  const jwt = (typeof routeToken === "string" && routeToken) || "";
  const webRef = useRef<WebView>(null);
  const didHandshakeRef = useRef(false); // becomes true after native-session redirect lands

  // Start directly at /native-session?token=... so the server sets cookies then redirects to "/"
  const startUrl = useMemo(() => {
    if (jwt) {
      const u = new URL("/native-session", WEB_BASE_URL);
      u.searchParams.set("token", jwt);
      return u.toString();
    }
    // No token passed from RN — show site login
    return `${WEB_BASE_URL}/login`;
  }, [jwt]);

  // When navigation happens, mark handshake complete once we’ve left /native-session
  const onNavigationStateChange = useCallback((nav: any) => {
    try {
      const url = String(nav?.url || "");
      const origin = new URL(WEB_BASE_URL).origin;
      const cur = new URL(url);
      if (cur.origin === origin) {
        // If we are no longer on /native-session, assume cookies are set
        if (!/\/native-session(?:$|\?)/.test(cur.pathname)) {
          didHandshakeRef.current = true;
        }
      }
    } catch {}
  }, []);

  // If the app already finished the handshake, block any later navigations to /login
  const onShouldStartLoadWithRequest = useCallback((req: any) => {
    try {
      const reqUrl = new URL(req?.url || "", WEB_BASE_URL);
      const path = (reqUrl.pathname || "").replace(/\/+$/, "");
      const isLogin = path === "/login";

      if (didHandshakeRef.current && isLogin) {
        // We’re already authenticated at the server — keep user on "/"
        webRef.current?.injectJavaScript(
          'try{ if(location.pathname!=="/"){ location.replace("/"); } else { history.replaceState(null,"","/"); } }catch(e){}'
        );
        return false;
      }
    } catch {}
    return true;
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <WebView
        ref={webRef}
        source={{ uri: startUrl }}
        style={styles.webview}
        startInLoadingState
        // No heavy injections needed — the server sets both cookies.
        // Keep the handlers lightweight and deterministic:
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
        pullToRefreshEnabled={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#363636" },
  webview: { ...StyleSheet.absoluteFillObject },
});
