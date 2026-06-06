import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const { onSnapshot } = await import("firebase/firestore");

        unsubscribeDoc = onSnapshot(
          userDocRef,
          (userDoc) => {
            if (userDoc.exists()) {
              let data = userDoc.data();
              const superAdminEmails = [
                "automate.big1cs@gmail.com",
                "admi.admine@gmail.com",
                "automate@big1cs.com",
                "automate.big1cs.com",
              ];
              if (
                currentUser.email &&
                superAdminEmails.includes(currentUser.email.toLowerCase()) &&
                (data?.role !== "super_admin" || data?.status !== "approved")
              ) {
                setDoc(
                  userDocRef,
                  {
                    role: "super_admin",
                    status: "approved",
                    updatedAt: Date.now(),
                  },
                  { merge: true },
                ).catch((err) => console.error("Self-heal fail", err));
                data = { ...data, role: "super_admin", status: "approved" };
              }
              setProfile(data);
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error(err);
            setProfile(null);
            setLoading(false);
          },
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email?: string, password?: string) => {
    try {
      let result;
      if (email && password) {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: "select_account",
        });
        result = await signInWithPopup(auth, provider);
      }

      // Wait for AuthStateChanged to handle profile fetching
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        try {
          const superAdminEmails = [
            "automate.big1cs@gmail.com",
            "admi.admine@gmail.com",
            "automate@big1cs.com",
            "automate.big1cs.com",
          ];
          const userEmail = result.user.email || "";
          const isSuperAdmin = userEmail
            ? superAdminEmails.includes(userEmail.toLowerCase())
            : false;

          let assignedRole = isSuperAdmin ? "super_admin" : "member";
          let assignedStatus = isSuperAdmin ? "approved" : "pending";

          if (!isSuperAdmin && userEmail) {
            const inviteQuery = query(
              collection(db, "admin_invites"),
              where("email", "==", userEmail.toLowerCase()),
            );
            const inviteSnapshot = await getDocs(inviteQuery);
            if (!inviteSnapshot.empty) {
              assignedRole = "admin";
            }
          }

          let invitedBy = null;
          let invitedTier = null;
          if (!isSuperAdmin && userEmail) {
            const teamInviteQuery = query(
              collection(db, "team_invites"),
              where("email", "==", userEmail.toLowerCase()),
            );
            const teamInviteSnapshot = await getDocs(teamInviteQuery);
            if (!teamInviteSnapshot.empty) {
              invitedBy = teamInviteSnapshot.docs[0].data().partnerId;
              invitedTier = teamInviteSnapshot.docs[0].data().tier;
            }
          }

          await setDoc(userDocRef, {
            name: result.user.displayName || "New User",
            email: userEmail,
            role: assignedRole,
            status: assignedStatus,
            ...(invitedBy && { invitedBy }),
            ...(invitedTier && { tier: invitedTier }),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } catch (err) {
          console.error("Failed to create user profile", err);
        }
      }
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        console.error("Login error:", error);
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const userDocRef = doc(db, "users", result.user.uid);
      const superAdminEmails = [
        "automate.big1cs@gmail.com",
        "admi.admine@gmail.com",
        "automate@big1cs.com",
        "automate.big1cs.com",
      ];
      const isSuperAdmin = superAdminEmails.includes(email.toLowerCase());

      let assignedRole = isSuperAdmin ? "super_admin" : "member";
      let assignedStatus = isSuperAdmin ? "approved" : "pending";

      if (!isSuperAdmin) {
        const inviteQuery = query(
          collection(db, "admin_invites"),
          where("email", "==", email.toLowerCase()),
        );
        const inviteSnapshot = await getDocs(inviteQuery);
        if (!inviteSnapshot.empty) {
          assignedRole = "admin";
        }
      }

      let invitedBy = null;
      let invitedTier = null;
      if (!isSuperAdmin) {
        const teamInviteQuery = query(
          collection(db, "team_invites"),
          where("email", "==", email.toLowerCase()),
        );
        const teamInviteSnapshot = await getDocs(teamInviteQuery);
        if (!teamInviteSnapshot.empty) {
          invitedBy = teamInviteSnapshot.docs[0].data().partnerId;
          invitedTier = teamInviteSnapshot.docs[0].data().tier;
        }
      }

      await setDoc(userDocRef, {
        name: name || "New User",
        email: email,
        role: assignedRole,
        status: assignedStatus,
        ...(invitedBy && { invitedBy }),
        ...(invitedTier && { tier: invitedTier }),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error: any) {
      const isEmailInUse = 
        error?.code === "auth/email-already-in-use" || 
        error?.message?.includes("auth/email-already-in-use") || 
        error?.message?.includes("email-already-in-use");

      if (isEmailInUse) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (loginError: any) {
          throw new Error(
            "Account exists with a different password. Please return to login.",
          );
        }
      } else {
        console.error("Signup error:", error);
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
