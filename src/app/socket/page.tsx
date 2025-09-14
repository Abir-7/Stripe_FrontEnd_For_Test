/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEYS = {
  url: "socketio-url",
  token: "socketio-token",
  sendEvent: "socketio-sendEvent",
  receiveEvent: "socketio-receiveEvent",
  sendData: "socketio-sendData",
  latestData: "socketio-latestData",
};

export default function SocketIOClient() {
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  const [url, setUrl] = useState("http://localhost:3001");
  const [token, setToken] = useState("token123");
  const [sendEvent, setSendEvent] = useState("send-message");
  const [receiveEvent, setReceiveEvent] = useState("receive-message");
  const [sendData, setSendData] = useState('{"text": "Hello World"}');
  const [latestData, setLatestData] = useState<any>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedUrl = localStorage.getItem(STORAGE_KEYS.url);
    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    const savedSendEvent = localStorage.getItem(STORAGE_KEYS.sendEvent);
    const savedReceiveEvent = localStorage.getItem(STORAGE_KEYS.receiveEvent);
    const savedSendData = localStorage.getItem(STORAGE_KEYS.sendData);
    const savedLatest = localStorage.getItem(STORAGE_KEYS.latestData);

    if (savedUrl) setUrl(savedUrl);
    if (savedToken) setToken(savedToken);
    if (savedSendEvent) setSendEvent(savedSendEvent);
    if (savedReceiveEvent) setReceiveEvent(savedReceiveEvent);
    if (savedSendData) setSendData(savedSendData);
    if (savedLatest) setLatestData(JSON.parse(savedLatest));
  }, []);

  // Persist values
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.url, url);
  }, [url]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.token, token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sendEvent, sendEvent);
  }, [sendEvent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.receiveEvent, receiveEvent);
  }, [receiveEvent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sendData, sendData);
  }, [sendData]);

  useEffect(() => {
    if (latestData !== null) {
      localStorage.setItem(STORAGE_KEYS.latestData, JSON.stringify(latestData));
    }
  }, [latestData]);

  // Connect to server
  const connect = () => {
    if (!token) return alert("Please enter a token");

    setIsConnecting(true);
    setConnectionStatus("Connecting...");

    const socket = io(url, {
      transports: ["websocket"],
      auth: { token },
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionStatus("Connected");
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionStatus("Disconnected");
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (err: any) => {
      setConnectionStatus(`Connection Error: ${err.message}`);
      setIsConnecting(false);
      console.error("Connection error:", err);
    });

    socket.on("connect_timeout", () => {
      setConnectionStatus("Connection Timeout");
      setIsConnecting(false);
    });

    // Only save latest received data
    socket.on(receiveEvent, (data: any) => {
      setLatestData({
        event: receiveEvent,
        data,
        timestamp: new Date().toISOString(),
      });
    });
  };

  const disconnect = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus("Disconnected");
  };

  const sendMessage = () => {
    if (!socketRef.current || !isConnected)
      return alert("Please connect first");

    try {
      const dataToSend = JSON.parse(sendData);
      socketRef.current.emit(sendEvent, dataToSend);
      console.log("Sent data:", dataToSend);
    } catch {
      alert("Invalid JSON format");
    }
  };

  const clearLatestData = () => {
    setLatestData(null);
    localStorage.removeItem(STORAGE_KEYS.latestData);
  };

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="bg-background p-6">
      <div className="container mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Socket.IO Client
          </h1>
          <p className="text-muted-foreground">
            Connect to Socket.IO servers and exchange real-time data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection & Events */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>
                Configure your Socket.IO connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="url">Server URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />

              <Label htmlFor="token">JWT Token</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />

              <Label htmlFor="sendEvent">Send Event Name</Label>
              <Input
                id="sendEvent"
                value={sendEvent}
                onChange={(e) => setSendEvent(e.target.value)}
              />

              <Label htmlFor="receiveEvent">Receive Event Name</Label>
              <Input
                id="receiveEvent"
                value={receiveEvent}
                onChange={(e) => setReceiveEvent(e.target.value)}
              />

              <div className="flex items-center gap-2 mt-2">
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {connectionStatus}
                </Badge>
              </div>

              <div className="flex gap-2 mt-2">
                <Button
                  onClick={connect}
                  disabled={isConnected || isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
                <Button
                  onClick={disconnect}
                  disabled={!isConnected}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Send Data */}
          <Card>
            <CardHeader>
              <CardTitle>Send Data</CardTitle>
              <CardDescription>Send JSON data to the server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="sendData">Data (JSON)</Label>
              <Textarea
                id="sendData"
                value={sendData}
                onChange={(e) => setSendData(e.target.value)}
                rows={6}
              />
              <Button
                onClick={sendMessage}
                disabled={!isConnected}
                className="w-full"
              >
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Latest Received Data */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Latest Received Data</CardTitle>
              <CardDescription>
                Only shows the most recent message
              </CardDescription>
            </div>
            <Button
              onClick={clearLatestData}
              variant="outline"
              size="sm"
              disabled={!latestData}
            >
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            {!latestData ? (
              <div className="text-center py-8 text-muted-foreground">
                No data received yet.
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded text-sm max-h-96 overflow-y-auto">
                {JSON.stringify(latestData, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
