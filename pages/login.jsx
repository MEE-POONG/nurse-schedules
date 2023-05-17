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
      <div className="w-100 p-5 overflow-x-auto" style={{padding: '0px !important'}}>

        <div class="min-h-screen text-gray-900 flex justify-center">
          <div class="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
            <div class="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
              <div>
                <img src="/baner.png"
                  class="w-32 mx-auto" />
              </div>
              <div class="mt-12 flex flex-col items-center">
                <h1 class="text-2xl xl:text-3xl font-extrabold">
                  ลงชื่อเข้าใช้งาน
                </h1>

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
                  <div class="w-full flex-1 mt-8">

                    <div class="mx-auto max-w-xs">
                      <input
                        class="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                        id="username" name="username" type="text" placeholder="username" />
                      <input
                        class="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5"
                        id="password" name="password" type="password" placeholder="Password" />
                      <button
                        class="mt-5 tracking-wide font-semibold bg-indigo-500 text-gray-100 w-full py-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none">
                        <svg class="w-6 h-6 -ml-2" fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round">
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <path d="M20 8v6M23 11h-6" />
                        </svg>
                        <span class="ml-3">
                          ลงชื่อเข้าใช้งาน
                        </span>
                      </button>
                      <p class="mt-6 text-xs text-gray-600 text-center">
                        I agree to abide by templatana's
                        <a href="#" class="border-b border-gray-500 border-dotted">
                          Terms of Service
                        </a>
                        and its
                        <a href="#" class="border-b border-gray-500 border-dotted">
                          Privacy Policy
                        </a>
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="flex-1 bg-indigo-100 text-center hidden lg:flex">
              <div class="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat"
                Style="background-image: url('https://storage.googleapis.com/devitary-image-host.appspot.com/15848031292911696601-undraw_designer_life_w96d.svg');">
              </div>
            </div>
          </div>
        </div>

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

