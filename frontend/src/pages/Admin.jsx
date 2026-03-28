import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../components/PageWrapper";
import { getMe } from "../services/api";
import { banUser, getAdminStats, getUsers, unbanUser } from "../services/admin";

export default function Admin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const me = await getMe();
      setCurrentUser(me);

      if (me.role !== "admin") {
        toast.error("Acces reserve aux admins.");
        window.location.href = "/dashboard";
        return;
      }

      const [adminStats, adminUsers] = await Promise.all([
        getAdminStats(),
        getUsers(),
      ]);

      setStats(adminStats);
      setUsers(adminUsers);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger l'admin panel.");
    }
  };

  const handleBan = async (userId) => {
    try {
      await banUser(userId);
      toast.success("Utilisateur banni.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de bannir cet utilisateur.");
    }
  };

  const handleUnban = async (userId) => {
    try {
      await unbanUser(userId);
      toast.success("Utilisateur reactive.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de reactiver cet utilisateur.");
    }
  };

  if (currentUser && currentUser.role !== "admin") {
    return null;
  }

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <h1 className="mb-8 text-4xl text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.6)]">
          ADMIN PANEL
        </h1>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="dashboard-card rounded-2xl p-4">
            Users: {stats.total_users ?? 0}
          </div>
          <div className="dashboard-card rounded-2xl p-4">
            Matches: {stats.total_matches ?? 0}
          </div>
          <div className="dashboard-card rounded-2xl p-4">
            Active: {stats.active_users ?? 0}
          </div>
        </div>

        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl bg-white/5 p-4"
            >
              <div>
                {user.email} | ELO: {user.elo} | {user.role}
              </div>

              <div>
                {user.active ? (
                  <button
                    onClick={() => handleBan(user.id)}
                    className="rounded bg-red-500 px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Ban
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnban(user.id)}
                    className="rounded bg-green-500 px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Unban
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
