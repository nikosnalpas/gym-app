import { useState, useCallback } from "react";
import { SIGN_IN_URL, API_BASE_URL } from "@/constants/config";

type User = { token: string; user_id: number /* ... */ };

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const url = SIGN_IN_URL;
    console.log("[AUTH] POST", url, { email });

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (e: any) {
      console.log("[AUTH] fetch error:", e?.message || e);
      // surface the raw message so we see "Network request failed" etc.
      throw new Error(e?.message || "network-failed");
    }

    const text = await res.text();
    console.log(
      "[AUTH] status:",
      res.status,
      "body(200 chars):",
      text.slice(0, 200)
    );

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // backend might return plain text on error
    }

    if (!res.ok) {
      const msg = (data && data.message) || `http-${res.status}`;
      throw new Error(msg);
    }

    // expected: { status:200, user: {..., token}, schools: [...] }
    const user: User | undefined = data?.user;
    if (!user?.token) throw new Error("missing-token");

    setToken(user.token);
    return user;
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
  }, []);

  return { token, login, logout };
}
