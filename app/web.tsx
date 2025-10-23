import React, { useMemo, useRef, useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
import { WEB_BASE_URL } from "@/constants/config";

const safeURL = (pathOrAbs: string, base?: string) => {
  try {
    return base
      ? new URL(pathOrAbs, base).toString()
      : new URL(pathOrAbs).toString();
  } catch {
    return "about:blank";
  }
};

export default function WebScreen() {
  const { token: routeToken } = useLocalSearchParams<{ token?: string }>();

  const jwt = (typeof routeToken === "string" && routeToken) || "";
  const webRef = useRef<WebView>(null);
  const didHandshakeRef = useRef(false);

  const startUrl = useMemo(() => {
    if (jwt) {
      return safeURL(
        `/native-session?token=${encodeURIComponent(jwt)}`,
        WEB_BASE_URL
      );
    }
    return safeURL("/login", WEB_BASE_URL);
  }, [jwt]);

  const onNavigationStateChange = useCallback((nav: any) => {
    try {
      const url = String(nav?.url || "");
      const cur = new URL(url);
      let origin = "";
      try {
        origin = new URL(WEB_BASE_URL).origin;
      } catch {}
      if (origin && cur.origin === origin) {
        if (!/\/native-session(?:$|\?)/.test(cur.pathname)) {
          didHandshakeRef.current = true;
        }
      }
    } catch {}
  }, []);

  const onShouldStartLoadWithRequest = useCallback((req: any) => {
    try {
      const reqUrl = new URL(req?.url || "", WEB_BASE_URL);
      const path = (reqUrl.pathname || "").replace(/\/+$/, "");
      const isLogin = path === "/login";

      if (didHandshakeRef.current && isLogin) {
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
  webview: { flex: 1 },
});
