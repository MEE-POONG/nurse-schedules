import Image from "next/image";
import { ToastContainer, toast } from 'react-toastify';
import { TbCopy, TbHeartHandshake } from "react-icons/tb";
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
    const notify = () => {
        navigator.clipboard.writeText('0251317542')
        toast("คัดลอก 0251317542 สำเร็จ!")
    };

    return (
        <>
            <div className="flex justify-center px-4 py-10">
                <div className="p-8 w-full max-w-xl text-center card sm:p-10">
                    <div className="flex justify-center mb-4">
                        <span className="flex justify-center items-center w-14 h-14 text-teal-700 rounded-2xl bg-teal-600/10">
                            <TbHeartHandshake size={30} />
                        </span>
                    </div>
                    <h1 className="mb-2 text-xl font-bold tracking-tight text-gray-900">สนับสนุนทีมงาน</h1>
                    <p className="mb-6 text-sm leading-relaxed text-gray-500">
                        เพื่อเป็นกำลังใจให้ทีมงาน และเพื่อให้เว็บไซต์นี้ดำเนินการต่อไปได้
                        <br />ขอบคุณที่สนับสนุนเรา
                    </p>

                    <button
                        onClick={notify}
                        className="inline-flex gap-2 items-center px-5 py-3 mb-6 text-sm font-semibold text-teal-800 rounded-xl transition-colors bg-teal-600/10 ring-1 ring-teal-600/20 hover:bg-teal-600/15"
                    >
                        ธนาคารกสิกรไทย · 025-1-31754-2
                        <TbCopy size={16} />
                    </button>
                    <div className="mb-6 text-xs text-gray-400">ชื่อบัญชี วรายุทธ เทกระโทก · แตะเพื่อคัดลอกเลขบัญชี</div>

                    <div className="overflow-hidden inline-block rounded-2xl ring-1 ring-gray-200">
                        <Image
                            src="https://imagedelivery.net/QZ6TuL-3r02W7wQjQrv5DA/c86e0af9-18e7-44ee-1e59-8763ee396000/public"
                            alt="QR สำหรับโอนสนับสนุน"
                            width={400}
                            height={400}
                        />
                    </div>
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
