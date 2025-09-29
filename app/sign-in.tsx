import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  IS_DEV,
  WEB_BASE_URL,
  API_BASE_URL,
  SIGN_IN_URL,
  FORGOT_PASSWORD_URL,
} from "@/constants/config";

const PRIMARY = "#f8fb1d";
const BG = "#363636";
const TEXT = "#ffffff";
const BORDER = "#555555";
const INPUT_BG = "#2b2b2b";

export default function SignIn() {
  const router = useRouter();
  const { login: loginWithAuthHook } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [openForgot, setOpenForgot] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showProtectionModal, setShowProtectionModal] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // Register (UI-only)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [repeatPwd, setRepeatPwd] = useState("");

  // Common
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ---------- helpers ----------
  const urls = useMemo(
    () => ({
      WEB_BASE_URL,
      API_BASE_URL,
      SIGN_IN_URL,
      FORGOT_PASSWORD_URL,
    }),
    []
  );

  const showNetError = (prefix: string, e: any) => {
    const msg = e?.message || String(e);
    console.log(`[NET] ${prefix} error:`, e);
    setErrorMsg(`${prefix}: ${msg}`);
  };

  async function testApi() {
    setErrorMsg("");
    setSuccessMsg("");
    const url = `${API_BASE_URL}/get-logo-link`;
    console.log("[TEST] GET", url);
    try {
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      console.log("[TEST] status:", res.status, "body:", text);
      setSuccessMsg(`GET /get-logo-link OK (status ${res.status})`);
      if (!res.ok) setErrorMsg(text);
    } catch (e) {
      showNetError("GET /get-logo-link", e);
    }
  }

  // temporarily add this button near “Test API”
  const testGoogle = async () => {
    try {
      const res = await fetch("https://www.google.com", { method: "GET" });
      console.log("google status:", res.status);
      alert("google: " + res.status);
    } catch (e: any) {
      alert("google failed: " + e.message);
    }
  };

  // ---------- login ----------
  // ---------- login ----------
const handleLogin = async () => {
  setErrorMsg("");
  setSuccessMsg("");

  if (!loginEmail) return setErrorMsg("Παρακαλώ εισάγετε email");
  if (!loginPwd) return setErrorMsg("Παρακαλώ εισάγετε κωδικό");

  console.log("[AUTH] POST", SIGN_IN_URL, { email: loginEmail });
  try {
    const res = await fetch(SIGN_IN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPwd }),
    });

    const raw = await res.text();
    let json: any = null;
    try { json = JSON.parse(raw); } catch {}

    console.log("[AUTH] status:", res.status, "body(200 chars):", raw.slice(0,200));

    if (res.ok && json?.user?.token) {
      const u = json.user;
      const token = u.token;

      // Make a minimal, flat object exactly like the site expects in cookie "auth"
      const seed = {
        token,
        user_id: u.user_id,
        user_type: u.user_type || "",
        email: u.email || "",
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        parent_email: u.parent_email || "",
        parent_email2: u.parent_email2 || "",
      };

      // (optional) keep your auth context in sync
      try { await loginWithAuthHook(loginEmail, loginPwd); } catch {}

      // Pass both token and the flat user seed to /web
      const uParam = encodeURIComponent(JSON.stringify(seed));
      router.replace({ pathname: "/web", params: { token, u: uParam } });
      return;
    }


    const serverMsg =
      (json && (json.message || json.error)) ||
      (raw && raw.slice(0, 300)) ||
      "Αποτυχία σύνδεσης";
    setErrorMsg(serverMsg);
  } catch (e: any) {
    setErrorMsg("Δίκτυο: " + (e?.message || String(e)));
  }
};


  // ---------- register (UI only here) ----------
  const handleRegister = () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!firstName) return setErrorMsg("Παρακαλώ εισάγετε όνομα");
    if (!lastName) return setErrorMsg("Παρακαλώ εισάγετε επώνυμο");
    if (!email) return setErrorMsg("Παρακαλώ εισάγετε email");
    if (!pwd) return setErrorMsg("Παρακαλώ εισάγετε κωδικό");
    if (pwd.length < 6)
      return setErrorMsg("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.");
    if (!(/[A-Za-zΑ-Ωα-ω]/.test(pwd) && /\d/.test(pwd)))
      return setErrorMsg("Ο κωδικός χρειάζεται γράμμα και αριθμό.");
    if (pwd !== repeatPwd) return setErrorMsg("Οι κωδικοί δεν ταιριάζουν");
    if (!acceptTerms)
      return setErrorMsg(
        "Η εγγραφή απαιτεί αποδοχή όρων χρήσης & πολιτικής προστασίας."
      );

    setSuccessMsg(
      "Επιτυχής εγγραφή (demo UI). Συνδεθείτε όταν ενεργοποιηθεί ο λογαριασμός."
    );
    setIsRegister(false);
  };

  // ---------- forgot ----------
  const handleForgot = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!forgotEmail) return setErrorMsg("Παρακαλώ εισάγετε email");

    console.log("[FORGOT] POST", FORGOT_PASSWORD_URL);
    try {
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const text = await res.text();
      let json: any = undefined;
      try {
        json = JSON.parse(text);
      } catch {}

      console.log("[FORGOT] status:", res.status, "raw:", text);

     if (res.ok && json && json.user && json.user.token) {
        // persist token with your hook (unchanged)
        await loginWithAuthHook(loginEmail, loginPwd);

        // IMPORTANT: pass token as a route param so WebView can bootstrap even if context lags
        router.replace({ pathname: "/web", params: { token: json.user.token } });
        return;
      } else {
        setErrorMsg(
          (json && (json.message || json.error)) ||
            (text && text.slice(0, 300)) ||
            "Αποτυχία αιτήματος επαναφοράς."
        );
      }
    } catch (e) {
      showNetError("POST /forgot-password", e);
    }
  };

  const handleGooglePress = () => {
    Alert.alert("Google", "Σύνδεση με Google – υπό κατασκευή.");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("./main-logo.png")}
        style={styles.logo}
        accessibilityLabel="School logo"
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !isRegister && styles.activeTab]}
          onPress={() => setIsRegister(false)}
        >
          <Text style={[styles.tabText, !isRegister && styles.activeTabText]}>
            Είσοδος
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, isRegister && styles.activeTab]}
          onPress={() => setIsRegister(true)}
        >
          <Text style={[styles.tabText, isRegister && styles.activeTabText]}>
            Εγγραφή
          </Text>
        </TouchableOpacity>
      </View>

      {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      {!!successMsg && <Text style={styles.success}>{successMsg}</Text>}

      {!isRegister ? (
        !openForgot ? (
          // Login
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={24} color={PRIMARY} />
              <TextInput
                style={styles.input}
                placeholder="email / username"
                placeholderTextColor="#bdbdbd"
                value={loginEmail}
                onChangeText={setLoginEmail}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={24} color={PRIMARY} />
              <TextInput
                style={styles.input}
                placeholder="Κωδικός"
                placeholderTextColor="#bdbdbd"
                value={loginPwd}
                onChangeText={setLoginPwd}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.ctaButton} onPress={handleLogin}>
              <Text style={styles.ctaButtonText}>Είσοδος</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGooglePress}
            >
              <Ionicons name="logo-google" size={22} color="#fff" />
              <Text style={styles.googleText}>Σύνδεση με Google</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Forgot
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={24} color={PRIMARY} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#bdbdbd"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity onPress={() => setOpenForgot(false)}>
              <Text style={styles.linkText}>Σύνδεση</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctaButton} onPress={handleForgot}>
              <Text style={styles.ctaButtonText}>Αποστολή</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        // Register (UI only here)
        <View style={styles.form}>
          <View style={styles.dualInput}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons name="person" size={24} color={PRIMARY} />
              <TextInput
                style={styles.input}
                placeholder="Όνομα"
                placeholderTextColor="#bdbdbd"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons name="person" size={24} color={PRIMARY} />
              <TextInput
                style={styles.input}
                placeholder="Επίθετο"
                placeholderTextColor="#bdbdbd"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={24} color={PRIMARY} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#bdbdbd"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.dualInput}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons name="lock-closed" size={24} color={PRIMARY} />
              <TextInput
                style={styles.input}
                placeholder="Κωδικός"
                placeholderTextColor="#bdbdbd"
                value={pwd}
                onChangeText={setPwd}
                secureTextEntry
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons name="lock-closed" size={24} color={PRIMARY} />
              <TextInput
                style={styles.input}
                placeholder="Επιβεβαίωση κωδικού"
                placeholderTextColor="#bdbdbd"
                value={repeatPwd}
                onChangeText={setRepeatPwd}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.terms}>
            <Switch
              value={acceptTerms}
              onValueChange={setAcceptTerms}
              trackColor={{ false: "#767577", true: "#b7b967" }}
              thumbColor={acceptTerms ? PRIMARY : "#d1d1d1"}
            />
            <Text style={styles.termsText}>
              Αποδέχομαι τους{" "}
              <Text
                style={styles.linkText}
                onPress={() => setShowTermsModal(true)}
              >
                όρους χρήσης
              </Text>{" "}
              και{" "}
              <Text
                style={styles.linkText}
                onPress={() => setShowProtectionModal(true)}
              >
                πολιτικής προστασίας
              </Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={handleRegister}>
            <Text style={styles.ctaButtonText}>Εγγραφή</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGooglePress}
          >
            <Ionicons name="logo-google" size={22} color="#fff" />
            <Text style={styles.googleText}>Εγγραφή με Google</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Terms / Protection Modal */}
      <Modal
        visible={showTermsModal || showProtectionModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {showTermsModal ? "Όροι Χρήσης" : "Πολιτική Προστασίας"}
            </Text>
            <Text style={styles.modalText}>[Περιεχόμενο εδώ]</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowTermsModal(false);
                setShowProtectionModal(false);
              }}
            >
              <Ionicons name="close" size={30} color="#ccc" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: BG,
  },
  logo: {
    width: 220,
    height: 70,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 14,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  activeTab: { borderColor: PRIMARY },
  tabText: { fontSize: 18, fontWeight: "bold", color: "#bdbdbd" },
  activeTabText: { color: PRIMARY },

  debugBox: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: INPUT_BG,
  },
  debugLine: { color: TEXT, fontWeight: "600" },
  debugLineSmall: { color: "#bbb", fontSize: 12, marginTop: 4 },
  testBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    backgroundColor: PRIMARY,
  },
  testBtnText: { color: "#000", fontWeight: "700" },

  form: { width: "100%" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  input: { flex: 1, marginLeft: 10, color: TEXT },
  dualInput: { flexDirection: "row", justifyContent: "space-between" },
  halfInput: { width: "48%" },

  linkText: { color: PRIMARY, marginBottom: 10, textAlign: "right" },

  ctaButton: {
    backgroundColor: PRIMARY,
    padding: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaButtonText: { color: "#000", fontWeight: "bold" },

  googleButton: {
    flexDirection: "row",
    backgroundColor: "transparent",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  googleText: { color: "#fff", fontWeight: "bold", marginLeft: 10 },

  error: { color: "#ff6f6f", marginBottom: 10, textAlign: "center" },
  success: { color: "#2ecc71", marginBottom: 10, textAlign: "center" },

  terms: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  termsText: { marginLeft: 10, flex: 1, color: TEXT },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: INPUT_BG,
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: TEXT,
  },
  modalText: { color: "#e0e0e0" },
  closeButton: { position: "absolute", top: 10, right: 10 },
});
