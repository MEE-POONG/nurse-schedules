import { useCallback, useEffect, useRef, useState } from "react";

// ย่อสเกลเนื้อหาที่กว้างกว่าจอ (เช่น ตารางเวรทั้งเดือน) ให้พอดีความกว้างที่มี
// เพื่อเห็นตารางเต็มโดยไม่ต้องเลื่อนแนวนอน — มีผลเฉพาะการแสดงบนจอ
// การพิมพ์ผ่าน react-to-print ดึงเนื้อหาด้านใน (componentRef) ไปพิมพ์ขนาดจริงเหมือนเดิม
const FitToWidth = ({ children }) => {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(null);

  const updateScale = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const naturalWidth = inner.scrollWidth;
    const availableWidth = outer.clientWidth;
    if (!naturalWidth || !availableWidth) return;

    if (naturalWidth > availableWidth) {
      const nextScale = availableWidth / naturalWidth;
      setScale(nextScale);
      setScaledHeight(inner.scrollHeight * nextScale);
    } else {
      setScale(1);
      setScaledHeight(null);
    }
  }, []);

  useEffect(() => {
    updateScale();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateScale);
    if (outerRef.current) observer.observe(outerRef.current);
    if (innerRef.current) observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, [updateScale]);

  return (
    <div
      ref={outerRef}
      style={scaledHeight !== null ? { height: scaledHeight } : undefined}
    >
      <div
        ref={innerRef}
        style={
          scale < 1
            ? {
                width: "max-content",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
};

export default FitToWidth;
