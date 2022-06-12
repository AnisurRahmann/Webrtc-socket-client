import { Button, Container, Input } from "@nextui-org/react";
import { useState } from "react";
import { supabase } from "../../utils/supbaseClient";

export default function Auth() {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const handleLogin = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signIn({ email });
      if (error) throw error;
      alert("Check your email for the login link!");
    } catch (error: any) {
      console.log(error, "~~~~");
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="row flex flex-center">
        <div className="col-6 form-widget">
          <h1 className="header">Video Chat with WebRTC and Socket</h1>
          <p className="description">
            Sign in via magic link with your email below
          </p>
          <div style={{ marginBottom: "10px" }}>
            <Input
              type="email"
              label="Email"
              className="inputField"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Button
              color="gradient"
              ghost
              onClick={(e) => {
                e.preventDefault();
                handleLogin(email);
              }}
              className="button block"
              disabled={loading}
            >
              <span>{loading ? "Loading" : "Send magic link"}</span>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
