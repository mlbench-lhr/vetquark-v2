'use client'
import { useRef, useEffect } from "react";
import SignaturePad from "signature_pad";

export default function Signature() {
    const canvasRef = useRef(null);
    const sigPadRef = useRef(null);

    useEffect(() => {
        sigPadRef.current = new SignaturePad(canvasRef.current);
    }, []);

    const save = async () => {
        const dataUrl = sigPadRef.current.toDataURL("image/png");

        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "signature.png", { type: "image/png" });

        console.log(file); // 👈 logs image file
    };

    return (
        <>
            <canvas className="bg-muted mx-auto" ref={canvasRef} width={300} height={200} />
            <button onClick={() => sigPadRef.current.clear()} className="me-2">Clear</button>
            <button onClick={save}>Save</button>
        </>
    );
}
