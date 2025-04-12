import React from "react";
import { supabase } from "../../lib/supabase";

export default function SignOut({ onSignOut }) {
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (onSignOut) onSignOut();
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <button className="signout-button" onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
