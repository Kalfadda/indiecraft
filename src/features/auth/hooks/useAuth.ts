import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { Profile } from "@/types/database";

// Module-level state to prevent race conditions
let initStarted = false;
let profileFetchId = 0; // Incrementing ID to track latest fetch

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, reset } =
    useAuthStore();

  useEffect(() => {
    // Only initialize once across all hook instances
    if (initStarted) return;
    initStarted = true;

    let authInitComplete = false;

    async function initAuth() {
      try {
        console.log("Initializing auth...");
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log("Session result:", { hasSession: !!session, error: error?.message });

        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("User found, fetching profile...");
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log("No session, showing login");
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setLoading(false);
      } finally {
        authInitComplete = true;
      }
    }

    initAuth();

    // Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      // Skip events that don't need action
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        // INITIAL_SESSION is handled by initAuth, TOKEN_REFRESHED doesn't need profile refetch
        return;
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // SIGNED_IN event - user just logged in
      if (session?.user) {
        setUser(session.user);
        // Only fetch profile if initAuth is done (to avoid double fetch on app load)
        if (authInitComplete) {
          await fetchProfile(session.user.id);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    // Use incrementing ID to ensure only the latest fetch updates state
    const thisFetchId = ++profileFetchId;

    try {
      console.log("Fetching profile for:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // If a newer fetch started, don't update state
      if (thisFetchId !== profileFetchId) {
        console.log("Fetch superseded by newer request");
        return;
      }

      console.log("Profile query result:", { data, error });

      if (error) {
        console.log("Profile fetch error:", error.message);
        setProfile(null);
      } else if (!data) {
        console.log("No profile found");
        setProfile(null);
      } else {
        console.log("Profile loaded:", data.display_name);
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("Profile fetch failed:", err);
      if (thisFetchId === profileFetchId) {
        setProfile(null);
      }
    } finally {
      // Only set loading false if this is still the latest fetch
      if (thisFetchId === profileFetchId) {
        setLoading(false);
      }
    }
  }

  async function signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split("@")[0],
        },
      },
    });

    if (error) throw error;
    return data;
  }

  async function signIn(email: string, password: string) {
    console.log("Attempting sign in for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error.message, error.status);
      throw error;
    }

    console.log("Sign in successful");

    // Directly update state after successful sign-in (don't rely on listener)
    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }

    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    reset();
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isBlocked: profile?.is_blocked ?? false,
    signUp,
    signIn,
    signOut,
  };
}
