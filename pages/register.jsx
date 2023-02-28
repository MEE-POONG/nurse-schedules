import LoadingComponent from "@/components/LoadingComponent";
import useAxios from "axios-hooks";

export default function RegisterPage() {

    const [{ data: title }] = useAxios({ url: "/api/title" });
    const [{ data: position }] = useAxios({ url: "/api/position" });

    const [{ loading: loading }, executeUser] = useAxios({ url: "/api/user", method: "POST" }, { manual: true });

    return (
        <>
            {loading ? (
                <LoadingComponent />
            ) : (
                <></>
            )}
            <div className="my-5">
                <div className="text-center mt-10">
                    <h1>ลงทะเบียน</h1>
                </div>
            </div>

            <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
                <div className="justify-center text-center h2 text-xl font-normal leading-normal mt-0 mb-2 text-black">
                    ลงทะเบียนขึ้นเวร
                </div>
                <form
                    className="w-full"
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
                    <div className="flex flex-wrap -mx-3 mb-6">

                        <div className="w-full md:w-2/12 px-3 mb-6 md:mb-0">
                            <label
                                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                                for="grid-state"
                            >
                                คำนำหน้า
                            </label>
                            <div className="relative">
                                <select
                                    id="titleId"
                                    name="titleId"
                                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                >
                                    {title?.map(({ id, name }) => (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg
                                        className="fill-current h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-3/12 px-3 mb-6 md:mb-0">
                            <label
                                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                                for="grid-state"
                            >
                                ชื่อ
                            </label>
                            <div className="relative">
                                <input
                                    id="firstname"
                                    name="firstname"
                                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-3/12 px-3 mb-6 md:mb-0">
                            <label
                                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                                for="grid-state"
                            >
                                นามสกุล
                            </label>
                            <div className="relative">
                                <input
                                    id="lastname"
                                    name="lastname"
                                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-3/12 px-3 mb-6 md:mb-0">
                            <label
                                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                                for="grid-state"
                            >
                                ตำแหน่ง
                            </label>
                            <div className="relative">
                                <select
                                    id="positionId"
                                    name="positionId"
                                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                >
                                    {position?.map(({ id, name }) => (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg
                                        className="fill-current h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-1/12 px-3 mb-6 md:mb-0">
                            <label
                                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                                for="grid-state"
                            >
                                บันทึก
                            </label>
                            <div className="relative">
                                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
