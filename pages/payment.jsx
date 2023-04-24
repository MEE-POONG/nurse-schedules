import Image from "next/image";


export default function Home() {
  return (
    <>
    <div className="my-5 items-center justify-center">
      <div className="text-center mt-10 items-center justify-center" Style="text-align: -webkit-center;">
        <h1 className="mb-5 text-black text-bold">สนับสนุนได้ที่นี่เลย</h1>
        <h2 className="mb-5 text-black text-bold">เพื่อเป็นกำลังใจให้ทีมงาน</h2>
        <h2 className="mb-5 text-black text-bold">และเพื่อให้เว็บไซต์นี้ดำเนินการต่อไปได้</h2>
        <h2 className="mb-5 text-black text-bold">ขอบคุณที่สนับสนุนเรา</h2>
        <h2 className="mb-5 text-black text-bold">ธนาคาร กสิกรไทย เลขที่ 025-1-31754-2 ชื่อ วรายุทธ เทกระโทก</h2>
        <Image src="https://imagedelivery.net/QZ6TuL-3r02W7wQjQrv5DA/c86e0af9-18e7-44ee-1e59-8763ee396000/public" alt="Picture of the author" width={500} height={500} />
      </div>
    </div>
    </>
  );
}
