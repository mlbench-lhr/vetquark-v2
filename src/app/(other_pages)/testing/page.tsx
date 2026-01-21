"use client";
import { useEffect, useRef, useState } from "react";

export default function AutoCaptureCamera() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [error, setError] = useState("");
    const [needsTap, setNeedsTap] = useState(false);

    useEffect(() => {
        let stream;
        let interval;
        let stopTimeout;
        let captures = 0;
        let cancelled = false;

        function isMobileDevice() {
            if (typeof navigator === "undefined") return false;
            return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        }

        async function getBackCameraStream() {
            try {
                return await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { exact: "environment" } },
                    audio: false,
                });
            } catch { }

            try {
                return await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });
            } catch { }

            const tmp = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter((d) => d.kind === "videoinput");

                const preferred =
                    videoInputs.find((d) => /back|rear|environment/i.test(d.label)) ||
                    videoInputs[videoInputs.length - 1];

                if (!preferred?.deviceId) throw new Error("Back camera not found.");

                return await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: preferred.deviceId } },
                    audio: false,
                });
            } finally {
                tmp.getTracks().forEach((t) => t.stop());
            }
        }

        function stopStream() {
            clearInterval(interval);
            clearTimeout(stopTimeout);
            if (stream) stream.getTracks().forEach((t) => t.stop());
        }

        async function startCamera() {
            setError("");
            setNeedsTap(false);

            if (!isMobileDevice()) {
                setError("Mobile device required.");
                return;
            }

            if (!window.isSecureContext) {
                setError(
                    "Camera requires HTTPS. On a phone, use an HTTPS URL (or run dev with --experimental-https).",
                );
                return;
            }

            if (!navigator.mediaDevices?.getUserMedia) {
                setError("Camera API not available in this browser.");
                return;
            }

            try {
                stream = await getBackCameraStream();
                if (cancelled) {
                    stopStream();
                    return;
                }

                const video = videoRef.current;
                video.srcObject = stream;

                await new Promise((resolve) => {
                    if (video.readyState >= 1) resolve();
                    else video.onloadedmetadata = () => resolve();
                });

                try {
                    await video.play();
                } catch {
                    setNeedsTap(true);
                    return;
                }

                stopTimeout = setTimeout(() => {
                    stopStream();
                }, 120000);

                interval = setInterval(() => {
                    capture();
                    captures++;
                    if (captures === 4) stopStream();
                }, 30000);
            } catch (e) {
                setError(e?.message || "Failed to start camera.");
            }
        }

        function capture() {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (!video?.videoWidth || !video?.videoHeight) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0);

            const img = canvas.toDataURL("image/jpeg");
            setImages((prev) => [...prev, img]);
        }

        startCamera();

        return () => {
            cancelled = true;
            stopStream();
        };
    }, []);

    return (
        <div>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", background: "#000", borderRadius: 12 }}
            />
            <canvas ref={canvasRef} hidden />

            {error ? (
                <div style={{ marginTop: 12, color: "#b00020" }}>{error}</div>
            ) : needsTap ? (
                <button
                    onClick={() => videoRef.current?.play()}
                    style={{ marginTop: 12, padding: "10px 12px" }}
                >
                    Start Camera
                </button>
            ) : (
                <div style={{ marginTop: 12, opacity: 0.8 }}>
                    Camera active for 120 seconds.
                </div>
            )}

            <h3>Captured Images</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {images.map((src, i) => (
                    <img key={i} src={src} width={120} />
                ))}
            </div>
        </div>
    );
}
