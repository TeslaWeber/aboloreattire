import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

interface AdminCustomersProps {
  customers: Profile[];
}

const AdminCustomers = ({ customers }: AdminCustomersProps) => {
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) =>
    (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Customers</h2>
        <p className="text-sm text-muted-foreground">{customers.length} registered customers</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{search ? "No customers match your search." : "No customers registered yet."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((profile) => (
            <div
              key={profile.id}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary text-lg">
                  {(profile.full_name || profile.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {profile.full_name || "No name provided"}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{profile.phone}</p>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminCustomers;
