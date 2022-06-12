import { Button } from "@nextui-org/react";
import { useEffect, useState } from "react";

const SERVERS = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};

const VideoChat = () => {
  const [localStream, setLocalStream] = useState<any>();
  const [remoteStream, setRemoteStream] = useState<any>();
  const [offer, setOffer] = useState<any>();
  const [answer, setAnswer] = useState<any>();
  const [peer, setPeer] = useState<any>();

  const pc = new RTCPeerConnection(SERVERS);

  const createOffer = async () => {
    // call getRemoteStream now
    getRemoteStream();

    localStream.getTracks().forEach((track: any) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = async (event) => {
      event.streams[0].getTracks().forEach((track: any) => {
        remoteStream.addTrack(track);
      });
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        setOffer(pc.localDescription);
      }
    };

    let _offer = await pc.createOffer();
    setOffer(_offer);
    await pc.setLocalDescription(_offer);
    console.log(offer, "offer");
  };

  const createAnswer = async () => {
    // call getRemoteStream now
    getRemoteStream();

    localStream.getTracks().forEach((track: any) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = async (event) => {
      event.streams[0].getTracks().forEach((track: any) => {
        remoteStream.addTrack(track);
      });
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        setOffer(pc.localDescription);
      }
    };

    if (!offer) {
      return alert("No offer from peer");
    }

    await pc.setRemoteDescription(offer);
    let _answer = await pc.createAnswer();
    await pc.setLocalDescription(_answer);
    setAnswer(answer);
  };

  const connect = async () => {
    if (!offer || !answer) {
      return alert("No offer or answer from peer");
    }
    if (!pc.currentLocalDescription) {
      pc.setRemoteDescription(answer);
    }
  };

  const startWebCam = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setLocalStream(stream);
      });
  };

  const getRemoteStream = () => {
    let rm = new MediaStream();
    setRemoteStream(rm);
  };

  useEffect(() => {
    // fetchLocalStream();
  }, []);

  return (
    <>
      <div className="video-wrapper">
        <video
          className="video-player"
          id="user-1"
          autoPlay
          playsInline
          ref={(video) => {
            if (video) {
              video.srcObject = localStream;
            }
          }}
        ></video>
        {/* <video
          className="video-player"
          id="user-1"
          autoPlay
          playsInline
          ref={(video) => {
            if (video) {
              video.srcObject = remoteStream;
            }
          }}
        ></video> */}
        <Button.Group color="gradient" ghost>
          <Button onClick={startWebCam}>Start WebCam</Button>
          <Button onClick={createOffer}>Call</Button>
          <Button onClick={createAnswer}>answer</Button>
        </Button.Group>
      </div>
    </>
  );
};

export default VideoChat;
