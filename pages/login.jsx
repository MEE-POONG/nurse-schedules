import LoadingComponent from "@/components/LoadingComponent";
import { useRouter } from "next/router";
import { useState } from "react";
import { authProvider } from "src/authProvider";

function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);




  return (
    <>
      {loading ? (
        <LoadingComponent />
      ) : (
        <></>
      )}
      <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
        <div className="justify-center text-center h2 text-xl font-normal leading-normal mt-0 mb-2 text-black">
          ลงชื่อเข้าใช้งาน
        </div>
        <form
          className="w-full"
          onSubmit={async (x) => {
            x.preventDefault();
            const username = x.target.username.value;
            const password = x.target.password.value;
            if (!username || !password) {
              alert("กรุณากรอกข้อมูลให้ครบ");
              return;
            }
            setLoading(true);
            const auth = await authProvider.login({ username: username, password: password });
            if (auth.success === false) {
              alert(auth.message);
              return;
            }
            x.target.username.value = "";
            x.target.password.value = "";
            router.push(auth.redirectTo);
            setLoading(false);
          }}
        >
          <div className="flex flex-wrap -mx-3 mb-6 justify-center">

            <div className="w-full md:w-3/12 px-3 mb-6 md:mb-0">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                for="grid-state"
              >
                ชื่อผู้ใช้งาน
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            <div className="w-full md:w-3/12 px-3 mb-6 md:mb-0">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                for="grid-state"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>


            <div className="w-full md:w-1/12 px-3 mb-6 md:mb-0">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                for="grid-state"
              >
                เข้าสู่ระบบ
              </label>
              <div className="relative">
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded whitespace-nowrap">
                  เข้าสู่ระบบ
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}


export async function getServerSideProps(ctx) {
  if (!authProvider.check(ctx).redirectTo) {
    return {
      redirect: {
        permanent: false,
        destination: authProvider.check(ctx).redirectTo || '/',
      }
    }
  }
  return {
    props: {}
  }
}

export default SignIn

