import Image from "next/image";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



export default function Home() {

    const notify = () => {
        navigator.clipboard.writeText('0251317542')
        toast("คัดลอก 0251317542 สำเร็จ!")
    };

    return (
        <>
            <div className="my-5 items-center justify-center">
                <div onClick={notify} className="text-center mt-10 items-center justify-center" Style="text-align: -webkit-center;">
                    <h1 className="mb-5 text-black text-bold">สนับสนุนได้ที่นี่เลย</h1>
                    <h2 className="mb-5 text-black text-bold">เพื่อเป็นกำลังใจให้ทีมงาน</h2>
                    <h2 className="mb-5 text-black text-bold">และเพื่อให้เว็บไซต์นี้ดำเนินการต่อไปได้</h2>
                    <h2 className="mb-5 text-black text-bold">ขอบคุณที่สนับสนุนเรา</h2>
                    <h2 className="mb-5 text-black text-bold flex flex-row justify-center">ธนาคาร กสิกรไทย เลขที่ 025-1-31754-2 &nbsp;
                        <svg className="cursor-pointer" version="1.0" xmlns="http://www.w3.org/2000/svg"
                            width="18" height="18" viewBox="0 0 512.000000 512.000000"
                            preserveAspectRatio="xMidYMid meet">

                            <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                                fill="#000000" stroke="none">
                                <path d="M1465 5105 c-206 -45 -379 -182 -471 -370 -24 -50 -44 -94 -44 -98 0 -4 85 -7 188 -7 l188 0 43 44 c24 25 71 57 105 73 l61 28 1260 0 1260 0 60 -28 c78 -36 146 -104 182 -181 l28 -61 0 -1580 0 -1580 -28 -60 c-15 -33 -47 -80 -70 -103 -42 -43 -122 -92 -152 -92 -13 0 -15 112 -15 1041 0 1157 3 1096 -68 1234 -32 63 -81 116 -461 496 -403 403 -430 428 -501 463 -145 70 -97 67 -1111 64 l-914 -3 -84 -29 c-237 -83 -411 -282 -457 -523 -21 -111 -21 -3164 0 -3275 48 -247 223 -445 462 -524 l89 -29 1245 0 1245 0 80 27 c189 64 331 190 410 363 41 89 56 149 64 255 l6 84 65 13 c36 7 108 34 160 59 168 83 300 242 356 429 17 57 19 149 22 1655 3 1796 7 1681 -73 1845 -79 163 -219 286 -394 349 l-86 31 -1295 2 c-1047 1 -1306 -1 -1355 -12z m1345 -1315 c5 -221 8 -261 24 -300 66 -154 190 -266 341 -306 35 -10 121 -14 287 -14 226 0 238 -1 248 -20 7 -13 10 -411 8 -1282 l-3 -1263 -27 -58 c-36 -75 -112 -149 -185 -179 l-58 -23 -1190 0 -1190 0 -61 28 c-77 36 -145 104 -181 182 l-28 60 0 1580 0 1580 28 60 c47 102 141 180 244 204 21 5 421 8 888 8 l850 -2 5 -255z" />
                                <path d="M1298 3120 c-173 -52 -204 -277 -50 -367 l47 -28 545 -3 c371 -2 561 0 596 8 160 34 216 219 101 338 -59 61 -71 62 -671 61 -298 0 -553 -4 -568 -9z" />
                                <path d="M1260 2228 c-24 -13 -58 -40 -74 -61 -29 -36 -31 -45 -31 -117 0 -72 2 -81 31 -117 16 -21 50 -48 74 -60 l44 -23 951 0 c1065 0 994 -4 1062 73 79 90 60 225 -40 294 l-40 28 -966 3 -966 2 -45 -22z" />
                                <path d="M1286 1365 c-91 -32 -136 -95 -136 -189 0 -78 32 -135 98 -173 l47 -28 960 0 960 0 42 22 c110 59 143 200 69 296 -17 22 -49 50 -71 61 -40 21 -48 21 -985 23 -793 2 -951 0 -984 -12z" />
                            </g>
                        </svg>
                        &nbsp;ชื่อ วรายุทธ เทกระโทก</h2>
                    <Image src="https://imagedelivery.net/QZ6TuL-3r02W7wQjQrv5DA/c86e0af9-18e7-44ee-1e59-8763ee396000/public" alt="Picture of the author" width={500} height={500} />
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
