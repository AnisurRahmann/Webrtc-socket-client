import { Button } from "@nextui-org/react";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const BASE_URL = "http://127.0.0.1:8081";

const RoomId = () => {
  const [token, setToken] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<any>();
  const [peers, setPeers] = useState<any>();
  const router = useRouter();
  const { roomId } = router.query;
  const [channels, setChannels] = useState<any>();
  console.log(roomId, "ROOM_ID");

  const rtcConfig = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:global.stun.twilio.com:3478",
        ],
      },
    ],
  };

  const getToken = async () => {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      data: {
        username: "user" + parseInt(Math.random() * 100000).toString(),
      },
    };
    const res = await axios(`${BASE_URL}/access`, requestOptions);
    console.log(res.data);
    setToken(res.data);
  };

  const join = async () => {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Authorization: `Bearer ${token}`,
      },
    };
    const res = await axios(`${BASE_URL}/${roomId}/join`, requestOptions);
  };

  const relay = async (peerID: string, event: string, data: any) => {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Authorization: `Bearer ${token}`,
        data,
      },
    };
    const res = await axios(
      `${BASE_URL}/relay/${peerID}/${event}`,
      requestOptions
    );
    console.log(res);
  };

  let _eventSource = null;

  const connect = async () => {
    if (token === null) {
      getToken();
    }
    // setEventSource(new EventSource(`${BASE_URL}/connect?token=${token}`));
    _eventSource = new EventSource(`${BASE_URL}/connect?token=${token}`);
    _eventSource.addEventListener("add-peer", addPeer, false);
    _eventSource.addEventListener("remove-peer", removePeer, false);
    _eventSource.addEventListener(
      "session-description",
      sessionDescription,
      false
    );
    _eventSource.addEventListener("ice-candidate", iceCandidate, false);
    _eventSource.addEventListener("connected", () => {
      console.log("connected");
      join();
    });
  };

  const addPeer = (data: any) => {
    let message = JSON.parse(data.data);
    if (peers[message.peer.id]) {
      return;
    }
    let peer = new RTCPeerConnection(rtcConfig);
    setPeers({ ...peers, [message.peer.id]: peer });
    peer.onicecandidate = function (event) {
      if (event.candidate) {
        relay(message.peer.id, "ice-candidate", event.candidate);
      }
    };
    // generate offer if required (on join, this peer will create an offer
    // to every other peer in the network, thus forming a mesh)
    if (message.offer) {
      // create the data channel, map peer updates
      let channel = peer.createDataChannel("updates");
      channel.onmessage = function (event) {
        onPeerData(message.peer.id, event.data);
      };
      setChannels({ ...channels, [message.peer.id]: channel });
      console.log(channel, "updates");
      createOffer(message.peer.id, peer);
    } else {
      peer.ondatachannel = function (event) {
        // context.channels[message.peer.id] = event.channel;
        setChannels({ ...channels, [message.peer.id]: event.channel });
        event.channel.onmessage = function (evt) {
          onPeerData(message.peer.id, evt.data);
        };
      };
    }
  };

  const broadcast = (data: any) => {
    console.log(channels);
    for (let peerId in channels) {
      // context.channels[peerId].send(data);
      channels[peerId].send(data);
    }
  };

  const createOffer = async (peerId: string, peer: RTCPeerConnection) => {
    let offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await relay(peerId, "session-description", offer);
  };

  const removePeer = async (data: any) => {
    let message = JSON.parse(data.data);
    if (peers[message.peer.id]) {
      peers[message.peer.id].close();
    }

    delete peers[message.peer.id];
  };

  const sessionDescription = async (data: any) => {
    let message = JSON.parse(data.data);
    let peer = peers[message.peer.id];
    let remoteDescription = new RTCSessionDescription(message.data);
    await peer.setRemoteDescription(remoteDescription);
    if (remoteDescription.type === "offer") {
      let answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await relay(message.peer.id, "session-description", answer);
    }
  };
  const iceCandidate = (data: any) => {
    let message = JSON.parse(data.data);
    let peer = peers[message.peer.id];
    peer.addIceCandidate(new RTCIceCandidate(message.data));
  };

  //   const onPeerData = (id: any, data: any) => {
  //     // draw(JSON.parse(data));
  //     console.log(JSON.parse(data));
  //   };

  function onPeerData(id: any, data: any) {
    console.log(id, "draw");
    draw(JSON.parse(data));
  }

  useEffect(() => {
    connect();
  }, [roomId]);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    var lastPoint;
    var force;

    function randomColor() {
      let r = Math.random() * 255;
      let g = Math.random() * 255;
      let b = Math.random() * 255;
      return `rgb(${r}, ${g}, ${b})`;
    }
    function onPeerData(id: any, data: any) {
      console.log(id, "draw");
      draw(JSON.parse(data));
    }

    var color = randomColor();
    var colorPicker = document.querySelector("[data-color]");
    // colorPicker.dataset.color = color;
    // colorPicker.style.color = color;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function draw(data) {
      ctx.beginPath();
      ctx.moveTo(data.lastPoint.x, data.lastPoint.y);
      ctx.lineTo(data.x, data.y);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = Math.pow(data.force || 1, 4) * 2;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.closePath();
    }

    function move(e) {
      console.log("blue");
      if (e.buttons) {
        if (!lastPoint) {
          lastPoint = { x: e.offsetX, y: e.offsetY };
          return;
        }

        draw({
          lastPoint,
          x: e.offsetX,
          y: e.offsetY,
          force: force,
          color: color,
        });

        broadcast(
          JSON.stringify({
            lastPoint,
            x: e.offsetX,
            y: e.offsetY,
            force: force,
            color: color,
          })
        );

        lastPoint = { x: e.offsetX, y: e.offsetY };
      }
    }

    function up() {
      lastPoint = undefined;
    }

    function key(e) {
      if (e.key === "Backspace") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    function forceChanged(e) {
      force = e.webkitForce || 1;
    }

    window.onresize = resize;
    window.onmousemove = move;
    window.onmouseup = up;
    window.onkeydown = key;

    window.onwebkitmouseforcechanged = forceChanged;

    resize();
  }, []);

  return (
    <>
      <Button onPress={connect}>Access</Button>
      <Button
        onPress={() => {
          console.log(channels);
        }}
      >
        Join
      </Button>
      <div className="flush vstack">
        <div className="menubar hstack">
          <a className="icon-link center">
            <i className="ri-lg ri-landscape-line"></i>
          </a>
          <div className="spacer"></div>
          <a className="icon-link active center">
            <i className="ri-lg ri-pencil-fill"></i>
          </a>
          <div className="spacer"></div>
          <a className="icon-link center">
            <i className="ri-lg ri-palette-line"></i>
            <i className="ri-lg ri-checkbox-blank-fill"></i>
          </a>
          <div className="spacer"></div>
        </div>
        <div className="spacer app">
          <canvas></canvas>
        </div>
      </div>
    </>
  );
};

export default RoomId;
