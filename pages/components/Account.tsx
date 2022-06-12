import { Button, Container, Input } from "@nextui-org/react";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supbaseClient";

const BASE_URL = "http://127.0.0.1:8081";

export default function Account({ session }: any) {
  const [loading, setLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string>();

  const router = useRouter();

  useEffect(() => {
    getProfile();
  }, [session]);

  useEffect(() => {
    generateRoomIdFromServer();
  }, []);

  const generateRoomIdFromServer = async () => {
    const requestOptions = {
      method: "GET",
      redirect: "follow",
      header: {
        "Access-Control-Allow-Origin": "*",
      },
    };
    const res = await axios(`${BASE_URL}/getRoomId`, requestOptions);
    console.log(res)
    setRoomId(res.data.id);
  };

  async function getProfile() {
    try {
      setLoading(true);
      const user = supabase.auth.user();

      let { data, error, status } = await supabase
        .from("profiles")
        .select(`id,username, website, avatar_url`)
        .eq("id", user?.id)
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
    <Container
      display="flex"
      justify="center"
      alignItems="center"
      direction="column"
    >
      <div className="form-widget">
        <div>
          <Input
            label="Email"
            id="email"
            type="text"
            value={session.user.email}
            readOnly
          />
        </div>
        <div>
          <Input
            label="Username"
            id="username"
            type="text"
            value={username || ""}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="Website"
            id="website"
            type="website"
            value={website || ""}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <Button.Group color="gradient" ghost>
          <div>
            <Button
              className="button block primary"
              onPress={() => updateProfile({ username, website, avatar_url })}
              disabled={loading}
            >
              {loading ? "Loading ..." : "Update"}
            </Button>
          </div>

          <div>
            <Button
              className="button block"
              onPress={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </div>
        </Button.Group>
      </div>
      <Button.Group shadow color="gradient">
        <Button
          onPress={() => {
            router.push({
              pathname: `/${roomId}`,
            });
          }}
        >
          Start a Video Chat
        </Button>
        <Button>Join in a Video Chat</Button>
      </Button.Group>
    </Container>
  );
}
