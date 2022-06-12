import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { supabase } from "../../utils/supbaseClient";
import VideoChat from "../components/VideoChat";

let socket;

export default function Account2({ session }: any) {
  const [loading, setLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  const [localID, setLocalID] = useState<string | null>(null);
  //const [peerConnections, setPeerConnections] = useState<any>([]);
  const [initiator, setInitiator] = useState<boolean>(false);
  const [peerIDs, setPeerIDs] = useState<any>();

  const _peerIds = useRef();
  const peerConnections = {} as any;

  useEffect(() => {
    const wsConnection = new WebSocket("ws://localhost:8081");
    wsConnection.onopen = (e) => {
      console.log(`wsConnection open to 127.0.0.1:8081`, e);
    };
    wsConnection.onerror = (e) => {
      console.error(`wsConnection error `, e);
    };
    wsConnection.onclose = (e) => {
      console.log(`wsConnection closed `, e);
    };
    wsConnection.onmessage = (e) => {
      console.log(JSON.parse(e.data));
      let data = JSON.parse(e.data);
      switch (data.type) {
        case "connection":
          setLocalID(data.id);
          break;
        case "ids":
          setPeerIDs(data.ids);
          _peerIds.current = data.ids;
          console.log("~~~> ids");
          // call connect
          connect(wsConnection);
          break;
        case "signal":
          console.log("signale ~~~~");
          signal(data.id, data.data);
          break;
      }
    };
  }, []);

  const onPeerData = (id: string, data: any) => {
    console.log(`data from ${id}`, data);
  };

  const connect = (wsConnection: any) => {
    Object.keys(peerConnections).forEach((id) => {
      if (!peerIDs.includes(id)) {
        peerConnections[id].destroy();
        delete peerConnections[id];
      }
    });

    // since we are the only first one to join, we need to be the initiator
    if (peerIDs?.length === 1) {
      setInitiator(true);
    }

    peerIDs &&
      peerIDs.forEach((id: string) => {
        if (id === localID || peerConnections[id]) {
          console.log(`skipping ${id}`);
          return;
        }

        let peer = new Peer({
          initiator: initiator,
        });

        peer.on("error", () => {
          console.log("errpr");
        });
        peer.on("signal", (data: any) => {
          wsConnection.send(
            JSON.stringify({
              type: "signal",
              id: localID,
              data,
            })
          );
        });
        peer.on("data", (data: any) => {
          onPeerData(id, data);
        });
        peerConnections[id] = peer;
      });
  };

  const signal = (id: string, data: any) => {
    if (peerConnections[id]) {
      peerConnections[id].signal("signal");
    }
  };

  useEffect(() => {
    getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const user = supabase.auth.user();

      let { data, error, status } = await supabase
        .from("profiles")
        .select(`id,username, website, avatar_url`)
        .eq("id", user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        console.log(data, "~~~~>");
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({ username, website, avatar_url }: any) {
    try {
      setLoading(true);
      const user = supabase.auth.user();

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      let { error } = await supabase.from("profiles").upsert(updates, {
        returning: "minimal", // Don't return the value after inserting
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-widget">
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={session.user.email} disabled />
      </div>
      <div>
        <label htmlFor="username">Name</label>
        <input
          id="username"
          type="text"
          value={username || ""}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="website"
          value={website || ""}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <button
          className="button block primary"
          onClick={() => updateProfile({ username, website, avatar_url })}
          disabled={loading}
        >
          {loading ? "Loading ..." : "Update"}
        </button>
      </div>

      <div>
        <button
          className="button block"
          onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </button>
      </div>
      <VideoChat />
    </div>
  );
}
