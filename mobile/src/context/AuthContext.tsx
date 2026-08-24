import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'parent' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  status: 'pending' | 'verified' | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  status: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [status, setStatus] = useState<'pending' | 'verified' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role || 'parent');
            setStatus(userData.status_verifikasi || 'verified');
          } else {
            // Check if user's email is whitelisted as admin by Superadmin
            const emailKey = (currentUser.email || '').toLowerCase().trim();
            const whitelistDoc = await getDoc(doc(db, 'whitelist_admins', emailKey));
            
            if (whitelistDoc.exists()) {
              const wlData = whitelistDoc.data();
              // Save user as admin in users collection
              await setDoc(doc(db, 'users', currentUser.uid), {
                uid: currentUser.uid,
                name: wlData.namaLengkap || currentUser.displayName || '',
                email: currentUser.email,
                role: 'admin',
                status_verifikasi: 'verified',
                institusi: wlData.institusi || '',
                kota: wlData.kota || '',
                wilayah: wlData.wilayah || '',
                jenisNakes: wlData.jenisNakes || '',
                strNomor: wlData.strNomor || '',
                noTelp: wlData.noTelp || '',
                createdAt: new Date().toISOString()
              });
              setRole('admin');
              setStatus('verified');
            } else {
              // New parent user, defaults
              setRole('parent');
              setStatus('verified');
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setRole('parent');
          setStatus('verified');
        }
      } else {
        setUser(null);
        setRole(null);
        setStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, status }}>
      {children}
    </AuthContext.Provider>
  );
};
