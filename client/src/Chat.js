import React, { useEffect, useState, useRef} from "react";
import ScrollToBottom from "react-scroll-to-bottom";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = [];


  
  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("receive_audio", (audioData) => {
      const audioBlob = new Blob([new Uint8Array(atob(audioData).split("").map((c) => c.charCodeAt(0)))]);
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
    });

  }, [socket]);
  const buttonContainerStyle = {
    display: "flex",
    alignItems: "center",
  };
    const startRecording = async () => {
      console.log("Recording button clicked");

      const constraints = { audio: true };
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("getUserMedia success:", stream);
        mediaRecorder.current = new MediaRecorder(stream);
        console.log("MediaRecorder setup:", mediaRecorder.current);
        // Rest of the code
      } catch (error) {
        console.error("getUserMedia error:", error);
      }

      if (currentMessage !== "" || mediaRecorder.current) {
        if (mediaRecorder.current) {
          mediaRecorder.current.stop();
          setIsRecording(false);
        }

        
        const messageData = {
          room: room,
          author: username,
          message: currentMessage,
          time: `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}`,
        };
    
        if (mediaRecorder.current) {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = reader.result.split(",")[1];
            socket.emit("send_audio", { audio: base64Audio, room });
          };
          reader.readAsDataURL(audioBlob);
        }
    
        await socket.emit("send_message", messageData);
        setMessageList((list) => [...list, messageData]);
        setCurrentMessage("");
      }
  };


  
  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
  
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result.split(",")[1];
        socket.emit("send_audio", { audio: base64Audio, room });
      };
      reader.readAsDataURL(audioBlob);
  
      audioChunks.length = 0; // Clear the audio chunks for the next recording
    }
  };

  const handleAudioReceived = (audioData) => {
    const audioBlob = new Blob([new Uint8Array(atob(audioData).split("").map((c) => c.charCodeAt(0)))]);
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();
  };
  


  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Live Chat</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent) => {
            return (
              <div
                className="message"
                id={username === messageContent.author ? "you" : "other"}
              >
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#9658;</button>


        <div style={buttonContainerStyle}>
        {isRecording ? (
          <button onClick={stopRecording}>&#9724;</button>
          ) : (
            <button onClick={startRecording}>&#9899;</button>

          )
        }
      </div>
      </div>



    </div>
  );

}


export default Chat;
