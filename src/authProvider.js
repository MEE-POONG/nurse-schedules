import nookies from "nookies";
import axios from "axios";

export const authProvider = {
  login: async ({ email, username, password, remember }) => {
    // Suppose we actually send a request to the back end here.
    const {data: user} = await axios({
      method: "POST",
      url: "/api/login",
      data: {
        username: username,
        password: password,
      },
    })

    if (user) {
      nookies.set(null, "_auth_nurse", JSON.stringify(user), {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
      return {
        success: true,
        redirectTo: "/",
      };
    }

    return {
      success: false,
      error: {
        name: "LoginError",
        message: "Invalid username or password",
      },
    };
  },
  logout: async () => {
    nookies.destroy(null, "_auth_nurse");
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: (context) => {
    const cookies = nookies.get(context);
    if (cookies["_auth_nurse"]) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => {
    const auth = nookies.get()["_auth_nurse"];
    if (auth) {
      const parsedUser = JSON.parse(auth);
      return parsedUser.roles;
    }
    return null;
  },
  getIdentity: () => {
    const auth = nookies.get()["_auth_nurse"];
    if (auth) {
      const parsedUser = JSON.parse(auth);
      return parsedUser;
    }
    return null;
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
};
