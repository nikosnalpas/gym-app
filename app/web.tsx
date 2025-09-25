import React, { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  WEB_BASE_URL,
  API_BASE_URL,
  NATIVE_SESSION_URL,
} from "@/constants/config";

export default function WebScreen() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(true);
  const webRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      try {
        if (token) {
          await fetch(NATIVE_SESSION_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-No-Redirect": "1",
            },
            body: JSON.stringify({ token }),
            credentials: "include",
          });
        }
      } catch {}
      setBootstrapping(false);
    })();
  }, [token]);

  const injected = `(() => {
    try {
      var jwt = ${JSON.stringify(token || "")};
      var bearer = jwt ? ("Bearer " + jwt) : "";
      var hosts = [${JSON.stringify(
        new URL(API_BASE_URL).host
      )}, "127.0.0.1:3001", "localhost:3001"];

      function toApi(u){ try{var url=new URL(u,location.href);return hosts.indexOf(url.host)!==-1;}catch(e){return false;} }

      var _fetch=window.fetch;
      window.fetch=function(i,o){o=o||{};var s=(typeof i==="string")?i:(i&&i.url)?i.url:"";
        if(toApi(s)&&bearer){o.headers=new Headers(o.headers||{});if(!o.headers.get("Authorization"))o.headers.set("Authorization",bearer);if(!o.credentials)o.credentials="include";}
        return _fetch(i,o);
      };

      var _open=XMLHttpRequest.prototype.open,_send=XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open=function(m,u){this.__rn_url=u;return _open.apply(this,arguments);};
      XMLHttpRequest.prototype.send=function(b){try{var url=new URL(this.__rn_url,location.href);if(toApi(url.href)&&bearer){this.withCredentials=true;this.setRequestHeader("Authorization",bearer);}}catch(e){}return _send.apply(this,arguments);};

      function getCookie(n){try{return document.cookie.split("; ").find(r=>r.startsWith(n+"="))?.split("=")[1]||"";}catch(e){return"";}}
      var lastHasAuth=!!getCookie("auth_token")||!!getCookie("token")||!!(localStorage.getItem("auth")||localStorage.getItem("token"));
      setInterval(()=>{try{
        var hasAuth=!!getCookie("auth_token")||!!getCookie("token")||!!(localStorage.getItem("auth")||localStorage.getItem("token"));
        if(lastHasAuth && !hasAuth){
          window.ReactNativeWebView?.postMessage(JSON.stringify({type:"LOGGED_OUT"}));
        }
        lastHasAuth=hasAuth;
      }catch(e){}},1000);
    }catch(e){}
  })(); true;`;

  const onMessage = async (e: any) => {
    const raw = e?.nativeEvent?.data;
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      msg = null;
    }
    const type = msg?.type ?? msg?.message ?? msg?.event;

    if (
      type === "LOGGED_OUT" ||
      type === "LOGOUT" ||
      type === "NATIVE_LOGOUT"
    ) {
      try {
        await logout();
      } catch {}
      router.replace("/sign-in");
    }
  };

  return (
    // Only apply TOP safe-area; no bottom padding so the WebView reaches the very bottom
    <SafeAreaView style={styles.container} edges={["top"]}>
      {!bootstrapping && (
        <WebView
          ref={webRef}
          source={{ uri: WEB_BASE_URL + "/" }}
          style={styles.webview}
          startInLoadingState
          injectedJavaScriptBeforeContentLoaded={injected}
          injectedJavaScript={injected}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          bounces={false}
          allowsLinkPreview={false}
          pullToRefreshEnabled={false} // disable swipe-to-refresh
          overScrollMode="never" // no edge glow
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false} // ignore window.open/new tabs
          contentInsetAdjustmentBehavior="never" // don’t auto inset
          automaticallyAdjustContentInsets={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // match your app bg or leave it neutral; it won’t show once WebView fills
  container: { flex: 1, backgroundColor: "#363636" },
  // cover entire container (ignores accidental padding/margins)
  webview: { ...StyleSheet.absoluteFillObject },
});
