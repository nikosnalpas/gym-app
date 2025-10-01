// app/web.tsx
import React, { useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
import { WEB_BASE_URL } from "@/constants/config";

export default function WebScreen() {
  const { token: routeToken, u: routeU } = useLocalSearchParams<{
    token?: string;
    u?: string;
  }>();

  const jwt = (typeof routeToken === "string" && routeToken) || "";
  let seedUser: any = null;
  if (typeof routeU === "string" && routeU) {
    try {
      seedUser = JSON.parse(decodeURIComponent(routeU));
    } catch {}
  }

  const webRef = useRef<WebView>(null);
  const blockedLoginOnce = useRef(false);

  const startUrl = useMemo(() => `${WEB_BASE_URL}/`, []);

  const injected = useMemo(() => {
    const BOOT_TOKEN = JSON.stringify(jwt || "");
    const SEED_USER = JSON.stringify(seedUser || null);
    const ORIGIN = JSON.stringify(new URL(WEB_BASE_URL).origin);

    return `
      (function(){
        try{
          var jwt    = ${BOOT_TOKEN};
          var seed   = ${SEED_USER};
          var origin = ${ORIGIN};

          // Build absolute URL from site origin
          function abs(p){
            try { return new URL(p, origin).toString(); } catch(e){ return p; }
          }

          function setCookie(name, value, days){
            try{
              var d=new Date(); d.setTime(d.getTime()+days*24*60*60*1000);
              var expires="expires="+d.toUTCString();
              document.cookie = name+"="+encodeURIComponent(value)+"; "+expires+"; path=/; SameSite=Lax";
            }catch(e){}
          }

          // Make sure Authorization + credentials are applied even on Android
          function addAuthHeader(init){
            init = init || {};
            if (!init.credentials) init.credentials = "include";

            if (typeof Headers !== "undefined") {
              init.headers = new Headers(init.headers || {});
              if (jwt && !init.headers.get("Authorization")) {
                init.headers.set("Authorization", "Bearer " + jwt);
              }
            } else {
              init.headers = init.headers || {};
              if (jwt && !init.headers["Authorization"]) {
                init.headers["Authorization"] = "Bearer " + jwt;
              }
            }
            return init;
          }

          function hydrate(u){
            if(!u) return;
            try{
              if (jwt) u.token = jwt;

              // LocalStorage your site expects
              localStorage.setItem("auth","1");
              if (u.token) localStorage.setItem("token", u.token);
              localStorage.setItem("user", JSON.stringify(u));
              localStorage.setItem("userData", JSON.stringify(u));
              localStorage.setItem("email", u.email || "");
              localStorage.setItem("first_name", u.first_name || "");
              localStorage.setItem("last_name", u.last_name || "");
              localStorage.setItem("user_type", u.user_type || "");
              // camelCase variants
              localStorage.setItem("firstName", u.first_name || "");
              localStorage.setItem("lastName", u.last_name || "");
              localStorage.setItem("userType", u.user_type || "");
              // Cookie the SPA reads
              setCookie("auth", JSON.stringify(u), 200);
              // Optional global
              window.currentUser = u;
            }catch(e){}
          }

          // 1) Hydrate ASAP from RN seed to prevent /login bounce
          if (seed && (seed.token || jwt)) {
            hydrate(seed);
            try {
              var p=(location.pathname||"");
              if (p==="/login" || p.indexOf("/login?")===0) {
                history.replaceState(null,"","/");
              }
            } catch(e){}
          }

          // 2) Force auth on same-origin fetch/XHR (Android-safe)
          (function forceAuth(){
            try{
              var _fetch = window.fetch;
              window.fetch = function(input,init){
                var url = (typeof input==="string") ? input : (input && input.url) || "";
                var u = new URL(url, location.href);
                if (u.origin === origin && jwt){
                  init = addAuthHeader(init);
                }
                return _fetch(input, init);
              };

              var _open = XMLHttpRequest.prototype.open;
              var _send = XMLHttpRequest.prototype.send;
              XMLHttpRequest.prototype.open = function(m,u,async,usr,pw){ this.__rn_url = u; return _open.apply(this, arguments); };
              XMLHttpRequest.prototype.send = function(body){
                try{
                  var u = new URL(this.__rn_url, location.href);
                  if (u.origin === origin && jwt){
                    this.withCredentials = true;
                    this.setRequestHeader("Authorization","Bearer "+jwt);
                  }
                }catch(e){}
                return _send.apply(this, arguments);
              };
            }catch(e){}
          })();

          // 3) Set server cookie via ABSOLUTE URL (Android requires this sometimes)
          if (jwt) {
            fetch(abs("/native-session"), addAuthHeader({
              method: "POST",
              headers: { "Content-Type": "application/json", "X-No-Redirect": "1" },
              body: JSON.stringify({ token: jwt })
            })).catch(function(){});
          }

          // 4) Confirm session via ABSOLUTE URL and re-hydrate with DB user
          (function confirm(){
            fetch(abs("/session"), addAuthHeader())
              .then(function(r){ return r.text().then(function(t){ return {r:r,t:t}; }); })
              .then(function(p){
                try{
                  var data = JSON.parse(p.t);
                  if (p.r && p.r.ok && data && data.user){
                    var u = data.user || {};
                    if (jwt) u.token = jwt;
                    hydrate(u);

                    // one-time hard reload so initial SPA boot sees all state
                    if (!sessionStorage.getItem("__rn_reloaded_once__")){
                      sessionStorage.setItem("__rn_reloaded_once__","1");
                      if ((location.pathname||"")==="/login") location.replace("/");
                      else location.replace(location.href);
                    }
                  }
                }catch(e){}
              }).catch(function(){});
          })();
        }catch(e){}
      })();
      true;
    `;
  }, [jwt, seedUser]);

  const onShouldStartLoadWithRequest = (req: any) => {
    try {
      const u = new URL(req?.url || "");
      const path = (u.pathname || "").replace(/\/+$/, "");
      const isLogin = path === "/login";
      const haveCreds = !!jwt || !!seedUser;
      if (haveCreds && isLogin) {
        if (!blockedLoginOnce.current) {
          blockedLoginOnce.current = true;
          webRef.current?.injectJavaScript(
            'try{ if(location.pathname!=="/"){ location.replace("/"); } else { history.replaceState(null,"","/"); } }catch(e){}'
          );
        }
        return false;
      }
    } catch {}
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <WebView
        ref={webRef}
        source={{ uri: startUrl }}
        style={styles.webview}
        startInLoadingState
        injectedJavaScriptBeforeContentLoaded={injected}
        injectedJavaScriptBeforeContentLoadedForMainFrameOnly
        injectedJavaScriptForMainFrameOnly
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
