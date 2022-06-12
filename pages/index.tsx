import { Session } from "@supabase/gotrue-js/src/lib/types";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import "../styles/Home.module.css";
import { supabase } from "../utils/supbaseClient";
import Account from "./components/Account";
import Auth from "./components/Auth";
const Home: NextPage = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(supabase.auth.session());

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <div className="container" style={{ padding: "50px 0 100px 0" }}>
      {!session ? (
        <Auth />
      ) : (
        <Account key={session ?? session.user.id} session={session} />
      )}
    </div>
  );
};

export default Home;
