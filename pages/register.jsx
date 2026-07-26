import LoadingComponent from "@/components/LoadingComponent";
import useAxios from "axios-hooks";
import { TbUserPlus } from "react-icons/tb";

export default function RegisterPage() {
    const [{ data: title }] = useAxios({ url: "/api/title" });
    const [{ data: position }] = useAxios({ url: "/api/position" });

    const [{ loading: loading }, executeUser] = useAxios({ url: "/api/user", method: "POST" }, { manual: true });

    const fieldCls =
        "w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 bg-gray-50/80 rounded-xl border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white";
    const labelCls = "block mb-1.5 text-xs font-semibold text-gray-600";

    return (
        <>
            {loading && <LoadingComponent />}
            <div className="px-4 py-7 mx-auto max-w-3xl sm:px-6">
                <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline mb-6">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">ลงทะเบียนขึ้นเวร</h1>
                </div>

                <div className="p-6 card sm:p-8">
                    <div className="flex gap-3 items-center pb-5 mb-6 border-b border-gray-100">
                        <span className="flex justify-center items-center w-10 h-10 text-teal-700 rounded-xl bg-teal-600/10">
                            <TbUserPlus size={20} />
                        </span>
                        <div className="leading-tight">
                            <div className="text-sm font-bold text-gray-900">เพิ่มพยาบาล/เจ้าหน้าที่ใหม่</div>
                            <div className="text-xs text-gray-500">กรอกข้อมูลให้ครบทุกช่องแล้วกดบันทึก</div>
                        </div>
                    </div>

                    <form
                        onSubmit={async (x) => {
                            x.preventDefault();
                            const firstname = x.target.firstname.value;
                            const lastname = x.target.lastname.value;
                            const positionId = x.target.positionId.value;
                            const titleId = x.target.titleId.value;
                            await executeUser({
                                data: {
                                    firstname: firstname,
                                    lastname: lastname,
                                    positionId: positionId,
                                    titleId: titleId,
                                },
                            });
                            x.target.firstname.value = "";
                            x.target.lastname.value = "";
                        }}
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls} htmlFor="titleId">คำนำหน้า</label>
                                <select id="titleId" name="titleId" className={`${fieldCls} cursor-pointer`}>
                                    {title?.map(({ id, name }) => (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls} htmlFor="positionId">ตำแหน่ง</label>
                                <select id="positionId" name="positionId" className={`${fieldCls} cursor-pointer`}>
                                    {position?.map(({ id, name }) => (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls} htmlFor="firstname">ชื่อ</label>
                                <input id="firstname" name="firstname" className={fieldCls} />
                            </div>
                            <div>
                                <label className={labelCls} htmlFor="lastname">นามสกุล</label>
                                <input id="lastname" name="lastname" className={fieldCls} />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button className="gap-2 px-6 py-2.5 w-full btn-brand sm:w-auto">
                                <TbUserPlus size={18} /> บันทึกข้อมูล
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
