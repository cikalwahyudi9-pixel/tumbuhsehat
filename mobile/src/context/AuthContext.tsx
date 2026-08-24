import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'parent' | 'admin' | null;

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  role: UserRole;
  loading: boolean;
  status: 'pending' | 'verified' | null;
  loginWithEmail: (email: string) => Promise<{ role: UserRole; status: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  status: null,
  loginWithEmail: async () => ({ role: 'parent', status: 'verified' }),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [status, setStatus] = useState<'pending' | 'verified' | null>(null);
  const [loading, setLoading] = useState(true);

  // Check role & whitelist in Firestore
  const checkUserRoleAndWhitelist = async (email: string, uid: string, displayName?: string | null) => {
    const emailKey = email.toLowerCase().trim();
    
    try {
      // 1. Check if email is in whitelist_admins
      const whitelistDoc = await getDoc(doc(db, 'whitelist_admins', emailKey));
      
      if (whitelistDoc.exists()) {
        const wlData = whitelistDoc.data();
        await setDoc(doc(db, 'users', uid), {
          uid: uid,
          name: wlData.namaLengkap || displayName || email.split('@')[0],
          email: email,
          role: 'admin',
          status_verifikasi: 'verified',
          createdAt: new Date().toISOString()
        }, { merge: true });
        
        setRole('admin');
        setStatus('verified');
        return { role: 'admin' as UserRole, status: 'verified' };
      }

      // 2. Check users collection
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = (userData.role || 'parent') as UserRole;
        const userStatus = (userData.status_verifikasi || 'verified') as 'pending' | 'verified';
        setRole(userRole);
        setStatus(userStatus);
        return { role: userRole, status: userStatus };
      }

      // 3. New parent user default
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        name: displayName || email.split('@')[0],
        email: email,
        role: 'parent',
        status_verifikasi: 'verified',
        createdAt: new Date().toISOString()
      }, { merge: true });

      setRole('parent');
      setStatus('verified');
      return { role: 'parent' as UserRole, status: 'verified' };
    } catch (error) {
      console.error("Error checking role:", error);
      setRole('parent');
      setStatus('verified');
      return { role: 'parent' as UserRole, status: 'verified' };
    }
  };

  useEffect(() => {
    // Safety timer agar loading tidak pernah macet jika ada keterlambatan koneksi
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(safetyTimer);
      if (currentUser && currentUser.email) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
        await checkUserRoleAndWhitelist(currentUser.email, currentUser.uid, currentUser.displayName);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (rawEmail: string) => {
    const email = rawEmail.trim().toLowerCase();
    const mockUid = 'usr_' + email.replace(/[^a-zA-Z0-9]/g, '_');
    
    const appUser: AppUser = {
      uid: mockUid,
      email: email,
      displayName: email.split('@')[0],
    };
    
    setUser(appUser);
    const result = await checkUserRoleAndWhitelist(email, mockUid, appUser.displayName);
    return result;
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setRole(null);
    setStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, status, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
